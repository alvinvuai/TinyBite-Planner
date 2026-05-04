import type { MealPlan, DayMeal } from "@/types/meal";
import type { generateMealRequestSchema } from "@/lib/schemas";
import type { z } from "zod";

type GenerateMealRequest = z.infer<typeof generateMealRequestSchema>;

function hasFood(input: GenerateMealRequest, food: string) {
  const haystack = `${input.freeText} ${input.selectedIngredients.join(" ")}`.toLowerCase();
  return haystack.includes(food.toLowerCase());
}

const sharedSafety = [
  "Serve soft, cool enough, and cut into toddler-safe pieces.",
  "Quarter grapes lengthwise; never serve whole grapes.",
  "Keep salt low and avoid thick spoonfuls of nut butter or tahini.",
];

export function fallbackSingleMeal(input: GenerateMealRequest): MealPlan {
  if (hasFood(input, "yoghurt") && /snack|tea|bedtime/i.test(input.mealType + input.freeText)) {
    return {
      title: "Creamy Yoghurt Snack Plate",
      mealType: input.mealType || "Morning tea",
      summary: "A small, predictable snack with full-fat yoghurt and controlled fruit.",
      ingredients: [
        { name: "Full-fat yoghurt", quantity: "100 g", note: "Serve in a small bowl or as spoon practice." },
        { name: "Biscuit", quantity: "1-2 small pieces", note: "Offer only if available and not too hard." },
        { name: "Banana", quantity: "2-3 thin slices, about 20-25 g", note: "Optional; do not use as a rescue food." },
      ],
      preparationSteps: ["Spoon yoghurt into a small bowl.", "Add biscuit beside it, not crumbled through everything.", "Offer banana slices only as the planned fruit portion."],
      optionalAddOns: ["Mix in 1/2 teaspoon smooth peanut butter or tahini if already safely introduced and spread thinly."],
      fruitGuidance: "Keep this fruit portion small and count it toward the day rather than offering extra fruit after refusal.",
      feedingGuidance: "If she refuses, stay calm and end the snack without replacing it with fruit or milk.",
      safetyNotes: sharedSafety,
    };
  }

  if (hasFood(input, "rice") && hasFood(input, "egg")) {
    return {
      title: "Soft Egg Rice Fingers",
      mealType: input.mealType || "Breakfast",
      summary: "Finger-friendly rice patties with a little fat for energy and protein exposure.",
      ingredients: [
        { name: "Cooked white rice", quantity: "1/3 cup", note: "Use soft, warm rice." },
        { name: "Egg", quantity: "1 small egg", note: "Cook fully." },
        { name: "Cheese", quantity: "10-15 g", note: "Optional if available." },
        { name: "Butter or olive oil", quantity: "1/2-1 teaspoon", note: "Use for cooking and extra energy." },
        { name: "Banana", quantity: "2-3 thin slices, about 20-30 g", note: "Serve separately if planned." },
      ],
      preparationSteps: ["Mix egg with rice and cheese.", "Cook as small soft patties in butter or olive oil.", "Let cool, then cut into easy finger strips.", "Serve fruit separately as the planned portion."],
      optionalAddOns: ["Offer a few plain rice bites separately if mixed textures are rejected."],
      fruitGuidance: "Do not increase banana if she refuses the rice fingers.",
      feedingGuidance: "If she picks out rice and avoids egg, next time keep egg strips beside rice instead of mixed in.",
      safetyNotes: sharedSafety,
    };
  }

  return {
    title: "Tiny Balanced Dinner Plate",
    mealType: input.mealType || "Dinner",
    summary: "A flexible toddler plate built from rice, a small protein exposure, vegetables, and energy-rich fat.",
    ingredients: [
      { name: "Cooked rice or bread", quantity: "1/4-1/3 cup rice or 1/2 small slice bread", note: "Use the accepted safe carbohydrate." },
      { name: "Protein", quantity: "1-2 tablespoons finely chopped meat, fish, tofu, beans, or egg", note: "Keep separate if mixed protein is rejected." },
      { name: "Soft vegetables", quantity: "1-2 tablespoons", note: "Cook until soft." },
      { name: "Butter, olive oil, cheese, or yoghurt", quantity: "1/2-1 teaspoon oil/butter or 10 g cheese", note: "Adds energy without a large volume." },
    ],
    preparationSteps: ["Place rice or bread on the plate first.", "Add protein in a separate small pile.", "Add soft vegetables and a little fat.", "Offer calm seconds of normal dinner food if she finishes and asks for more."],
    optionalAddOns: ["For a planned top-up after refusal, offer a small plate of normal family food rather than fruit or milk."],
    fruitGuidance: "Fruit is optional and portioned; keep whole-day fruit around 70-90 g unless settings change.",
    feedingGuidance: "Keep the meal calm and low pressure. Avoid turning preferred fruit or milk into a rescue pattern.",
    safetyNotes: sharedSafety,
  };
}

export function fallbackDayPlan(input: GenerateMealRequest): DayMeal[] {
  const slots = ["Breakfast", "Morning snack", "Lunch", "Afternoon tea", "Dinner", "Bedtime milk/yoghurt"];
  return slots.map((slot) => ({
    ...fallbackSingleMeal({ ...input, mealType: slot }),
    slot,
    mealType: slot,
  }));
}
