"use client";

import { useState } from "react";
import { CuteButton } from "@/components/CuteButton";
import type { SuggestedMeal } from "@/types/nutrition";

type SuggestedMealsProps = {
  meals: SuggestedMeal[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

export function SuggestedMeals({ meals, selectedId, onSelect }: SuggestedMealsProps) {
  const [open, setOpen] = useState(false);
  if (!meals.length) return null;

  const selected = meals.find((meal) => meal.id === selectedId);

  return (
    <section className="soft-card space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#633d55]">Meal ideas</p>
          <p className="text-xs font-semibold leading-5 text-[#8a6679]">Optional recipe details.</p>
        </div>
        <CuteButton type="button" variant="secondary" onClick={() => setOpen((current) => !current)} className="min-h-10 px-4 py-2">
          {open ? "Hide ideas" : "Show ideas"}
        </CuteButton>
      </div>

      {open ? (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {meals.map((meal) => {
              const active = selectedId === meal.id;
              return (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => onSelect(active ? null : meal.id)}
                  className={`pressable rounded-[8px] border p-3 text-left ${
                    active ? "border-[#ff83b7] bg-[#ffe0ec] shadow-[0_14px_25px_rgba(255,131,183,0.22)]" : "border-white/80 bg-white/68 shadow-sm"
                  }`}
                >
                  <p className="text-sm font-black text-[#633d55]">{meal.title}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#8a6679]">{meal.subtitle}</p>
                </button>
              );
            })}
          </div>

          {selected ? (
            <article className="rounded-[8px] bg-white/76 p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c35f8d]">{selected.mealType}</p>
              <h2 className="mt-1 text-xl font-black text-[#633d55]">{selected.title}</h2>
              <div className="mt-3 grid gap-2">
                {selected.steps.map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-[8px] bg-[#fff8fb] p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffd7e8] text-sm font-black text-[#9c456c]">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold leading-6 text-[#6d4a60]">{step}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-[8px] bg-[#fff3c7] p-3 text-sm font-bold leading-6 text-[#79501b]">{selected.safety}</p>
            </article>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
