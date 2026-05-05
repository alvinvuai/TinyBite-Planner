export type MealRecordIngredient = {
  ingredientKey: string;
  name: string;
  amount: number;
  unit: string;
  grams: number;
  calories: number;
  suggestedAmount: number;
  suggestedUnit: string;
  suggestedCalories: number;
};

export type MealRecord = {
  id: string;
  user: "Dua";
  date: string;
  mealName: string;
  completionPercent: number;
  totalMealCalories: number;
  totalConsumedCalories: number;
  ingredients: MealRecordIngredient[];
  createdAt: string;
};
