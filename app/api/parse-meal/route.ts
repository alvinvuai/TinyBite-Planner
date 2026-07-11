import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateUsd, getBudgetUsd, toUsageSummary } from "@/lib/cost";
import { getMealModel, getOpenAiClient, hasOpenAiKey } from "@/lib/openai";
import { ingredientDefinitions, mealTypes } from "@/lib/nutrition";
import { getUsageStore } from "@/lib/usageStore";

export const runtime = "nodejs";

const visibleMealTypes = mealTypes.filter((type) => type !== "Whole day plan");

const parseRequestSchema = z.object({
  today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.string().max(80),
  currentItems: z
    .array(
      z.object({
        ingredientKey: z.string().max(60),
        name: z.string().max(100),
        amount: z.number(),
        unit: z.string().max(40),
      }),
    )
    .max(30),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(12),
});

const aiItemSchema = z.object({
  ingredientKey: z.string().nullish(),
  customName: z.string().max(100).nullish(),
  customCalories: z.number().nullish(),
  amount: z.number().nullish(),
  unit: z.string().max(40).nullish(),
});

const aiParseSchema = z.object({
  status: z.enum(["filled", "question"]),
  question: z.string().max(400).nullish(),
  mealType: z.string().max(80).nullish(),
  date: z.string().nullish(),
  completionPercent: z.number().nullish(),
  items: z.array(aiItemSchema).max(20).nullish(),
  summary: z.string().max(500).nullish(),
});

export type ParsedMealItem = {
  ingredientKey?: string;
  customName?: string;
  customCalories?: number;
  amount?: number;
  unit?: string;
};

export type ParsedMealResponse = {
  status: "filled" | "question";
  question?: string;
  mealType?: string;
  date?: string;
  completionPercent?: number;
  items?: ParsedMealItem[];
  summary?: string;
  usage?: ReturnType<typeof toUsageSummary>;
};

function buildCatalog() {
  return ingredientDefinitions.map((definition) => ({
    key: definition.key,
    name: definition.name,
    aliases: definition.aliases,
    units: definition.units.map((unit) => unit.unit),
    default: `${definition.defaultAmount} ${definition.defaultUnit}`,
  }));
}

function buildSystemPrompt(today: string) {
  return [
    "You are the meal entry assistant for a toddler meal tracking app. The parent describes (by voice or text, in English or Vietnamese) what their toddler ate or will eat. Your job is to fill the meal entry so the parent never types data by hand.",
    "",
    "Return VALID JSON ONLY with this shape:",
    '{ "status": "filled" | "question", "question": string|null, "mealType": string|null, "date": "YYYY-MM-DD"|null, "completionPercent": number|null, "items": [{ "ingredientKey": string|null, "customName": string|null, "customCalories": number|null, "amount": number, "unit": string }], "summary": string }',
    "",
    "Rules:",
    `- mealType must be exactly one of: ${visibleMealTypes.join(" | ")}. Infer it from the food or time of day when possible ("this morning" -> Breakfast). If not stated and not inferable, keep it null.`,
    "- items: map each food to a catalog entry by key, name, or alias. Use ONLY unit ids from that entry's units list. If the parent gave no amount, use the catalog default. Return the FULL final item list for the meal: merge with currentItems, apply corrections (e.g. 'actually only half the rice' means update, 'no banana' means remove).",
    "- Foods not in the catalog: return them as customName with an estimated toddler-portion customCalories (whole number kcal) and note the estimate in summary. Do not ask a question just because a food is not in the catalog.",
    "- completionPercent: only when the parent described how much was eaten ('ate everything' = 100, 'most of it' = 85, 'about half' = 50, 'barely touched' = 10). Round to the nearest 5. Otherwise null.",
    `- date: today is ${today}. Resolve relative words ('yesterday', 'this morning', 'last night'). Null when not mentioned.`,
    "- The parent may speak Vietnamese. Examples: com = rice, trung = egg, chuoi = banana, sua = milk, sua chua = yoghurt, thit ga = chicken, thit bo = beef, thit heo = pork, ca = fish, tom = prawn, dau hu = tofu, banh mi = bread, pho mai = cheese. 'Bo' can mean beef, butter, or avocado - use context or ask.",
    '- status "question": use ONLY when you genuinely cannot proceed: a food matches several distinct catalog entries with different nutrition (e.g. plain "soup" could be beef, chicken, or pork vege soup; "bo" could be beef, butter, or avocado), or several meals are described at once and you need to know which one to fill. Ask ONE short friendly question in the parent\'s language. Never ask more than one question in a row about the same thing - make a sensible assumption instead and mention it in summary.',
    '- status "filled": include a short summary confirming what was filled in, e.g. "Breakfast: 1 egg, 8 tbsp rice, 1/3 banana - ate 80%". Keep it under 2 sentences.',
    "- Transcripts come from speech recognition and may contain mistakes ('ate spoons of rice' likely means '8 spoons of rice'). Interpret generously.",
    "- Never invent foods the parent did not mention. Safety: this app avoids noodles and congee by default; if the parent explicitly says the child ate them, record them as custom items without lecturing.",
    "",
    `Food catalog (key, name, aliases, allowed unit ids, default amount): ${JSON.stringify(buildCatalog())}`,
  ].join("\n");
}

function repairResponse(parsed: z.infer<typeof aiParseSchema>): ParsedMealResponse {
  const items: ParsedMealItem[] = [];
  for (const entry of parsed.items ?? []) {
    if (entry.ingredientKey) {
      const definition = ingredientDefinitions.find((candidate) => candidate.key === entry.ingredientKey);
      if (definition) {
        const unit = definition.units.find((candidate) => candidate.unit === entry.unit)?.unit ?? definition.defaultUnit;
        const amount =
          typeof entry.amount === "number" && Number.isFinite(entry.amount) && entry.amount > 0
            ? Math.min(entry.amount, 2000)
            : definition.defaultAmount;
        items.push({ ingredientKey: definition.key, amount, unit });
        continue;
      }
    }
    const customName = entry.customName?.trim();
    const customCalories = Math.round(entry.customCalories ?? 0);
    if (customName && Number.isFinite(customCalories) && customCalories > 0) {
      items.push({ customName: customName.slice(0, 100), customCalories: Math.min(customCalories, 1000) });
    }
  }

  const mealType = parsed.mealType && visibleMealTypes.includes(parsed.mealType) ? parsed.mealType : undefined;
  const date = parsed.date && /^\d{4}-\d{2}-\d{2}$/.test(parsed.date) ? parsed.date : undefined;
  const completionPercent =
    typeof parsed.completionPercent === "number" && Number.isFinite(parsed.completionPercent)
      ? Math.min(100, Math.max(0, Math.round(parsed.completionPercent / 5) * 5))
      : undefined;

  if (parsed.status === "question" && parsed.question?.trim()) {
    return { status: "question", question: parsed.question.trim() };
  }

  return {
    status: "filled",
    mealType,
    date,
    completionPercent,
    items,
    summary: parsed.summary?.trim() || undefined,
  };
}

export async function POST(request: NextRequest) {
  let rawInput: unknown;
  try {
    rawInput = await request.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", message: "The meal description was missing. Please try again." }, { status: 400 });
  }

  const validation = parseRequestSchema.safeParse(rawInput);
  if (!validation.success) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "The meal description was invalid. Please try again." }, { status: 400 });
  }

  const input = validation.data;
  const store = getUsageStore();
  const usage = await store.get();
  const budgetUsd = getBudgetUsd();

  if (!hasOpenAiKey()) {
    return NextResponse.json(
      { error: "OPENAI_NOT_CONFIGURED", message: "AI meal entry needs OPENAI_API_KEY. Falling back to simple matching." },
      { status: 503 },
    );
  }

  if (usage.estimatedUsd >= budgetUsd) {
    return NextResponse.json(
      { error: "BUDGET_EXCEEDED", message: "The monthly AI budget is used up. Falling back to simple matching." },
      { status: 503 },
    );
  }

  const context = {
    today: input.today,
    currentMealType: input.mealType,
    currentItems: input.currentItems.map((item) => ({
      ingredientKey: item.ingredientKey,
      name: item.name,
      qty: `${item.amount} ${item.unit}`,
    })),
  };

  try {
    const completion = await getOpenAiClient().chat.completions.create({
      model: getMealModel(),
      messages: [
        { role: "system", content: buildSystemPrompt(input.today) },
        { role: "user", content: `Current meal entry state: ${JSON.stringify(context)}` },
        ...input.messages.map((message) => ({ role: message.role, content: message.content })),
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 700,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned an empty meal parse.");

    const parsed = aiParseSchema.parse(JSON.parse(content));
    const inputTokens = completion.usage?.prompt_tokens ?? 2500;
    const outputTokens = completion.usage?.completion_tokens ?? 300;
    const updated = await store.add(inputTokens, outputTokens, calculateUsd({ inputTokens, outputTokens }));

    return NextResponse.json({ ...repairResponse(parsed), usage: toUsageSummary(updated.estimatedUsd) } satisfies ParsedMealResponse);
  } catch (error) {
    console.warn("AI meal parsing failed.", error);
    return NextResponse.json(
      { error: "PARSE_FAILED", message: "The AI helper could not read that meal. Falling back to simple matching." },
      { status: 502 },
    );
  }
}
