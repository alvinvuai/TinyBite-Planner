export type NutritionCategory = "carb" | "protein" | "dairy" | "fruit" | "vegetable" | "fat" | "treat";

export type UnitOption = {
  unit: string;
  label: string;
  grams: number;
  step: number;
  min: number;
};

export type NutrientProfile = {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
  zinc: number;
  calcium: number;
  omega3: number;
};

export type IngredientDefinition = {
  key: string;
  name: string;
  aliases: string[];
  category: NutritionCategory;
  icon?: string;
  imageSrc?: string;
  caloriesPer100g: number;
  defaultAmount: number;
  defaultUnit: string;
  units: UnitOption[];
  nutrientsPer100g: NutrientProfile;
  note: string;
};

export type MealBuilderItem = {
  id: string;
  ingredientKey: string;
  name: string;
  category: NutritionCategory;
  suggestedAmount: number;
  suggestedUnit: string;
  suggestedGrams: number;
  suggestedCalories: number;
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

export type NutritionSummary = {
  totalCalories: number;
  targetCalories: number;
  totalGrams: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  nutrients: Omit<NutrientProfile, "protein" | "carbs" | "fat">;
  categoryCalories: Record<NutritionCategory, number>;
  fruitCalories: number;
  proteinItems: MealBuilderItem[];
};

export type MealReview = {
  verdict: string;
  score?: number;
  targetCalories?: number;
  totalCalories: number;
  macroComment?: string;
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
