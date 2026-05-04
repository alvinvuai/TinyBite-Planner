import { NextRequest, NextResponse } from "next/server";
import { calculateUsd, estimateRequestTokens, getBudgetUsd, maxOutputTokensForMode, toUsageSummary } from "@/lib/cost";
import { fallbackDayPlan, fallbackSingleMeal } from "@/lib/fallbackMeals";
import { buildMealMessages, buildRepairMessages } from "@/lib/mealPrompt";
import { getMealModel, getOpenAiClient, hasOpenAiKey } from "@/lib/openai";
import { generateMealRequestSchema, jsonSchemaForOpenAi, mealAiResponseSchema } from "@/lib/schemas";
import { notifyBudgetThreshold } from "@/lib/notify";
import { getUsageStore } from "@/lib/usageStore";
import type { MealResponse } from "@/types/meal";

export const runtime = "nodejs";

const ipHits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = ipHits.get(ip);
  if (!current || current.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  current.count += 1;
  return current.count > 12;
}

function cleanText(value: string) {
  return value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
}

async function maybeNotifyThresholds(usedUsd: number) {
  const budget = getBudgetUsd();
  const percent = budget > 0 ? (usedUsd / budget) * 100 : 100;
  const store = getUsageStore();
  const record = await store.get();
  for (const threshold of [80, 95, 100]) {
    if (percent >= threshold && !record.thresholdNotified.includes(threshold)) {
      await notifyBudgetThreshold({ threshold, usedUsd });
      await store.markNotified(threshold);
    }
  }
}

function fallbackResponse(input: Awaited<ReturnType<typeof generateMealRequestSchema.parseAsync>>, warning: string): MealResponse {
  return {
    mode: input.mode,
    meal: input.mode === "single" ? fallbackSingleMeal(input) : undefined,
    dayPlan: input.mode === "whole_day" ? fallbackDayPlan(input) : undefined,
    source: "fallback",
    warning,
    usage: toUsageSummary(0),
  };
}

function parseAiText(text: string) {
  const parsedJson = JSON.parse(text);
  return mealAiResponseSchema.parse(parsedJson);
}

export async function POST(request: NextRequest) {
  if (rateLimit(request)) {
    return NextResponse.json({ error: "RATE_LIMITED", message: "Please wait a moment before generating another meal." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const input = generateMealRequestSchema.parse({
    ...body,
    freeText: cleanText(String(body?.freeText || "")),
  });

  const store = getUsageStore();
  const usage = await store.get();
  const budgetUsd = getBudgetUsd();
  const currentSummary = toUsageSummary(usage.estimatedUsd);
  const projectedInputTokens = estimateRequestTokens(input);
  const projectedOutputTokens = maxOutputTokensForMode(input.mode);
  const projectedCost = calculateUsd({ inputTokens: projectedInputTokens, outputTokens: projectedOutputTokens });

  if (!hasOpenAiKey()) {
    return NextResponse.json({
      ...fallbackResponse(input, "OpenAI is not configured, so TinyBite used the built-in toddler meal rules."),
      usage: currentSummary,
    });
  }

  if (usage.estimatedUsd >= budgetUsd || usage.estimatedUsd + projectedCost > budgetUsd) {
    return NextResponse.json(
      {
        error: "MONTHLY_BUDGET_REACHED",
        message: "AI budget limit reached. Please contact Alvin.",
        ...fallbackResponse(input, "AI budget limit reached. TinyBite used the built-in toddler meal rules."),
        usage: currentSummary,
      },
      { status: 402 },
    );
  }

  const client = getOpenAiClient();
  const maxTokens = maxOutputTokensForMode(input.mode);

  try {
    const completion = await client.chat.completions.create({
      model: getMealModel(),
      messages: buildMealMessages(input),
      response_format: {
        type: "json_schema",
        json_schema: jsonSchemaForOpenAi(input.mode),
      },
      max_completion_tokens: maxTokens,
    });

    const content = completion.choices[0]?.message?.content || "";
    let parsed = parseAiText(content);

    if (!parsed) throw new Error("No meal generated");

    const inputTokens = completion.usage?.prompt_tokens ?? projectedInputTokens;
    const outputTokens = completion.usage?.completion_tokens ?? estimateRequestTokens({ ...input, freeText: content });
    const estimatedUsd = calculateUsd({ inputTokens, outputTokens });
    const updatedUsage = await store.add(inputTokens, outputTokens, estimatedUsd);
    await maybeNotifyThresholds(updatedUsage.estimatedUsd);

    if ("meals" in parsed) {
      parsed = { meals: parsed.meals.map((meal) => ({ ...meal, costEstimate: { inputTokens, outputTokens, estimatedUsd } })) };
    } else {
      parsed = { ...parsed, costEstimate: { inputTokens, outputTokens, estimatedUsd } };
    }

    const payload: MealResponse = {
      mode: input.mode,
      meal: "meals" in parsed ? undefined : parsed,
      dayPlan: "meals" in parsed ? parsed.meals : undefined,
      source: "openai",
      usage: toUsageSummary(updatedUsage.estimatedUsd),
    };

    return NextResponse.json(payload);
  } catch (firstError) {
    try {
      const latestUsage = await store.get();
      const repairProjected = calculateUsd({ inputTokens: 900, outputTokens: 500 });
      if (latestUsage.estimatedUsd + repairProjected <= budgetUsd) {
        const repair = await client.chat.completions.create({
          model: getMealModel(),
          messages: buildRepairMessages(firstError instanceof Error ? firstError.message : "Invalid JSON"),
          response_format: { type: "json_object" },
          max_completion_tokens: 500,
        });
        const repairedContent = repair.choices[0]?.message?.content || "";
        const repaired = parseAiText(repairedContent);
        const inputTokens = repair.usage?.prompt_tokens ?? 900;
        const outputTokens = repair.usage?.completion_tokens ?? 500;
        const estimatedUsd = calculateUsd({ inputTokens, outputTokens });
        const updatedUsage = await store.add(inputTokens, outputTokens, estimatedUsd);
        await maybeNotifyThresholds(updatedUsage.estimatedUsd);
        return NextResponse.json({
          mode: input.mode,
          meal: "meals" in repaired ? undefined : repaired,
          dayPlan: "meals" in repaired ? repaired.meals : undefined,
          source: "openai",
          warning: "TinyBite repaired the AI response before showing it.",
          usage: toUsageSummary(updatedUsage.estimatedUsd),
        } satisfies MealResponse);
      }
    } catch {
      // Fall through to the safe fallback.
    }

    return NextResponse.json({
      ...fallbackResponse(input, "TinyBite could not safely parse the AI meal, so it used the built-in toddler meal rules."),
      usage: toUsageSummary((await store.get()).estimatedUsd),
    });
  }
}
