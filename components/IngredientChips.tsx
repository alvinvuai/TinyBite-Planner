"use client";

import { categoryLabels, categoryStyles, getAllowedIngredientDefinitions } from "@/lib/nutrition";
import type { NutritionCategory } from "@/types/nutrition";

const groupOrder: NutritionCategory[] = ["carb", "protein", "dairy", "fat", "fruit", "vegetable", "treat"];

type IngredientChipsProps = {
  mealType: string;
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function IngredientChips({ mealType, selected, onChange }: IngredientChipsProps) {
  const ingredients = getAllowedIngredientDefinitions(mealType);

  function toggle(ingredient: string) {
    onChange(selected.includes(ingredient) ? selected.filter((item) => item !== ingredient) : [...selected, ingredient]);
  }

  return (
    <div className="space-y-4">
      {groupOrder.map((category) => {
        const group = ingredients.filter((ingredient) => ingredient.category === category);
        if (!group.length) return null;
        const style = categoryStyles[category];
        return (
          <section key={category} className="rounded-[8px] border bg-white/76 p-3 shadow-sm" style={{ borderColor: style.border }}>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: style.dot }} />
              <p className="text-xs font-black uppercase tracking-[0.08em]" style={{ color: style.text }}>
                {categoryLabels[category]}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {group.map((ingredient) => {
                const active = selected.includes(ingredient.name);
                return (
                  <button
                    key={ingredient.key}
                    type="button"
                    onClick={() => toggle(ingredient.name)}
                    className="pressable min-h-10 rounded-full border px-3.5 py-2 text-sm font-black shadow-sm transition-transform"
                    style={{
                      background: active ? style.bg : "#fffafd",
                      borderColor: active ? style.dot : "#ead8e2",
                      color: active ? style.text : "#5e3752",
                      boxShadow: active
                        ? `0 14px 24px color-mix(in srgb, ${style.dot} 24%, transparent), inset 0 1px 0 rgba(255,255,255,0.95)`
                        : "0 5px 12px rgba(126,70,101,0.08)",
                      transform: active ? "translateY(-3px)" : undefined,
                    }}
                    aria-pressed={active}
                  >
                    {ingredient.name}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
