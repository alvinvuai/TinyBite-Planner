import type { IngredientDefinition, MealBuilderItem, SuggestedMeal, UnitOption } from "@/types/nutrition";

const gramUnit = (min = 1): UnitOption => ({ unit: "g", label: "g", grams: 1, step: 1, min });
const tbsp = (grams: number): UnitOption => ({ unit: "tbsp", label: "tbsp", grams, step: 0.25, min: 0.25 });
const tsp = (grams: number): UnitOption => ({ unit: "tsp", label: "tsp", grams, step: 0.25, min: 0.25 });
const cup = (grams: number): UnitOption => ({ unit: "cup", label: "cup", grams, step: 0.125, min: 0.125 });
const piece = (label: string, grams: number, step = 0.5): UnitOption => ({ unit: label.toLowerCase().replaceAll(" ", "_"), label, grams, step, min: step });

export const ingredientDefinitions: IngredientDefinition[] = [
  {
    key: "rice",
    name: "Cooked rice",
    aliases: ["rice", "white rice", "cooked rice"],
    caloriesPer100g: 130,
    defaultAmount: 0.33,
    defaultUnit: "cup",
    units: [gramUnit(5), cup(158), tbsp(9.9), tsp(3.3)],
    note: "Cooked white rice estimate; cup weight varies with grain and packing.",
  },
  {
    key: "egg",
    name: "Egg",
    aliases: ["egg", "eggs"],
    caloriesPer100g: 143,
    defaultAmount: 1,
    defaultUnit: "egg",
    units: [piece("egg", 50, 0.5), gramUnit(5), tbsp(12)],
    note: "One large egg is estimated at 50 g without shell.",
  },
  {
    key: "cheese",
    name: "Cheese",
    aliases: ["cheese", "cheddar"],
    caloriesPer100g: 402,
    defaultAmount: 15,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(7), cup(113), piece("slice", 20, 0.5)],
    note: "Cheddar-style cheese estimate; check packaging for exact calories.",
  },
  {
    key: "yoghurt",
    name: "Full-fat yoghurt",
    aliases: ["yoghurt", "yogurt"],
    caloriesPer100g: 61,
    defaultAmount: 100,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(15), tsp(5), cup(245)],
    note: "Plain whole-milk yoghurt estimate.",
  },
  {
    key: "banana",
    name: "Banana",
    aliases: ["banana"],
    caloriesPer100g: 89,
    defaultAmount: 25,
    defaultUnit: "g",
    units: [gramUnit(5), piece("thin slice", 8, 1), cup(150)],
    note: "Keep planned fruit portions small for this profile.",
  },
  {
    key: "mandarin",
    name: "Mandarin",
    aliases: ["mandarin"],
    caloriesPer100g: 53,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("segment", 8, 1), piece("small fruit", 75, 0.5)],
    note: "Remove seeds and membranes if tough.",
  },
  {
    key: "grape",
    name: "Grape",
    aliases: ["grape", "grapes"],
    caloriesPer100g: 69,
    defaultAmount: 20,
    defaultUnit: "g",
    units: [gramUnit(5), piece("grape", 5, 1), cup(92)],
    note: "Quarter grapes lengthwise before serving.",
  },
  {
    key: "kiwi",
    name: "Kiwi",
    aliases: ["kiwi"],
    caloriesPer100g: 61,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("slice", 8, 1), piece("kiwi", 75, 0.5)],
    note: "Serve ripe and soft.",
  },
  {
    key: "plum",
    name: "Plum",
    aliases: ["plum"],
    caloriesPer100g: 46,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("slice", 10, 1), piece("small plum", 66, 0.5)],
    note: "Remove pit and cut into soft toddler-safe pieces.",
  },
  {
    key: "prune",
    name: "Dried plum / prune",
    aliases: ["dried plum", "prune", "dried plum / prune"],
    caloriesPer100g: 240,
    defaultAmount: 12,
    defaultUnit: "g",
    units: [gramUnit(2), piece("prune", 9.5, 0.5), tbsp(10)],
    note: "Energy dense; serve chopped and modestly.",
  },
  {
    key: "pear",
    name: "Pear",
    aliases: ["pear"],
    caloriesPer100g: 57,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("thin slice", 10, 1), cup(140)],
    note: "Serve ripe, peeled if skin is tough.",
  },
  {
    key: "chicken",
    name: "Chicken",
    aliases: ["chicken"],
    caloriesPer100g: 165,
    defaultAmount: 25,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(9), cup(140), piece("strip", 15, 1)],
    note: "Cook until tender; keep separate if mixed protein is refused.",
  },
  {
    key: "fish",
    name: "Fish",
    aliases: ["fish"],
    caloriesPer100g: 130,
    defaultAmount: 25,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(9), cup(136), piece("flake", 8, 1)],
    note: "Check carefully for bones.",
  },
  {
    key: "beef",
    name: "Beef",
    aliases: ["beef"],
    caloriesPer100g: 250,
    defaultAmount: 20,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(9), cup(135), piece("strip", 12, 1)],
    note: "Serve very tender and finely chopped.",
  },
  {
    key: "pork",
    name: "Pork",
    aliases: ["pork"],
    caloriesPer100g: 242,
    defaultAmount: 20,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(9), cup(135), piece("strip", 12, 1)],
    note: "Serve very tender and low-salt.",
  },
  {
    key: "tofu",
    name: "Tofu",
    aliases: ["tofu"],
    caloriesPer100g: 144,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(15), cup(248), piece("cube", 12, 1)],
    note: "Soft cubes work well as finger food.",
  },
  {
    key: "beans_lentils",
    name: "Beans / lentils",
    aliases: ["beans", "lentils", "beans / lentils"],
    caloriesPer100g: 116,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(12), cup(198)],
    note: "Cook until very soft; lightly mash if needed.",
  },
  {
    key: "avocado",
    name: "Avocado",
    aliases: ["avocado"],
    caloriesPer100g: 160,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(14), cup(150), piece("slice", 15, 1)],
    note: "Good energy-dense soft finger food.",
  },
  {
    key: "bread",
    name: "Bread",
    aliases: ["bread"],
    caloriesPer100g: 265,
    defaultAmount: 0.5,
    defaultUnit: "slice",
    units: [piece("slice", 28, 0.5), gramUnit(5), piece("finger strip", 7, 1)],
    note: "Offer soft strips; avoid hard crusts if difficult.",
  },
  {
    key: "biscuit",
    name: "Biscuit",
    aliases: ["biscuit"],
    caloriesPer100g: 450,
    defaultAmount: 1,
    defaultUnit: "small_piece",
    units: [piece("small piece", 8, 1), gramUnit(2)],
    note: "Varies widely; use packaging when possible.",
  },
  {
    key: "vegetables",
    name: "Vegetables",
    aliases: ["vegetables", "veg"],
    caloriesPer100g: 35,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(10), cup(90), piece("chopped spoon", 10, 1)],
    note: "Cook until soft; calories vary by vegetable.",
  },
  {
    key: "butter",
    name: "Butter",
    aliases: ["butter"],
    caloriesPer100g: 717,
    defaultAmount: 1,
    defaultUnit: "tsp",
    units: [tsp(4.7), tbsp(14.2), gramUnit(1)],
    note: "Energy dense; keep portions intentional.",
  },
  {
    key: "olive_oil",
    name: "Olive oil",
    aliases: ["olive oil", "oil"],
    caloriesPer100g: 884,
    defaultAmount: 1,
    defaultUnit: "tbsp",
    units: [
      tsp(4.5),
      tbsp(13.5),
      { unit: "ml", label: "ml", grams: 0.91, step: 1, min: 1 },
      { unit: "l", label: "L", grams: 910, step: 0.01, min: 0.01 },
      gramUnit(1),
    ],
    note: "1 tbsp olive oil is about 13.5 g; 1 tsp is about 4.5 g.",
  },
];

export function getIngredientDefinition(name: string) {
  const normalized = normalizeIngredient(name);
  return ingredientDefinitions.find((item) => item.aliases.some((alias) => normalizeIngredient(alias) === normalized));
}

export function normalizeIngredient(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

export function formatAmount(value: number) {
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
  return {
    id: `${definition.key}-${crypto.randomUUID()}`,
    ingredientKey: definition.key,
    name: definition.name,
    suggestedAmount: definition.defaultAmount,
    suggestedUnit: definition.defaultUnit,
    suggestedGrams: grams,
    amount: definition.defaultAmount,
    unit: definition.defaultUnit,
    grams,
    calories: caloriesFor(definition, grams),
    note: definition.note,
  };
}

export function updateMealBuilderItem(item: MealBuilderItem, nextAmount: number, nextUnit = item.unit): MealBuilderItem {
  const definition = ingredientDefinitions.find((definitionItem) => definitionItem.key === item.ingredientKey);
  if (!definition) return item;
  const unit = definition.units.find((unitItem) => unitItem.unit === nextUnit) || definition.units[0];
  const amount = Math.max(unit.min, nextAmount);
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

  if (keys.has("yoghurt")) {
    suggestions.push({
      id: "yoghurt-snack-bowl",
      title: "Planned Yoghurt Bowl",
      subtitle: "A simple snack with measured fruit instead of rescue fruit.",
      mealType: /breakfast/i.test(type) ? "Morning tea" : type,
      ingredients: ["Full-fat yoghurt", keys.has("banana") ? "Banana" : "Pear", keys.has("biscuit") ? "Biscuit" : "Avocado"],
      steps: ["Serve yoghurt in a small bowl.", "Add only the planned fruit portion.", "Keep biscuit or avocado separate."],
      safety: "Avoid using fruit or milk as a replacement if the main food is refused.",
    });
  }

  if (keys.has("rice") && (keys.has("chicken") || keys.has("fish") || keys.has("tofu") || keys.has("beans_lentils"))) {
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

export function summarizeMeal(items: MealBuilderItem[]) {
  return {
    totalCalories: items.reduce((sum, item) => sum + item.calories, 0),
    totalGrams: items.reduce((sum, item) => sum + item.grams, 0),
    fruitCalories: items
      .filter((item) => ["banana", "mandarin", "grape", "kiwi", "plum", "prune", "pear"].includes(item.ingredientKey))
      .reduce((sum, item) => sum + item.calories, 0),
    proteinItems: items.filter((item) =>
      ["egg", "cheese", "yoghurt", "chicken", "fish", "beef", "pork", "tofu", "beans_lentils"].includes(item.ingredientKey),
    ),
  };
}
