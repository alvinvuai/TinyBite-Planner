import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateUsd, getBudgetUsd, toUsageSummary } from "@/lib/cost";
import { getMealModel, getOpenAiClient, hasOpenAiKey } from "@/lib/openai";
import { getUsageStore } from "@/lib/usageStore";
import type { MealReview } from "@/types/nutrition";

export const runtime = "nodejs";

const reviewItemSchema = z.object({
  name: z.string().max(80),
  amount: z.number(),
  unit: z.string().max(30),
  grams: z.number(),
  calories: z.number(),
  note: z.string().max(180).optional(),
});

const reviewRequestSchema = z.object({
  mealType: z.string().max(80),
  suggestedMealTitle: z.string().max(120).optional(),
  nutritionSummary: z
    .object({
      totalCalories: z.number(),
      targetCalories: z.number(),
      macros: z.object({
        protein: z.number(),
        carbs: z.number(),
        fat: z.number(),
      }),
      nutrients: z.object({
        fiber: z.number(),
        iron: z.number(),
        zinc: z.number(),
        calcium: z.number(),
        omega3: z.number(),
      }),
    })
    .optional(),
  items: z.array(reviewItemSchema).min(1).max(30),
  childProfile: z.object({
    ageMonths: z.number(),
    weightKg: z.number(),
    fingerFoodPreferred: z.boolean(),
    avoidFoods: z.array(z.string()),
    goals: z.array(z.string()),
    acceptedSafeFoods: z.array(z.string()),
    fruitOptions: z.array(z.string()),
  }),
});

const aiReviewSchema = z.object({
  verdict: z.string(),
  score: z.number().min(0).max(100).optional(),
  macroComment: z.string().optional(),
  strengths: z.array(z.string()).min(1),
  suggestions: z.array(z.string()).min(1),
  safetyNotes: z.array(z.string()).min(1),
  feedingNote: z.string(),
});

function fallbackReview(input: z.infer<typeof reviewRequestSchema>): MealReview {
  const totalCalories = input.items.reduce((sum, item) => sum + item.calories, 0);
  const targetCalories = input.nutritionSummary?.targetCalories ?? totalCalories;
  const calorieMatch = Math.max(0, 100 - Math.min(60, Math.abs(totalCalories - targetCalories)));
  const hasProtein = input.items.some((item) => /egg|cheese|yoghurt|chicken|fish|beef|pork|tofu|beans|lentils/i.test(item.name));
  const hasFruit = input.items.some((item) => /banana|mandarin|grape|kiwi|plum|prune|pear/i.test(item.name));
  const hasFat = input.items.some((item) => /oil|butter|avocado|cheese|yoghurt/i.test(item.name));

  return {
    verdict: hasProtein ? "Looks like a reasonable toddler plate" : "Add a small protein exposure if available",
    score: Math.round((calorieMatch + (hasProtein ? 20 : 0) + (hasFat ? 10 : 0)) / 1.3),
    targetCalories,
    totalCalories,
    macroComment: input.nutritionSummary
      ? `Protein ${input.nutritionSummary.macros.protein.toFixed(1)}g, carb ${input.nutritionSummary.macros.carbs.toFixed(1)}g, fat ${input.nutritionSummary.macros.fat.toFixed(1)}g.`
      : undefined,
    strengths: [
      `${totalCalories} kcal offered vs ${targetCalories} kcal target.`,
      hasFat ? "Includes an energy-dense food, useful when appetite is small." : "The portions are visible and adjustable.",
    ],
    suggestions: [
      hasProtein ? "Keep protein calm and separate if she rejects it mixed in." : "Try egg, yoghurt, tofu, beans, cheese, fish, or finely chopped meat in a small portion.",
      hasFruit ? "Keep fruit as the planned portion, not a rescue after refusal." : "Fruit is optional; do not add it only to rescue a refused meal.",
    ],
    safetyNotes: [
      "Serve soft, cool enough, and cut into toddler-safe pieces.",
      "Quarter grapes lengthwise and avoid whole nuts or thick spoonfuls of nut butter.",
    ],
    feedingNote: "If she finishes and asks for more, offer more normal meal food on her own plate. If she refuses, keep the top-up small and planned.",
    source: "fallback",
    usage: toUsageSummary(0),
  };
}

export async function POST(request: NextRequest) {
  let rawInput: unknown;

  try {
    rawInput = await request.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Meal review needs selected foods before it can run." }, { status: 400 });
  }

  const validation = reviewRequestSchema.safeParse(rawInput);
  if (!validation.success) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Some meal quantities were missing or invalid. Please adjust the foods and try again." },
      { status: 400 },
    );
  }

  const input = validation.data;
  const store = getUsageStore();
  const usage = await store.get();
  const budgetUsd = getBudgetUsd();
  const currentSummary = toUsageSummary(usage.estimatedUsd);

  if (!hasOpenAiKey() || usage.estimatedUsd >= budgetUsd) {
    return NextResponse.json({ ...fallbackReview(input), usage: currentSummary });
  }

  const prompt = {
    task: "Review toddler meal quantities. No diagnosis. No guaranteed weight gain.",
    rules: [
      "Child is 19.5 months, around 8.8-9 kg, low weight, likes finger foods and rice.",
      "Avoid noodles and congee by default.",
      "Fruit and milk should not be rescue foods.",
      "Mention GP/paediatrician/dietitian review if poor weight gain continues.",
      "Keep response practical and brief.",
    ],
    mealType: input.mealType,
    selectedMeal: input.suggestedMealTitle,
    nutrition: input.nutritionSummary,
    items: input.items.map((item) => ({
      name: item.name,
      qty: `${item.amount} ${item.unit}`,
      grams: Math.round(item.grams),
      kcal: item.calories,
    })),
    profile: input.childProfile,
    output: "JSON only: verdict, score, macroComment, strengths[], suggestions[], safetyNotes[], feedingNote. Prefer numbers over long prose.",
  };

  try {
    const completion = await getOpenAiClient().chat.completions.create({
      model: getMealModel(),
      messages: [
        {
          role: "system",
          content:
            "You are a cautious toddler feeding planner. Return valid JSON only. Be brief and numeric. Do not diagnose. Do not promise weight gain.",
        },
        { role: "user", content: JSON.stringify(prompt) },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned an empty review.");

    const parsed = aiReviewSchema.parse(JSON.parse(content));
    const inputTokens = completion.usage?.prompt_tokens ?? 900;
    const outputTokens = completion.usage?.completion_tokens ?? 350;
    const estimatedUsd = calculateUsd({ inputTokens, outputTokens });
    const updated = await store.add(inputTokens, outputTokens, estimatedUsd);

    return NextResponse.json({
      ...parsed,
      targetCalories: input.nutritionSummary?.targetCalories,
      totalCalories: input.items.reduce((sum, item) => sum + item.calories, 0),
      source: "openai",
      usage: toUsageSummary(updated.estimatedUsd),
    } satisfies MealReview);
  } catch (error) {
    console.warn("Falling back to local meal review.", error);
    return NextResponse.json({ ...fallbackReview(input), usage: currentSummary });
  }
}
