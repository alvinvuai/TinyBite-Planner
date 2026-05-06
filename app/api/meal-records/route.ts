import { NextResponse } from "next/server";
import { z } from "zod";
import { getMealRecordStore } from "@/lib/mealRecordStore";
import type { MealRecord } from "@/types/mealRecord";

export const runtime = "nodejs";

const ingredientSchema = z.object({
  ingredientKey: z.string().min(1).max(80),
  name: z.string().min(1).max(100),
  amount: z.number().min(0),
  unit: z.string().min(1).max(40),
  grams: z.number().min(0),
  calories: z.number().min(0),
  suggestedAmount: z.number().min(0),
  suggestedUnit: z.string().min(1).max(40),
  suggestedCalories: z.number().min(0),
});

const createMealRecordSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealName: z.string().min(1).max(80),
  completionPercent: z.number().min(0).max(100),
  totalMealCalories: z.number().min(0),
  ingredients: z.array(ingredientSchema).min(1).max(40),
});

export async function GET() {
  const records = await getMealRecordStore().list();
  return NextResponse.json({ records });
}

export async function POST(request: Request) {
  let rawInput: unknown;

  try {
    rawInput = await request.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Meal record data was missing. Please try saving again." }, { status: 400 });
  }

  const validation = createMealRecordSchema.safeParse(rawInput);
  if (!validation.success) {
    return NextResponse.json(
      { error: "BAD_REQUEST", message: "Some meal record details were missing or invalid. Please adjust the meal and try again." },
      { status: 400 },
    );
  }

  const input = validation.data;
  const totalMealCalories = Math.round(input.totalMealCalories);
  const completionPercent = Math.round(input.completionPercent);
  const record: MealRecord = {
    id: crypto.randomUUID(),
    user: "Dua",
    date: input.date,
    mealName: input.mealName,
    completionPercent,
    totalMealCalories,
    totalConsumedCalories: Math.round((totalMealCalories * completionPercent) / 100),
    ingredients: input.ingredients.map((ingredient) => ({
      ...ingredient,
      calories: Math.round(ingredient.calories),
      grams: Math.round(ingredient.grams),
      suggestedCalories: Math.round(ingredient.suggestedCalories),
    })),
    createdAt: new Date().toISOString(),
  };

  const saved = await getMealRecordStore().add(record);
  return NextResponse.json({ record: saved }, { status: 201 });
}
