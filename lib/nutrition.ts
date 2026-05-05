import type {
  IngredientDefinition,
  MealBuilderItem,
  NutritionCategory,
  NutritionSummary,
  NutrientProfile,
  SuggestedMeal,
  UnitOption,
} from "@/types/nutrition";

const emptyNutrients: NutrientProfile = {
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  iron: 0,
  zinc: 0,
  calcium: 0,
  omega3: 0,
};

const gramUnit = (min = 1): UnitOption => ({ unit: "g", label: "g", grams: 1, step: 1, min });
const mlUnit = (density = 1, min = 5): UnitOption => ({ unit: "ml", label: "ml", grams: density, step: 5, min });
const tbsp = (grams: number): UnitOption => ({ unit: "tbsp", label: "tbsp", grams, step: 0.25, min: 0.25 });
const tsp = (grams: number): UnitOption => ({ unit: "tsp", label: "tsp", grams, step: 0.25, min: 0.25 });
const cup = (grams: number): UnitOption => ({ unit: "cup", label: "cup", grams, step: 0.125, min: 0.125 });
const piece = (label: string, grams: number, step = 0.5): UnitOption => ({
  unit: label.toLowerCase().replaceAll(" ", "_"),
  label,
  grams,
  step,
  min: step,
});

const n = (values: Partial<NutrientProfile>): NutrientProfile => ({ ...emptyNutrients, ...values });

export const mealTypes = [
  "Breakfast",
  "Dessert after breakfast",
  "Snack after breakfast / morning tea",
  "Lunch",
  "Dessert after lunch",
  "Afternoon tea",
  "Dinner",
  "After dinner snack",
  "Small portion eating with family",
  "Bedtime milk/yoghurt",
  "Whole day plan",
];

export const mealTargets: Record<string, { calories: number; protein: number; carbs: number; fat: number; note: string }> = {
  Breakfast: { calories: 210, protein: 6, carbs: 24, fat: 8, note: "A calm starter meal with carb, protein, and a little fat." },
  "Dessert after breakfast": { calories: 50, protein: 1, carbs: 10, fat: 1, note: "Small planned fruit or yoghurt portion, not a rescue." },
  "Snack after breakfast / morning tea": { calories: 90, protein: 3, carbs: 12, fat: 3, note: "A measured snack that does not spoil lunch." },
  Lunch: { calories: 230, protein: 7, carbs: 26, fat: 9, note: "Main plate: safe carb, protein exposure, vegetable, and fat." },
  "Dessert after lunch": { calories: 50, protein: 1, carbs: 10, fat: 1, note: "Small planned dessert after lunch." },
  "Afternoon tea": { calories: 90, protein: 3, carbs: 12, fat: 3, note: "Small energy bridge to dinner." },
  Dinner: { calories: 230, protein: 7, carbs: 25, fat: 9, note: "Main family-style meal with protein kept separate if needed." },
  "After dinner snack": { calories: 60, protein: 2, carbs: 8, fat: 2, note: "Only if planned and appetite suggests it." },
  "Small portion eating with family": { calories: 80, protein: 2, carbs: 9, fat: 3, note: "A small top-up plate, not an unlimited second dinner." },
  "Bedtime milk/yoghurt": { calories: 120, protein: 5, carbs: 12, fat: 5, note: "Scheduled milk or yoghurt, not a rescue for refusal." },
  "Whole day plan": { calories: 1000, protein: 20, carbs: 130, fat: 35, note: "Approximate daily planning target for this app." },
};

export const categoryLabels: Record<NutritionCategory, string> = {
  carb: "Carb",
  protein: "Protein / iron",
  dairy: "Dairy",
  fruit: "Fruit",
  vegetable: "Vegetable / fibre",
  fat: "Fat",
  treat: "Treat",
};

export const categoryStyles: Record<NutritionCategory, { text: string; bg: string; border: string; dot: string }> = {
  carb: { text: "#7a4c14", bg: "#fff2ce", border: "#f5d999", dot: "#d99b2b" },
  protein: { text: "#7d2630", bg: "#ffe1e5", border: "#f6b2bd", dot: "#d95763" },
  dairy: { text: "#4f4e8b", bg: "#ecebff", border: "#cdc7ff", dot: "#8985df" },
  fruit: { text: "#8a4a12", bg: "#ffe9d5", border: "#ffc78f", dot: "#ef9149" },
  vegetable: { text: "#306a3d", bg: "#e4f6df", border: "#bde4b5", dot: "#61aa65" },
  fat: { text: "#8a5b05", bg: "#fff1bc", border: "#f3d46f", dot: "#d6a819" },
  treat: { text: "#8a3f79", bg: "#ffe0f2", border: "#f6b4df", dot: "#d967b5" },
};

export const ingredientDefinitions: IngredientDefinition[] = [
  {
    key: "rice",
    name: "Cooked rice",
    aliases: ["rice", "white rice", "cooked rice"],
    category: "carb",
    caloriesPer100g: 130,
    defaultAmount: 0.5,
    defaultUnit: "cup",
    units: [gramUnit(5), cup(158), piece("rice spoon", 20, 0.5)],
    nutrientsPer100g: n({ protein: 2.7, carbs: 28.2, fat: 0.3, fiber: 0.4, iron: 1.2, zinc: 0.5 }),
    note: "Cooked white rice estimate; cup weight varies with grain and packing.",
  },
  {
    key: "egg",
    name: "Egg",
    aliases: ["egg", "eggs"],
    category: "protein",
    caloriesPer100g: 143,
    defaultAmount: 1,
    defaultUnit: "egg",
    units: [piece("egg", 50, 0.5), gramUnit(5)],
    nutrientsPer100g: n({ protein: 12.6, carbs: 0.7, fat: 9.5, iron: 1.8, zinc: 1.3, calcium: 56, omega3: 74 }),
    note: "One large egg is estimated at 50 g without shell.",
  },
  {
    key: "cheese",
    name: "Cheese",
    aliases: ["cheese", "cheddar"],
    category: "dairy",
    caloriesPer100g: 402,
    defaultAmount: 15,
    defaultUnit: "g",
    units: [gramUnit(5), piece("slice", 20, 0.5), piece("cube", 8, 1)],
    nutrientsPer100g: n({ protein: 25, carbs: 1.3, fat: 33, iron: 0.7, zinc: 3.1, calcium: 710 }),
    note: "Cheddar-style cheese estimate; check packaging for exact calories.",
  },
  {
    key: "yoghurt",
    name: "Full-fat yoghurt",
    aliases: ["yoghurt", "yogurt"],
    category: "dairy",
    caloriesPer100g: 61,
    defaultAmount: 100,
    defaultUnit: "g",
    units: [gramUnit(5), piece("small tub", 100, 0.5), cup(245)],
    nutrientsPer100g: n({ protein: 3.5, carbs: 4.7, fat: 3.3, calcium: 121, zinc: 0.6 }),
    note: "Plain whole-milk yoghurt estimate.",
  },
  {
    key: "fresh_cow_milk",
    name: "Fresh cow milk",
    aliases: ["milk", "fresh milk", "cow milk", "fresh cow milk"],
    category: "dairy",
    caloriesPer100g: 61,
    defaultAmount: 120,
    defaultUnit: "ml",
    units: [mlUnit(1.03, 10)],
    nutrientsPer100g: n({ protein: 3.2, carbs: 4.8, fat: 3.3, calcium: 113, zinc: 0.4 }),
    note: "Whole cow milk estimate; use the bottle label for exact values.",
  },
  {
    key: "pediasure_milk",
    name: "PediaSure milk",
    aliases: ["pediasure", "pediasure milk", "pediasure powder strawberry"],
    category: "dairy",
    caloriesPer100g: 100,
    defaultAmount: 120,
    defaultUnit: "ml",
    units: [mlUnit(1, 10)],
    nutrientsPer100g: n({ protein: 3, carbs: 12.9, fat: 3.9, fiber: 0.45, iron: 1.4, zinc: 0.9, calcium: 118, omega3: 4.5 }),
    note: "Prepared PediaSure Powder Strawberry at standard dilution: about 1 kcal per ml.",
  },
  {
    key: "banana",
    name: "Banana",
    aliases: ["banana"],
    category: "fruit",
    caloriesPer100g: 89,
    defaultAmount: 0.33,
    defaultUnit: "banana",
    units: [piece("banana", 118, 0.25), piece("thin slice", 8, 1), piece("chunk", 15, 1), gramUnit(5)],
    nutrientsPer100g: n({ protein: 1.1, carbs: 22.8, fat: 0.3, fiber: 2.6, iron: 0.3, zinc: 0.2 }),
    note: "Keep planned fruit portions small for this profile.",
  },
  {
    key: "mandarin",
    name: "Mandarin",
    aliases: ["mandarin"],
    category: "fruit",
    caloriesPer100g: 53,
    defaultAmount: 4,
    defaultUnit: "segment",
    units: [piece("segment", 8, 1), piece("small fruit", 75, 0.5), gramUnit(5)],
    nutrientsPer100g: n({ protein: 0.8, carbs: 13.3, fat: 0.3, fiber: 1.8, iron: 0.2, zinc: 0.1, calcium: 37 }),
    note: "Remove seeds and membranes if tough.",
  },
  {
    key: "grape",
    name: "Grape",
    aliases: ["grape", "grapes"],
    category: "fruit",
    caloriesPer100g: 69,
    defaultAmount: 4,
    defaultUnit: "quartered_grape",
    units: [piece("quartered grape", 5, 1), gramUnit(5)],
    nutrientsPer100g: n({ protein: 0.7, carbs: 18.1, fat: 0.2, fiber: 0.9, iron: 0.4, zinc: 0.1, calcium: 10 }),
    note: "Quarter grapes lengthwise before serving.",
  },
  {
    key: "kiwi",
    name: "Kiwi",
    aliases: ["kiwi"],
    category: "fruit",
    caloriesPer100g: 61,
    defaultAmount: 4,
    defaultUnit: "slice",
    units: [piece("slice", 8, 1), piece("kiwi", 75, 0.5), gramUnit(5)],
    nutrientsPer100g: n({ protein: 1.1, carbs: 14.7, fat: 0.5, fiber: 3, iron: 0.3, zinc: 0.1, calcium: 34 }),
    note: "Serve ripe and soft.",
  },
  {
    key: "plum",
    name: "Plum",
    aliases: ["plum"],
    category: "fruit",
    caloriesPer100g: 46,
    defaultAmount: 3,
    defaultUnit: "slice",
    units: [piece("slice", 10, 1), piece("small plum", 66, 0.5), gramUnit(5)],
    nutrientsPer100g: n({ protein: 0.7, carbs: 11.4, fat: 0.3, fiber: 1.4, iron: 0.2, zinc: 0.1 }),
    note: "Remove pit and cut into soft toddler-safe pieces.",
  },
  {
    key: "prune",
    name: "Dried plum / prune",
    aliases: ["dried plum", "prune", "dried plum / prune"],
    category: "fruit",
    caloriesPer100g: 240,
    defaultAmount: 1,
    defaultUnit: "prune",
    units: [piece("prune", 9.5, 0.5), gramUnit(2), piece("chopped piece", 3, 1)],
    nutrientsPer100g: n({ protein: 2.2, carbs: 64, fat: 0.4, fiber: 7.1, iron: 0.9, zinc: 0.4, calcium: 43 }),
    note: "Energy dense; serve chopped and modestly.",
  },
  {
    key: "pear",
    name: "Pear",
    aliases: ["pear"],
    category: "fruit",
    caloriesPer100g: 57,
    defaultAmount: 3,
    defaultUnit: "thin_slice",
    units: [piece("thin slice", 10, 1), piece("small pear", 148, 0.25), gramUnit(5)],
    nutrientsPer100g: n({ protein: 0.4, carbs: 15.2, fat: 0.1, fiber: 3.1, iron: 0.2, zinc: 0.1, calcium: 9 }),
    note: "Serve ripe, peeled if skin is tough.",
  },
  {
    key: "chicken",
    name: "Chicken",
    aliases: ["chicken"],
    category: "protein",
    caloriesPer100g: 165,
    defaultAmount: 25,
    defaultUnit: "g",
    units: [gramUnit(5), piece("strip", 15, 1), piece("shredded bite", 5, 1)],
    nutrientsPer100g: n({ protein: 31, fat: 3.6, iron: 1, zinc: 1, calcium: 15, omega3: 40 }),
    note: "Cook until tender; keep separate if mixed protein is refused.",
  },
  {
    key: "fish",
    name: "Fish",
    aliases: ["fish"],
    category: "protein",
    caloriesPer100g: 130,
    defaultAmount: 25,
    defaultUnit: "g",
    units: [gramUnit(5), piece("flake", 8, 1), piece("finger piece", 15, 1)],
    nutrientsPer100g: n({ protein: 22, fat: 4.5, iron: 0.4, zinc: 0.5, calcium: 20, omega3: 500 }),
    note: "Check carefully for bones.",
  },
  {
    key: "beef",
    name: "Beef",
    aliases: ["beef"],
    category: "protein",
    caloriesPer100g: 250,
    defaultAmount: 20,
    defaultUnit: "g",
    units: [gramUnit(5), piece("strip", 12, 1), piece("minced spoon", 10, 1)],
    nutrientsPer100g: n({ protein: 26, fat: 15, iron: 2.6, zinc: 6.3, calcium: 18 }),
    note: "Serve very tender and finely chopped.",
  },
  {
    key: "pork",
    name: "Pork",
    aliases: ["pork"],
    category: "protein",
    caloriesPer100g: 242,
    defaultAmount: 20,
    defaultUnit: "g",
    units: [gramUnit(5), piece("strip", 12, 1), piece("minced spoon", 10, 1)],
    nutrientsPer100g: n({ protein: 27, fat: 14, iron: 0.9, zinc: 2.4, calcium: 19 }),
    note: "Serve very tender and low-salt.",
  },
  {
    key: "tofu",
    name: "Tofu",
    aliases: ["tofu"],
    category: "protein",
    caloriesPer100g: 144,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("cube", 12, 1), piece("finger strip", 18, 1)],
    nutrientsPer100g: n({ protein: 17, carbs: 3, fat: 9, fiber: 2.3, iron: 2.7, zinc: 1.6, calcium: 350 }),
    note: "Soft cubes work well as finger food.",
  },
  {
    key: "beans_lentils",
    name: "Beans / lentils",
    aliases: ["beans", "lentils", "beans / lentils"],
    category: "protein",
    caloriesPer100g: 116,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("soft spoon", 12, 1), cup(198)],
    nutrientsPer100g: n({ protein: 9, carbs: 20, fat: 0.4, fiber: 8, iron: 3.3, zinc: 1.3, calcium: 19 }),
    note: "Cook until very soft; lightly mash if needed.",
  },
  {
    key: "avocado",
    name: "Avocado",
    aliases: ["avocado"],
    category: "fat",
    caloriesPer100g: 160,
    defaultAmount: 2,
    defaultUnit: "slice",
    units: [piece("slice", 15, 1), piece("wedge", 25, 0.5), gramUnit(5)],
    nutrientsPer100g: n({ protein: 2, carbs: 8.5, fat: 14.7, fiber: 6.7, iron: 0.6, zinc: 0.6, calcium: 12, omega3: 110 }),
    note: "Good energy-dense soft finger food.",
  },
  {
    key: "bread",
    name: "Bread",
    aliases: ["bread"],
    category: "carb",
    caloriesPer100g: 265,
    defaultAmount: 0.5,
    defaultUnit: "slice",
    units: [piece("slice", 28, 0.5), piece("finger strip", 7, 1), gramUnit(5)],
    nutrientsPer100g: n({ protein: 9, carbs: 49, fat: 3.2, fiber: 2.7, iron: 3.6, zinc: 0.9, calcium: 260 }),
    note: "Offer soft strips; avoid hard crusts if difficult.",
  },
  {
    key: "biscuit",
    name: "Biscuit",
    aliases: ["biscuit"],
    category: "treat",
    caloriesPer100g: 450,
    defaultAmount: 1,
    defaultUnit: "small_piece",
    units: [piece("small piece", 8, 1), piece("biscuit", 12, 0.5), gramUnit(2)],
    nutrientsPer100g: n({ protein: 6, carbs: 70, fat: 16, fiber: 2, iron: 2, zinc: 0.7, calcium: 40 }),
    note: "Varies widely; use packaging when possible.",
  },
  {
    key: "vegetables",
    name: "Vegetables",
    aliases: ["vegetables", "veg"],
    category: "vegetable",
    caloriesPer100g: 35,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("soft floret", 12, 1), piece("chopped spoon", 10, 1)],
    nutrientsPer100g: n({ protein: 2, carbs: 7, fat: 0.2, fiber: 3, iron: 0.8, zinc: 0.3, calcium: 35 }),
    note: "Cook until soft; calories vary by vegetable.",
  },
  {
    key: "butter",
    name: "Butter",
    aliases: ["butter"],
    category: "fat",
    caloriesPer100g: 717,
    defaultAmount: 1,
    defaultUnit: "tsp",
    units: [tsp(4.7), tbsp(14.2), gramUnit(1)],
    nutrientsPer100g: n({ protein: 0.9, fat: 81, carbs: 0.1, calcium: 24 }),
    note: "Energy dense; keep portions intentional.",
  },
  {
    key: "olive_oil",
    name: "Olive oil",
    aliases: ["olive oil", "oil"],
    category: "fat",
    caloriesPer100g: 884,
    defaultAmount: 1,
    defaultUnit: "tsp",
    units: [tsp(4.5), tbsp(13.5), mlUnit(0.91, 1), gramUnit(1)],
    nutrientsPer100g: n({ fat: 100, omega3: 760 }),
    note: "1 tbsp olive oil is about 13.5 g; 1 tsp is about 4.5 g.",
  },
];

const categories: NutritionCategory[] = ["carb", "protein", "dairy", "fruit", "vegetable", "fat", "treat"];

const mealCategoryWeights: Record<string, Partial<Record<NutritionCategory, number>>> = {
  Breakfast: { carb: 0.34, protein: 0.25, dairy: 0.18, fruit: 0.1, fat: 0.13 },
  "Dessert after breakfast": { fruit: 0.5, dairy: 0.35, treat: 0.15 },
  "Snack after breakfast / morning tea": { dairy: 0.34, fruit: 0.22, carb: 0.2, protein: 0.14, fat: 0.1, treat: 0.08 },
  Lunch: { carb: 0.32, protein: 0.27, vegetable: 0.1, fat: 0.16, dairy: 0.08, fruit: 0.07 },
  "Dessert after lunch": { fruit: 0.5, dairy: 0.35, treat: 0.15 },
  "Afternoon tea": { dairy: 0.3, fruit: 0.22, carb: 0.22, protein: 0.14, fat: 0.12, treat: 0.08 },
  Dinner: { carb: 0.32, protein: 0.28, vegetable: 0.12, fat: 0.16, dairy: 0.06, fruit: 0.06 },
  "After dinner snack": { dairy: 0.45, fruit: 0.25, carb: 0.15, fat: 0.15 },
  "Small portion eating with family": { carb: 0.34, protein: 0.27, vegetable: 0.12, fat: 0.17, dairy: 0.06, fruit: 0.04 },
  "Bedtime milk/yoghurt": { dairy: 0.85, fat: 0.1, fruit: 0.05 },
  "Whole day plan": { carb: 0.35, protein: 0.25, dairy: 0.14, fruit: 0.08, vegetable: 0.08, fat: 0.1 },
};

export function getIngredientDefinition(name: string) {
  const normalized = normalizeIngredient(name);
  return ingredientDefinitions.find((item) => item.aliases.some((alias) => normalizeIngredient(alias) === normalized));
}

export function normalizeIngredient(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

export function formatAmount(value: number) {
  if (!Number.isFinite(value)) return "0";
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(2))).replace(/\.00$/, "");
}

export function gramsFor(definition: IngredientDefinition, amount: number, unit: string) {
  const unitOption = definition.units.find((item) => item.unit === unit) || definition.units[0];
  return amount * unitOption.grams;
}

export function caloriesFor(definition: IngredientDefinition, grams: number) {
  return Math.round((definition.caloriesPer100g * grams) / 100);
}

export function createMealBuilderItem(name: string): MealBuilderItem | null {
  const definition = getIngredientDefinition(name);
  if (!definition) return null;
  const grams = gramsFor(definition, definition.defaultAmount, definition.defaultUnit);
  const calories = caloriesFor(definition, grams);
  return {
    id: `${definition.key}-${crypto.randomUUID()}`,
    ingredientKey: definition.key,
    name: definition.name,
    category: definition.category,
    suggestedAmount: definition.defaultAmount,
    suggestedUnit: definition.defaultUnit,
    suggestedGrams: grams,
    suggestedCalories: calories,
    amount: definition.defaultAmount,
    unit: definition.defaultUnit,
    grams,
    calories,
    note: definition.note,
  };
}

export function rebalanceSuggestedItems(items: MealBuilderItem[], mealType: string, resetAdjusted = false): MealBuilderItem[] {
  if (!items.length) return [];
  const targetCalories = mealTargets[mealType]?.calories ?? mealTargets.Breakfast.calories;
  const weights = mealCategoryWeights[mealType] ?? mealCategoryWeights.Breakfast;
  const selectedCategories = new Set(items.map((item) => item.category));
  const activeWeightTotal = categories.reduce((sum, category) => {
    if (!selectedCategories.has(category)) return sum;
    return sum + (weights[category] ?? 0.05);
  }, 0);

  return items.map((item) => {
    const definition = ingredientDefinitions.find((definitionItem) => definitionItem.key === item.ingredientKey);
    if (!definition) return item;
    const categoryItems = items.filter((candidate) => candidate.category === item.category);
    const categoryWeight = weights[item.category] ?? 0.05;
    const normalizedWeight = activeWeightTotal > 0 ? categoryWeight / activeWeightTotal : 1 / selectedCategories.size;
    const kcalShare = Math.max(8, (targetCalories * normalizedWeight) / Math.max(1, categoryItems.length));
    const suggestedGrams = Math.max(1, (kcalShare * 100) / definition.caloriesPer100g);
    const suggestedUnit = definition.units.find((unit) => unit.unit === item.suggestedUnit) || definition.units[0];
    const suggestedAmount = Math.max(suggestedUnit.min, suggestedGrams / suggestedUnit.grams);
    const roundedSuggestedAmount = roundToStep(suggestedAmount, suggestedUnit.step);
    const roundedSuggestedGrams = gramsFor(definition, roundedSuggestedAmount, suggestedUnit.unit);
    const suggestedCalories = caloriesFor(definition, roundedSuggestedGrams);

    if (!resetAdjusted) {
      return {
        ...item,
        category: definition.category,
        suggestedAmount: roundedSuggestedAmount,
        suggestedUnit: suggestedUnit.unit,
        suggestedGrams: roundedSuggestedGrams,
        suggestedCalories,
      };
    }

    return {
      ...item,
      category: definition.category,
      suggestedAmount: roundedSuggestedAmount,
      suggestedUnit: suggestedUnit.unit,
      suggestedGrams: roundedSuggestedGrams,
      suggestedCalories,
      amount: roundedSuggestedAmount,
      unit: suggestedUnit.unit,
      grams: roundedSuggestedGrams,
      calories: suggestedCalories,
    };
  });
}

export function updateMealBuilderItem(item: MealBuilderItem, nextAmount: number, nextUnit = item.unit): MealBuilderItem {
  const definition = ingredientDefinitions.find((definitionItem) => definitionItem.key === item.ingredientKey);
  if (!definition) return item;
  const unit = definition.units.find((unitItem) => unitItem.unit === nextUnit) || definition.units[0];
  const amount = Math.max(unit.min, Number.isFinite(nextAmount) ? nextAmount : unit.min);
  const grams = gramsFor(definition, amount, unit.unit);
  return { ...item, amount, unit: unit.unit, grams, calories: caloriesFor(definition, grams), note: definition.note };
}

export function convertMealBuilderItemUnit(item: MealBuilderItem, nextUnit: string): MealBuilderItem {
  const definition = ingredientDefinitions.find((definitionItem) => definitionItem.key === item.ingredientKey);
  if (!definition) return item;
  const unit = definition.units.find((unitItem) => unitItem.unit === nextUnit) || definition.units[0];
  const amount = Math.max(unit.min, item.grams / unit.grams);
  return updateMealBuilderItem(item, Number(amount.toFixed(2)), unit.unit);
}

export function convertSuggestedMealBuilderItemUnit(item: MealBuilderItem, nextUnit: string): MealBuilderItem {
  const definition = ingredientDefinitions.find((definitionItem) => definitionItem.key === item.ingredientKey);
  if (!definition) return item;
  const unit = definition.units.find((unitItem) => unitItem.unit === nextUnit) || definition.units[0];
  const suggestedGrams = item.suggestedGrams ?? item.grams;
  const suggestedAmount = Math.max(unit.min, suggestedGrams / unit.grams);
  return {
    ...item,
    suggestedAmount: Number(suggestedAmount.toFixed(2)),
    suggestedUnit: unit.unit,
    suggestedGrams,
    suggestedCalories: caloriesFor(definition, suggestedGrams),
  };
}

export function suggestMeals(ingredients: MealBuilderItem[], mealType: string): SuggestedMeal[] {
  if (!ingredients.length) return [];

  const keys = new Set(ingredients.map((item) => item.ingredientKey));
  const suggestions: SuggestedMeal[] = [];
  const type = mealType === "Whole day plan" ? "Breakfast" : mealType;

  if (keys.has("egg") && keys.has("rice")) {
    suggestions.push({
      id: "egg-rice-fingers",
      title: "Soft Egg Rice Fingers",
      subtitle: "Rice patties with egg kept soft and easy to hold.",
      mealType: type,
      ingredients: ["Cooked rice", "Egg", keys.has("cheese") ? "Cheese" : "Butter or olive oil"],
      steps: ["Mix a small amount of rice with egg.", "Cook as soft mini patties.", "Let cool and cut into finger strips."],
      safety: "Serve soft and cool enough. Keep some plain rice separate if mixed protein is rejected.",
    });
  }

  if (keys.has("egg") && (keys.has("cheese") || keys.has("olive_oil") || keys.has("butter"))) {
    suggestions.push({
      id: "mini-omelette-strips",
      title: "Mini Omelette Strips",
      subtitle: "A soft protein-first finger food with a little energy-rich fat.",
      mealType: type,
      ingredients: ["Egg", keys.has("cheese") ? "Cheese" : "Yoghurt", keys.has("olive_oil") ? "Olive oil" : "Butter"],
      steps: ["Whisk egg with cheese if using.", "Cook gently in a little fat.", "Slice into soft strips."],
      safety: "Cook egg fully and cut into toddler-safe strips.",
    });
  }

  if (keys.has("yoghurt") || keys.has("fresh_cow_milk") || keys.has("pediasure_milk")) {
    suggestions.push({
      id: "planned-dairy-snack",
      title: "Planned Dairy Snack",
      subtitle: "Measured yoghurt or milk without using it as a rescue food.",
      mealType: /breakfast/i.test(type) ? "Morning tea" : type,
      ingredients: ["Yoghurt or milk", keys.has("banana") ? "Banana" : "Pear", keys.has("biscuit") ? "Biscuit" : "Avocado"],
      steps: ["Serve the dairy as a planned portion.", "Add only the planned fruit portion if selected.", "Keep it calm and stop when finished."],
      safety: "Do not use fruit or milk as a replacement if the main food is refused.",
    });
  }

  if (keys.has("rice") && (keys.has("chicken") || keys.has("fish") || keys.has("tofu") || keys.has("beans_lentils") || keys.has("beef"))) {
    suggestions.push({
      id: "separate-rice-protein-plate",
      title: "Rice + Protein Side Plate",
      subtitle: "Safe rice with protein served separately for gentle exposure.",
      mealType: type,
      ingredients: ["Cooked rice", "Protein", "Vegetables", "Olive oil or butter"],
      steps: ["Put rice in one section of the plate.", "Place protein beside it, not hidden in the rice.", "Add soft veg and a little fat."],
      safety: "If she refuses protein, keep the exposure calm and do not replace it with fruit.",
    });
  }

  if (!suggestions.length) {
    suggestions.push({
      id: "tiny-balanced-plate",
      title: "Tiny Balanced Plate",
      subtitle: "A practical plate from the selected foods with toddler-sized portions.",
      mealType: type,
      ingredients: ingredients.slice(0, 4).map((item) => item.name),
      steps: ["Serve the safe food first.", "Add one small protein or fat exposure.", "Keep fruit measured and planned."],
      safety: "Serve soft, low-salt, and cut into toddler-safe pieces.",
    });
  }

  return suggestions.slice(0, 4);
}

export function summarizeMeal(items: MealBuilderItem[], mealType = "Breakfast"): NutritionSummary {
  const targetCalories = mealTargets[mealType]?.calories ?? mealTargets.Breakfast.calories;
  const initialCategoryCalories = categories.reduce(
    (record, category) => ({ ...record, [category]: 0 }),
    {} as Record<NutritionCategory, number>,
  );

  return items.reduce<NutritionSummary>(
    (summary, item) => {
      const definition = ingredientDefinitions.find((definitionItem) => definitionItem.key === item.ingredientKey);
      if (!definition) return summary;
      const factor = item.grams / 100;
      summary.totalCalories += item.calories;
      summary.totalGrams += item.grams;
      summary.macros.protein += definition.nutrientsPer100g.protein * factor;
      summary.macros.carbs += definition.nutrientsPer100g.carbs * factor;
      summary.macros.fat += definition.nutrientsPer100g.fat * factor;
      summary.nutrients.fiber += definition.nutrientsPer100g.fiber * factor;
      summary.nutrients.iron += definition.nutrientsPer100g.iron * factor;
      summary.nutrients.zinc += definition.nutrientsPer100g.zinc * factor;
      summary.nutrients.calcium += definition.nutrientsPer100g.calcium * factor;
      summary.nutrients.omega3 += definition.nutrientsPer100g.omega3 * factor;
      summary.categoryCalories[item.category] += item.calories;
      if (["banana", "mandarin", "grape", "kiwi", "plum", "prune", "pear"].includes(item.ingredientKey)) {
        summary.fruitCalories += item.calories;
      }
      if (["egg", "cheese", "yoghurt", "fresh_cow_milk", "pediasure_milk", "chicken", "fish", "beef", "pork", "tofu", "beans_lentils"].includes(item.ingredientKey)) {
        summary.proteinItems.push(item);
      }
      return summary;
    },
    {
      totalCalories: 0,
      targetCalories,
      totalGrams: 0,
      macros: { protein: 0, carbs: 0, fat: 0 },
      nutrients: { fiber: 0, iron: 0, zinc: 0, calcium: 0, omega3: 0 },
      categoryCalories: initialCategoryCalories,
      fruitCalories: 0,
      proteinItems: [],
    },
  );
}

function roundToStep(value: number, step: number) {
  const rounded = Math.round(value / step) * step;
  return Number(rounded.toFixed(2));
}
