import { z } from "zod";

export const childProfileSchema = z.object({
  ageMonths: z.coerce.number().min(6).max(72).default(19.5),
  weightKg: z.coerce.number().min(4).max(30).default(8.8),
  fingerFoodPreferred: z.boolean().default(true),
  avoidFoods: z.array(z.string().max(40)).default(["noodles", "congee"]),
  goals: z
    .array(z.string().max(80))
    .default(["weight gain", "protein exposure", "reduce fruit/milk rescue"]),
  acceptedSafeFoods: z.array(z.string().max(60)).default(["rice", "yoghurt", "banana"]),
  fruitOptions: z
    .array(z.string().max(40))
    .default(["mandarin", "grape", "kiwi", "plum", "dried plum", "pear", "banana"]),
});

export const generateMealRequestSchema = z.object({
  mode: z.enum(["single", "whole_day"]),
  mealType: z.string().max(80),
  freeText: z.string().max(800).default(""),
  selectedIngredients: z.array(z.string().max(50)).max(30).default([]),
  childProfile: childProfileSchema,
});

export const mealIngredientSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  note: z.string(),
});

export const mealPlanSchema = z.object({
  title: z.string(),
  mealType: z.string(),
  summary: z.string(),
  ingredients: z.array(mealIngredientSchema).min(1),
  preparationSteps: z.array(z.string()).min(1),
  optionalAddOns: z.array(z.string()).default([]),
  fruitGuidance: z.string(),
  feedingGuidance: z.string(),
  safetyNotes: z.array(z.string()).min(1),
  costEstimate: z
    .object({
      inputTokens: z.number(),
      outputTokens: z.number(),
      estimatedUsd: z.number(),
    })
    .optional(),
});

export const dayMealSchema = mealPlanSchema.extend({
  slot: z.string(),
});

export const mealAiResponseSchema = z.union([
  mealPlanSchema,
  z.object({
    meals: z.array(dayMealSchema).min(3).max(7),
  }),
]);

const openAiMealSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    mealType: { type: "string" },
    summary: { type: "string" },
    ingredients: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          quantity: { type: "string" },
          note: { type: "string" },
        },
        required: ["name", "quantity", "note"],
      },
    },
    preparationSteps: { type: "array", items: { type: "string" } },
    optionalAddOns: { type: "array", items: { type: "string" } },
    fruitGuidance: { type: "string" },
    feedingGuidance: { type: "string" },
    safetyNotes: { type: "array", items: { type: "string" } },
  },
  required: [
    "title",
    "mealType",
    "summary",
    "ingredients",
    "preparationSteps",
    "optionalAddOns",
    "fruitGuidance",
    "feedingGuidance",
    "safetyNotes",
  ],
} as const;

export function jsonSchemaForOpenAi(mode: "single" | "whole_day") {
  const schema =
    mode === "whole_day"
      ? {
          type: "object",
          additionalProperties: false,
          properties: {
            meals: {
              type: "array",
              minItems: 3,
              maxItems: 7,
              items: {
                ...openAiMealSchema,
                properties: {
                  slot: { type: "string" },
                  ...openAiMealSchema.properties,
                },
                required: ["slot", ...openAiMealSchema.required],
              },
            },
          },
          required: ["meals"],
        }
      : openAiMealSchema;

  return {
  name: "tinybite_meal_plan",
  schema,
  strict: true,
  } as const;
}
