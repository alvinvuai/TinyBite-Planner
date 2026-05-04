"use client";

import type { MealPlan, DayMeal } from "@/types/meal";
import { CuteButton } from "@/components/CuteButton";

type MealResultCardProps = {
  meal?: MealPlan;
  dayPlan?: DayMeal[];
  onRegenerate: () => void;
};

export function MealResultCard({ meal, dayPlan, onRegenerate }: MealResultCardProps) {
  const meals = dayPlan?.length ? dayPlan : meal ? [{ ...meal, slot: meal.mealType }] : [];
  if (!meals.length) return null;

  const copyText = meals
    .map((item) => {
      const ingredients = item.ingredients.map((ingredient) => `- ${ingredient.name}: ${ingredient.quantity} (${ingredient.note})`).join("\n");
      return `${item.slot}: ${item.title}\n${item.summary}\nIngredients:\n${ingredients}\nPreparation:\n${item.preparationSteps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\nSafety: ${item.safetyNotes.join(" ")}`;
    })
    .join("\n\n");

  function saveMeal() {
    const existing = JSON.parse(localStorage.getItem("tinybite-saved-meals") || "[]") as unknown[];
    localStorage.setItem("tinybite-saved-meals", JSON.stringify([{ savedAt: new Date().toISOString(), meals }, ...existing].slice(0, 25)));
  }

  async function copyMeal() {
    await navigator.clipboard.writeText(copyText);
  }

  return (
    <section className="sparkle-pop space-y-4">
      {meals.map((item) => (
        <article key={`${item.slot}-${item.title}`} className="soft-card relative overflow-hidden p-5">
          <div className="absolute right-4 top-3 text-2xl text-[#ffd36d]">✦</div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c35f8d]">{item.slot}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-[#633d55]">{item.title}</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[#765066]">{item.summary}</p>

          <div className="mt-4 space-y-2">
            {item.ingredients.map((ingredient) => (
              <div key={`${item.title}-${ingredient.name}`} className="rounded-[8px] bg-white/74 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-[#633d55]">{ingredient.name}</p>
                  <p className="rounded-full bg-[#fff0d7] px-3 py-1 text-right text-xs font-black text-[#8a5422]">{ingredient.quantity}</p>
                </div>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#8a6679]">{ingredient.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-2">
            {item.preparationSteps.map((step, index) => (
              <div key={`${item.title}-step-${step}`} className="flex gap-3 rounded-[8px] bg-[#fff8fb]/82 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffd7e8] text-sm font-black text-[#9c456c]">{index + 1}</span>
                <p className="text-sm font-semibold leading-6 text-[#6d4a60]">{step}</p>
              </div>
            ))}
          </div>

          {item.optionalAddOns.length ? (
            <div className="mt-4 rounded-[8px] bg-[#f4eeff]/80 p-3">
              <p className="text-sm font-black text-[#633d55]">Optional add-ons</p>
              <ul className="mt-2 space-y-1 text-sm font-semibold leading-6 text-[#765066]">
                {item.optionalAddOns.map((addOn) => (
                  <li key={addOn}>• {addOn}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 rounded-[8px] bg-[#fff3c7]/82 p-3 text-sm font-semibold leading-6 text-[#765066]">
            <p className="font-black text-[#79501b]">Safety</p>
            {item.safetyNotes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>

          <div className="mt-4 rounded-[8px] bg-[#ffe6f0]/82 p-3 text-sm font-semibold leading-6 text-[#765066]">
            <p className="font-black text-[#9c456c]">Fruit reminder</p>
            <p>{item.fruitGuidance}</p>
          </div>

          <div className="mt-4 rounded-[8px] bg-white/72 p-3 text-sm font-semibold leading-6 text-[#765066]">
            <p className="font-black text-[#633d55]">What if she refuses?</p>
            <p>{item.feedingGuidance}</p>
          </div>
        </article>
      ))}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <CuteButton type="button" variant="secondary" onClick={saveMeal}>
          Save this meal
        </CuteButton>
        <CuteButton type="button" variant="secondary" onClick={copyMeal}>
          Copy meal plan
        </CuteButton>
        <CuteButton type="button" onClick={onRegenerate}>
          Generate another idea
        </CuteButton>
      </div>
    </section>
  );
}
