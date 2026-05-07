import { getMealRecordStore, getMealRecordStoreName } from "@/lib/mealRecordStore";
import { getIngredientDefinition } from "@/lib/nutrition";
import type { MealRecord } from "@/types/mealRecord";
import { ReportClient } from "@/app/report/ReportClient";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const records = await getMealRecordStore().list();
  const storageName = getMealRecordStoreName();
  const enrichedRecords = records.map(enrichRecordNutrition);

  return <ReportClient records={enrichedRecords} storageName={storageName} />;
}

function baseNutrition() {
  return (
    { protein: 0, carbs: 0, fat: 0, fiber: 0, iron: 0, zinc: 0, calcium: 0, omega3: 0 }
  );
}

function enrichRecordNutrition(record: MealRecord) {
  const offered = record.ingredients.reduce((totals, ingredient) => {
    const definition = getIngredientDefinition(ingredient.ingredientKey) || getIngredientDefinition(ingredient.name);
    if (!definition || ingredient.grams <= 0) return totals;
    const factor = ingredient.grams / 100;
    return {
      protein: totals.protein + definition.nutrientsPer100g.protein * factor,
      carbs: totals.carbs + definition.nutrientsPer100g.carbs * factor,
      fat: totals.fat + definition.nutrientsPer100g.fat * factor,
      fiber: totals.fiber + definition.nutrientsPer100g.fiber * factor,
      iron: totals.iron + definition.nutrientsPer100g.iron * factor,
      zinc: totals.zinc + definition.nutrientsPer100g.zinc * factor,
      calcium: totals.calcium + definition.nutrientsPer100g.calcium * factor,
      omega3: totals.omega3 + definition.nutrientsPer100g.omega3 * factor,
    };
  }, baseNutrition());

  const consumedFactor = Math.max(0, Math.min(1, record.completionPercent / 100));
  const consumed = {
    protein: offered.protein * consumedFactor,
    carbs: offered.carbs * consumedFactor,
    fat: offered.fat * consumedFactor,
    fiber: offered.fiber * consumedFactor,
    iron: offered.iron * consumedFactor,
    zinc: offered.zinc * consumedFactor,
    calcium: offered.calcium * consumedFactor,
    omega3: offered.omega3 * consumedFactor,
  };

  return {
    ...record,
    nutritionOffered: offered,
    nutritionConsumed: consumed,
  };
}
