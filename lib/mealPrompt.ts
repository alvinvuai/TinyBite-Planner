import type { generateMealRequestSchema } from "@/lib/schemas";
import type { z } from "zod";

type GenerateMealRequest = z.infer<typeof generateMealRequestSchema>;

const baseRules = [
  "You suggest practical toddler meals, not medical care.",
  "No diagnosis, no guaranteed weight gain; advise GP/paediatrician review if poor weight gain continues.",
  "Child is 19.5 months and low weight unless profile says otherwise.",
  "Prefer calm finger foods and small exact toddler portions.",
  "Avoid noodles and congee if listed.",
  "Use rice safely, but never unlimited plain rice.",
  "If protein is often refused, keep some protein separate instead of stuck to rice.",
  "Fruit is portioned; never use fruit or milk as rescue reward.",
  "Milk/yoghurt is scheduled, not rescue.",
  "Mention choking safety: grapes quartered lengthwise; nuts avoided whole; peanut butter/tahini thin or mixed, never thick spoonfuls.",
  "Keep salt low; use butter/olive oil/yoghurt/cheese when helpful.",
  "Return JSON only.",
].join(" ");

export function buildMealMessages(input: GenerateMealRequest) {
  const compactUser = {
    mode: input.mode,
    mealType: input.mealType,
    foods: input.selectedIngredients,
    text: input.freeText.replace(/\s+/g, " ").trim().slice(0, 800),
    profile: input.childProfile,
    output:
      input.mode === "whole_day"
        ? "Return object {meals:[...]} with Breakfast, Morning snack, Lunch, Afternoon tea, Dinner, Optional bedtime milk/yoghurt. Each meal uses the meal schema and has slot."
        : "Return one meal object using the schema.",
  };

  return [
    { role: "system" as const, content: baseRules },
    { role: "user" as const, content: JSON.stringify(compactUser) },
  ];
}

export function buildRepairMessages(raw: string) {
  return [
    { role: "system" as const, content: "Repair to valid JSON only. Preserve toddler meal content. No markdown." },
    { role: "user" as const, content: raw.slice(0, 4000) },
  ];
}
