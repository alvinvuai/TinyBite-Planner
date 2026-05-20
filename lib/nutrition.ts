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

export const mealSchedules: Record<string, { timeFrame: string; note: string }> = {
  Breakfast: { timeFrame: "7:15-8:00 am", note: "After the 7:00 am wake-up, keep this as the calm first food of the day." },
  "Dessert after breakfast": { timeFrame: "8:15-8:45 am", note: "Only a small planned portion after breakfast, not a rescue if breakfast was refused." },
  "Snack after breakfast / morning tea": { timeFrame: "9:45-10:20 am", note: "A light bridge before early lunch so appetite is still ready before nap." },
  Lunch: { timeFrame: "10:45-11:20 am", note: "Offer lunch before the usual 11:30 am-1:30 pm nap window." },
  "Dessert after lunch": { timeFrame: "1:35-2:00 pm", note: "Best after waking from the lunch nap if a small planned dessert is needed." },
  "Afternoon tea": { timeFrame: "3:00-3:45 pm", note: "A measured snack between nap and dinner." },
  Dinner: { timeFrame: "5:30-6:15 pm", note: "Main evening meal with enough space before the 8:45 pm sleep time." },
  "After dinner snack": { timeFrame: "7:00-7:30 pm", note: "Optional and small, only if planned and appetite suggests it." },
  "Small portion eating with family": { timeFrame: "6:15-6:45 pm", note: "Use as a small family-food top-up plate, not an unlimited second dinner." },
  "Bedtime milk/yoghurt": { timeFrame: "7:45-8:15 pm", note: "Keep it scheduled before the 8:45 pm bedtime, not used after refusals." },
  "Whole day plan": { timeFrame: "7:15 am-8:15 pm", note: "Built around lunch nap 11:30 am-1:30 pm and night sleep 8:45 pm-7:00 am." },
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
    name: "Jasmine rice (cooked)",
    aliases: ["rice", "jasmine rice", "white rice", "cooked rice"],
    category: "carb",
    caloriesPer100g: 130,
    defaultAmount: 8,
    defaultUnit: "tbsp",
    units: [gramUnit(5), tbsp(9.9), piece("rice spoon", 20, 0.5)],
    nutrientsPer100g: n({ protein: 2.69, carbs: 28.2, fat: 0.28, fiber: 0.4, iron: 1.2, zinc: 0.49, calcium: 10, omega3: 13 }),
    note: "USDA SR Legacy (FDC 168878) long-grain cooked profile used as jasmine cooked estimate.",
  },
  {
    key: "glutinous_rice",
    name: "Glutinous rice (cooked)",
    aliases: ["glutinous rice", "sticky rice", "sweet rice"],
    category: "carb",
    caloriesPer100g: 97,
    defaultAmount: 8,
    defaultUnit: "tbsp",
    units: [gramUnit(5), tbsp(9.9), piece("rice spoon", 20, 0.5)],
    nutrientsPer100g: n({ protein: 2.02, carbs: 21.1, fat: 0.19, fiber: 1, iron: 0.14, zinc: 0.41, calcium: 2, omega3: 3 }),
    note: "USDA SR Legacy (FDC 169711) glutinous rice, cooked.",
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
    key: "laughing_cow_cheese",
    name: "The Laughing Cow cheese wedge",
    aliases: ["laughing cow", "the laughing cow", "laughing cow cheese", "laughing cow wedge", "cheese wedge"],
    category: "dairy",
    caloriesPer100g: 170,
    defaultAmount: 1,
    defaultUnit: "wedge",
    units: [piece("wedge", 16, 0.5), gramUnit(2)],
    nutrientsPer100g: n({ protein: 8.1, carbs: 6.3, fat: 12.5, calcium: 250, zinc: 0.9 }),
    note: "Processed cheese wedge estimate; check the packet for exact nutrition and keep portions small.",
  },
  {
    key: "yoghurt",
    name: "Full-fat yoghurt",
    aliases: ["yoghurt", "yogurt"],
    category: "dairy",
    caloriesPer100g: 61,
    defaultAmount: 100,
    defaultUnit: "g",
    units: [gramUnit(5), tbsp(15), piece("small tub", 100, 0.5)],
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
    key: "strawberry",
    name: "Strawberry",
    aliases: ["strawberry", "strawberries"],
    category: "fruit",
    caloriesPer100g: 32,
    defaultAmount: 2,
    defaultUnit: "strawberry",
    units: [piece("strawberry", 12, 1), piece("slice", 3, 1), gramUnit(5)],
    nutrientsPer100g: n({ protein: 0.7, carbs: 7.7, fat: 0.3, fiber: 2, iron: 0.4, zinc: 0.1, calcium: 16, omega3: 65 }),
    note: "Remove the leafy top and cut into soft toddler-safe pieces.",
  },
  {
    key: "chicken",
    name: "Chicken breast",
    aliases: ["chicken", "chicken breast", "breast"],
    category: "protein",
    caloriesPer100g: 165,
    defaultAmount: 25,
    defaultUnit: "g",
    units: [gramUnit(5), piece("strip", 15, 1), piece("shredded bite", 5, 1)],
    nutrientsPer100g: n({ protein: 31, fat: 3.6, iron: 1, zinc: 1, calcium: 15, omega3: 40 }),
    note: "USDA FDC 171477, breast meat-only cooked/roasted.",
  },
  {
    key: "chicken_thigh",
    name: "Chicken thigh",
    aliases: ["chicken thigh", "thigh"],
    category: "protein",
    caloriesPer100g: 209,
    defaultAmount: 25,
    defaultUnit: "g",
    units: [gramUnit(5), piece("strip", 15, 1), piece("shredded bite", 5, 1)],
    nutrientsPer100g: n({ protein: 26, fat: 10.9, iron: 1.3, zinc: 2.4, calcium: 11, omega3: 110 }),
    note: "USDA FoodData Central thigh meat-only cooked/roasted profile.",
  },
  {
    key: "chicken_drumstick",
    name: "Chicken drumstick",
    aliases: ["chicken drumstick", "drumstick"],
    category: "protein",
    caloriesPer100g: 172,
    defaultAmount: 25,
    defaultUnit: "g",
    units: [gramUnit(5), piece("strip", 15, 1), piece("shredded bite", 5, 1)],
    nutrientsPer100g: n({ protein: 28.3, fat: 5.7, iron: 1.2, zinc: 2.7, calcium: 12, omega3: 80 }),
    note: "USDA FoodData Central drumstick meat-only cooked profile.",
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
    key: "prawn",
    name: "Prawn",
    aliases: ["prawn", "prawns", "shrimp"],
    category: "protein",
    caloriesPer100g: 99,
    defaultAmount: 25,
    defaultUnit: "g",
    units: [gramUnit(5), piece("small prawn", 6, 1), piece("chopped spoon", 10, 1)],
    nutrientsPer100g: n({ protein: 24, carbs: 0.2, fat: 0.3, iron: 0.5, zinc: 1.3, calcium: 70, omega3: 295 }),
    note: "Serve fully cooked and chopped into toddler-safe pieces.",
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
    key: "beef_vege_soup",
    name: "Beef and vege soup",
    aliases: ["beef and vege soup", "beef and vegetable soup", "beef vege soup", "beef veg soup", "beef soup"],
    category: "protein",
    caloriesPer100g: 55,
    defaultAmount: 100,
    defaultUnit: "g",
    units: [gramUnit(20), tbsp(15), piece("small bowl", 150, 0.25)],
    nutrientsPer100g: n({ protein: 5, carbs: 5.5, fat: 1.8, fiber: 1.1, iron: 0.9, zinc: 1.3, calcium: 16 }),
    note: "Homestyle low-salt estimate; serve tender meat and soft vegetables.",
  },
  {
    key: "chicken_vege_soup",
    name: "Chicken and vege soup",
    aliases: ["chicken and vege soup", "chicken and vegetable soup", "chicken vege soup", "chicken veg soup", "chicken soup"],
    category: "protein",
    caloriesPer100g: 45,
    defaultAmount: 100,
    defaultUnit: "g",
    units: [gramUnit(20), tbsp(15), piece("small bowl", 150, 0.25)],
    nutrientsPer100g: n({ protein: 4.7, carbs: 4.8, fat: 1.2, fiber: 1, iron: 0.4, zinc: 0.5, calcium: 15, omega3: 8 }),
    note: "Homestyle low-salt estimate; shred chicken finely and keep vegetables soft.",
  },
  {
    key: "pork_vege_soup",
    name: "Pork and vege soup",
    aliases: ["pork and vege soup", "pork and vegetable soup", "pork vege soup", "pork veg soup", "pork vegesoup", "pork soup"],
    category: "protein",
    caloriesPer100g: 60,
    defaultAmount: 100,
    defaultUnit: "g",
    units: [gramUnit(20), tbsp(15), piece("small bowl", 150, 0.25)],
    nutrientsPer100g: n({ protein: 5.2, carbs: 4.8, fat: 2.4, fiber: 1, iron: 0.5, zinc: 0.9, calcium: 15 }),
    note: "Homestyle low-salt estimate; serve tender pork and soft vegetables.",
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
    units: [gramUnit(5), tbsp(12), piece("soft spoon", 12, 1)],
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
    key: "sesame_seed",
    name: "Sesame seed",
    aliases: ["sesame", "sesame seed", "sesame seeds"],
    category: "fat",
    caloriesPer100g: 573,
    defaultAmount: 0.5,
    defaultUnit: "tsp",
    units: [tsp(3), gramUnit(1), piece("small sprinkle", 1, 1)],
    nutrientsPer100g: n({ protein: 17.7, carbs: 23.4, fat: 49.7, fiber: 11.8, iron: 14.6, zinc: 7.8, calcium: 975, omega3: 376 }),
    note: "Use as a small sprinkle, ideally ground or mixed through moist food; avoid thick spoonfuls of sesame paste.",
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
    key: "broccoli",
    name: "Broccoli (cooked)",
    aliases: ["broccoli"],
    category: "vegetable",
    caloriesPer100g: 35,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("soft floret", 12, 1), piece("chopped spoon", 10, 1)],
    nutrientsPer100g: n({ protein: 2.38, carbs: 7.18, fat: 0.41, fiber: 3.3, iron: 0.67, zinc: 0.45, calcium: 40, omega3: 39 }),
    note: "USDA FDC 169967, boiled/drained without salt.",
  },
  {
    key: "carrot",
    name: "Carrot (cooked)",
    aliases: ["carrot", "carrots"],
    category: "vegetable",
    caloriesPer100g: 35,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("stick", 8, 1), piece("chopped spoon", 10, 1)],
    nutrientsPer100g: n({ protein: 0.76, carbs: 8.22, fat: 0.18, fiber: 3, iron: 0.34, zinc: 0.24, calcium: 30, omega3: 1 }),
    note: "USDA FDC 170394, boiled/drained without salt.",
  },
  {
    key: "spinach",
    name: "Spinach (cooked)",
    aliases: ["spinach"],
    category: "vegetable",
    caloriesPer100g: 23,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("chopped spoon", 10, 1), piece("small bunch", 20, 1)],
    nutrientsPer100g: n({ protein: 2.97, carbs: 3.75, fat: 0.26, fiber: 2.4, iron: 3.57, zinc: 0.53, calcium: 136, omega3: 138 }),
    note: "USDA FDC 168463, boiled/drained without salt.",
  },
  {
    key: "mushroom",
    name: "Mushroom (cooked)",
    aliases: ["mushroom", "mushrooms"],
    category: "vegetable",
    caloriesPer100g: 28,
    defaultAmount: 30,
    defaultUnit: "g",
    units: [gramUnit(5), piece("slice", 5, 1), piece("chopped spoon", 10, 1)],
    nutrientsPer100g: n({ protein: 2.2, carbs: 4.3, fat: 0.4, fiber: 1.8, iron: 0.5, zinc: 0.7, calcium: 3, omega3: 20 }),
    note: "Cook until soft and finely sliced for easier chewing.",
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
  {
    key: "avocado_oil",
    name: "Avocado oil",
    aliases: ["avocado oil"],
    category: "fat",
    caloriesPer100g: 884,
    defaultAmount: 1,
    defaultUnit: "tsp",
    units: [tsp(4.5), tbsp(13.5), mlUnit(0.91, 1), gramUnit(1)],
    nutrientsPer100g: n({ fat: 100, omega3: 957 }),
    note: "USDA SR Legacy (FDC 173573).",
  },
  {
    key: "canola_oil",
    name: "Canola oil",
    aliases: ["canola oil", "rapeseed oil"],
    category: "fat",
    caloriesPer100g: 884,
    defaultAmount: 1,
    defaultUnit: "tsp",
    units: [tsp(4.6), tbsp(13.8), mlUnit(0.92, 1), gramUnit(1)],
    nutrientsPer100g: n({ fat: 100, omega3: 9140 }),
    note: "USDA SR Legacy (FDC 172336).",
  },
];

const categories: NutritionCategory[] = ["carb", "protein", "dairy", "fruit", "vegetable", "fat", "treat"];

const mainMealTypes = new Set(["Breakfast", "Lunch", "Dinner", "Small portion eating with family", "Whole day plan"]);

const lightSnackIngredientKeys = new Set([
  "cheese",
  "laughing_cow_cheese",
  "yoghurt",
  "fresh_cow_milk",
  "pediasure_milk",
  "banana",
  "mandarin",
  "grape",
  "kiwi",
  "plum",
  "prune",
  "pear",
  "strawberry",
  "avocado",
  "sesame_seed",
  "bread",
  "biscuit",
]);

const dessertIngredientKeys = new Set([
  "cheese",
  "laughing_cow_cheese",
  "yoghurt",
  "banana",
  "mandarin",
  "grape",
  "kiwi",
  "plum",
  "prune",
  "pear",
  "strawberry",
]);
const bedtimeIngredientKeys = new Set(["yoghurt", "fresh_cow_milk", "pediasure_milk"]);

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

function hasAnyRice(keys: Set<string>) {
  return keys.has("rice") || keys.has("glutinous_rice");
}

function hasAnyOil(keys: Set<string>) {
  return keys.has("olive_oil") || keys.has("avocado_oil") || keys.has("canola_oil");
}

function hasAnyCheese(keys: Set<string>) {
  return keys.has("cheese") || keys.has("laughing_cow_cheese");
}

function hasAnyChicken(keys: Set<string>) {
  return keys.has("chicken") || keys.has("chicken_thigh") || keys.has("chicken_drumstick");
}

export function getIngredientDefinition(name: string) {
  const normalized = normalizeIngredient(name);
  return ingredientDefinitions.find(
    (item) =>
      normalizeIngredient(item.name) === normalized ||
      normalizeIngredient(item.key) === normalized ||
      item.aliases.some((alias) => normalizeIngredient(alias) === normalized),
  );
}

export function getAllowedIngredientDefinitions(mealType: string) {
  if (mainMealTypes.has(mealType)) return ingredientDefinitions;
  if (mealType === "Bedtime milk/yoghurt") {
    return ingredientDefinitions.filter((ingredient) => bedtimeIngredientKeys.has(ingredient.key));
  }
  if (mealType.includes("Dessert")) {
    return ingredientDefinitions.filter((ingredient) => dessertIngredientKeys.has(ingredient.key));
  }
  return ingredientDefinitions.filter((ingredient) => lightSnackIngredientKeys.has(ingredient.key));
}

export function isIngredientAllowedForMeal(ingredientKeyOrName: string, mealType: string) {
  const definition = getIngredientDefinition(ingredientKeyOrName);
  if (!definition) return false;
  return getAllowedIngredientDefinitions(mealType).some((ingredient) => ingredient.key === definition.key);
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

export function createCustomMealBuilderItem(name: string, calories: number): MealBuilderItem | null {
  const trimmedName = name.trim();
  const roundedCalories = Math.round(calories);
  if (!trimmedName || !Number.isFinite(roundedCalories) || roundedCalories <= 0) return null;

  return {
    id: `custom-${crypto.randomUUID()}`,
    ingredientKey: `custom_${Date.now()}`,
    name: trimmedName.slice(0, 100),
    category: "treat",
    suggestedAmount: 1,
    suggestedUnit: "item",
    suggestedGrams: 0,
    suggestedCalories: roundedCalories,
    amount: 1,
    unit: "item",
    grams: 0,
    calories: roundedCalories,
    note: "Custom item",
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

  if (keys.has("egg") && hasAnyRice(keys)) {
    suggestions.push({
      id: "egg-rice-fingers",
      title: "Soft Egg Rice Fingers",
      subtitle: "Rice patties with egg kept soft and easy to hold.",
      mealType: type,
      ingredients: ["Rice", "Egg", hasAnyCheese(keys) ? "Cheese" : "Butter or oil"],
      steps: ["Mix a small amount of rice with egg.", "Cook as soft mini patties.", "Let cool and cut into finger strips."],
      safety: "Serve soft and cool enough. Keep some plain rice separate if mixed protein is rejected.",
    });
  }

  if (keys.has("egg") && (hasAnyCheese(keys) || hasAnyOil(keys) || keys.has("butter"))) {
    suggestions.push({
      id: "mini-omelette-strips",
      title: "Mini Omelette Strips",
      subtitle: "A soft protein-first finger food with a little energy-rich fat.",
      mealType: type,
      ingredients: ["Egg", hasAnyCheese(keys) ? "Cheese" : "Yoghurt", hasAnyOil(keys) ? "Oil" : "Butter"],
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

  if (hasAnyRice(keys) && (hasAnyChicken(keys) || keys.has("fish") || keys.has("prawn") || keys.has("tofu") || keys.has("beans_lentils") || keys.has("beef"))) {
    suggestions.push({
      id: "separate-rice-protein-plate",
      title: "Rice + Protein Side Plate",
      subtitle: "Safe rice with protein served separately for gentle exposure.",
      mealType: type,
      ingredients: ["Rice", "Protein", "Vegetables", "Oil or butter"],
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
      const itemCalories = Number(item.calories);
      const safeCalories = Number.isFinite(itemCalories) ? itemCalories : 0;
      const itemGrams = Number(item.grams);
      const safeGrams = Number.isFinite(itemGrams) ? itemGrams : 0;

      summary.totalCalories += safeCalories;
      summary.totalGrams += safeGrams;
      summary.categoryCalories[item.category] += safeCalories;

      const definition = ingredientDefinitions.find((definitionItem) => definitionItem.key === item.ingredientKey);
      if (!definition) return summary;
      const factor = safeGrams / 100;
      summary.macros.protein += definition.nutrientsPer100g.protein * factor;
      summary.macros.carbs += definition.nutrientsPer100g.carbs * factor;
      summary.macros.fat += definition.nutrientsPer100g.fat * factor;
      summary.nutrients.fiber += definition.nutrientsPer100g.fiber * factor;
      summary.nutrients.iron += definition.nutrientsPer100g.iron * factor;
      summary.nutrients.zinc += definition.nutrientsPer100g.zinc * factor;
      summary.nutrients.calcium += definition.nutrientsPer100g.calcium * factor;
      summary.nutrients.omega3 += definition.nutrientsPer100g.omega3 * factor;
      if (["banana", "mandarin", "grape", "kiwi", "plum", "prune", "pear", "strawberry"].includes(item.ingredientKey)) {
        summary.fruitCalories += safeCalories;
      }
      if (
        [
          "egg",
          "cheese",
          "laughing_cow_cheese",
          "yoghurt",
          "fresh_cow_milk",
          "pediasure_milk",
          "chicken",
          "chicken_thigh",
          "chicken_drumstick",
          "fish",
          "prawn",
          "beef",
          "pork",
          "beef_vege_soup",
          "chicken_vege_soup",
          "pork_vege_soup",
          "tofu",
          "beans_lentils",
        ].includes(item.ingredientKey)
      ) {
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
