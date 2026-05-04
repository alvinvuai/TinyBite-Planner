export type PlanningMode = "single" | "whole_day";

export type ChildProfile = {
  ageMonths: number;
  weightKg: number;
  fingerFoodPreferred: boolean;
  avoidFoods: string[];
  goals: string[];
  acceptedSafeFoods: string[];
  fruitOptions: string[];
};

export type MealIngredient = {
  name: string;
  quantity: string;
  note: string;
};

export type MealPlan = {
  title: string;
  mealType: string;
  summary: string;
  ingredients: MealIngredient[];
  preparationSteps: string[];
  optionalAddOns: string[];
  fruitGuidance: string;
  feedingGuidance: string;
  safetyNotes: string[];
  costEstimate?: {
    inputTokens: number;
    outputTokens: number;
    estimatedUsd: number;
  };
};

export type DayMeal = MealPlan & {
  slot: string;
};

export type MealResponse = {
  mode: PlanningMode;
  meal?: MealPlan;
  dayPlan?: DayMeal[];
  source: "openai" | "fallback";
  warning?: string;
  usage: {
    usedUsd: number;
    budgetUsd: number;
    remainingUsd: number;
    percentUsed: number;
  };
};
