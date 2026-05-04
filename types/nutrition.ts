export type UnitOption = {
  unit: string;
  label: string;
  grams: number;
  step: number;
  min: number;
};

export type IngredientDefinition = {
  key: string;
  name: string;
  aliases: string[];
  caloriesPer100g: number;
  defaultAmount: number;
  defaultUnit: string;
  units: UnitOption[];
  note: string;
};

export type MealBuilderItem = {
  id: string;
  ingredientKey: string;
  name: string;
  suggestedAmount: number;
  suggestedUnit: string;
  suggestedGrams: number;
  amount: number;
  unit: string;
  grams: number;
  calories: number;
  note: string;
};

export type SuggestedMeal = {
  id: string;
  title: string;
  subtitle: string;
  mealType: string;
  ingredients: string[];
  steps: string[];
  safety: string;
};

export type MealReview = {
  verdict: string;
  totalCalories: number;
  strengths: string[];
  suggestions: string[];
  safetyNotes: string[];
  feedingNote: string;
  source: "openai" | "fallback";
  usage?: {
    usedUsd: number;
    budgetUsd: number;
    remainingUsd: number;
    percentUsed: number;
  };
};
