import { NextResponse } from "next/server";
import { z } from "zod";
import { findDuplicateMealRecord } from "@/lib/mealRecordRules";
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

const updateMealRecordDateSchema = z.object({
  id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

const updateMealRecordDetailsSchema = createMealRecordSchema.extend({
  id: z.string().uuid(),
}).strict();

const updateMealRecordSchema = z.union([updateMealRecordDetailsSchema, updateMealRecordDateSchema]);

type MealRecordInput = z.infer<typeof createMealRecordSchema>;

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
  const store = getMealRecordStore();
  const records = await store.list();
  const duplicate = findDuplicateMealRecord(records, input.date, input.mealName);
  const record = buildMealRecord(input);
  if (duplicate) {
    const merged = mergeMealRecords(duplicate, record);
    const saved = await store.update(merged);
    if (!saved) {
      return NextResponse.json({ error: "NOT_FOUND", message: "The previous meal record could not be merged. Please try again." }, { status: 404 });
    }
    return NextResponse.json({ record: saved, merged: true, message: `Merged this meal into the existing ${saved.mealName} record for ${saved.date}.` });
  }

  const saved = await store.add(record);
  return NextResponse.json({ record: saved }, { status: 201 });
}

export async function PATCH(request: Request) {
  let rawInput: unknown;

  try {
    rawInput = await request.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Meal record update was missing. Please try again." }, { status: 400 });
  }

  const validation = updateMealRecordSchema.safeParse(rawInput);
  if (!validation.success) {
    return NextResponse.json({ error: "BAD_REQUEST", message: "Please choose a valid saved meal record and date." }, { status: 400 });
  }

  const input = validation.data;
  const store = getMealRecordStore();
  const records = await store.list();
  const currentRecord = records.find((record) => record.id === input.id && record.user === "Dua");
  if (!currentRecord) {
    return NextResponse.json({ error: "NOT_FOUND", message: "That saved meal record could not be found." }, { status: 404 });
  }

  if ("mealName" in input) {
    const duplicate = findDuplicateMealRecord(records, input.date, input.mealName, input.id);
    if (duplicate) return duplicateMealRecordResponse(duplicate);

    const updated = await store.update(buildMealRecord(input, input.id, currentRecord.createdAt));
    if (!updated) {
      return NextResponse.json({ error: "NOT_FOUND", message: "That saved meal record could not be found." }, { status: 404 });
    }

    return NextResponse.json({ record: updated });
  }

  const duplicate = findDuplicateMealRecord(records, input.date, currentRecord.mealName, input.id);
  if (duplicate) return duplicateMealRecordResponse(duplicate);

  const updated = await store.updateDate(input.id, input.date);
  if (!updated) {
    return NextResponse.json({ error: "NOT_FOUND", message: "That saved meal record could not be found." }, { status: 404 });
  }

  return NextResponse.json({ record: updated });
}

function buildMealRecord(input: MealRecordInput, id = crypto.randomUUID(), createdAt = new Date().toISOString()): MealRecord {
  const totalMealCalories = Math.round(input.totalMealCalories);
  const completionPercent = Math.round(input.completionPercent);
  return {
    id,
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
    createdAt,
  };
}

function mergeMealRecords(existing: MealRecord, incoming: MealRecord): MealRecord {
  const totalMealCalories = Math.round(existing.totalMealCalories + incoming.totalMealCalories);
  const totalConsumedCalories = Math.round(existing.totalConsumedCalories + incoming.totalConsumedCalories);
  const completionPercent = totalMealCalories > 0 ? Math.min(100, Math.round((totalConsumedCalories / totalMealCalories) * 100)) : 0;

  return {
    ...existing,
    totalMealCalories,
    totalConsumedCalories,
    completionPercent,
    ingredients: [...existing.ingredients, ...incoming.ingredients],
  };
}

function duplicateMealRecordResponse(existingRecord: MealRecord) {
  return NextResponse.json(
    {
      error: "DUPLICATE_MEAL_RECORD",
      message: `${existingRecord.mealName} already has a saved record for ${existingRecord.date}. Please edit the previous record instead of adding a duplicate.`,
      existingRecord: {
        id: existingRecord.id,
        date: existingRecord.date,
        mealName: existingRecord.mealName,
        completionPercent: existingRecord.completionPercent,
        totalConsumedCalories: existingRecord.totalConsumedCalories,
      },
    },
    { status: 409 },
  );
}
