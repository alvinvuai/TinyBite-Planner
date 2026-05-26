"use client";

import { FoodItemCard } from "@/components/FoodItemCard";
import { categoryLabels, categoryStyles, getAllowedIngredientDefinitions } from "@/lib/nutrition";
import type { NutritionCategory } from "@/types/nutrition";

const groupOrder: NutritionCategory[] = ["carb", "protein", "dairy", "fat", "fruit", "vegetable", "treat"];

const foodIcons: Record<string, string> = {
  rice: "🍚",
  glutinous_rice: "🍙",
  egg: "🥚",
  cheese: "🧀",
  yoghurt: "🥣",
  fresh_cow_milk: "🥛",
  pediasure_milk: "🍼",
  banana: "🍌",
  mandarin: "🍊",
  grape: "🍇",
  kiwi: "🥝",
  plum: "🟣",
  prune: "🟤",
  pear: "🍐",
  strawberry: "🍓",
  chicken: "🐔",
  chicken_thigh: "🍖",
  chicken_drumstick: "🍗",
  fish: "🐟",
  prawn: "🍤",
  beef: "🥩",
  pork: "🥓",
  beef_vege_soup: "🍲",
  chicken_vege_soup: "🥘",
  pork_vege_soup: "🍲",
  tofu: "⬜",
  beans_lentils: "🫘",
  avocado: "🥑",
  laughing_cow_cheese: "🧀",
  peanut_butter: "🥜",
  bread: "🍞",
  biscuit: "🍪",
  vegetables: "🥦",
  broccoli: "🥦",
  carrot: "🥕",
  spinach: "🌿",
  mushroom: "🍄",
  butter: "🧈",
  olive_oil: "🫒",
  avocado_oil: "🥑",
  canola_oil: "🌼",
};

const foodImageSrc: Record<string, string> = {
  plum: "/food/plum.svg",
  prune: "/food/prune.svg",
  sesame_seed: "/food/sesame-seed.svg",
  vegetables: "/food/mixed-vegetables.svg",
  spinach: "/food/spinach.svg",
};

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

  function clearCategory(ingredientNames: string[]) {
    const categorySet = new Set(ingredientNames);
    onChange(selected.filter((item) => !categorySet.has(item)));
  }

  return (
    <div className="space-y-4">
      {groupOrder.map((category) => {
        const group = ingredients.filter((ingredient) => ingredient.category === category);
        if (!group.length) return null;
        const style = categoryStyles[category];
        const selectedCount = group.filter((ingredient) => selected.includes(ingredient.name)).length;
        return (
          <section key={category} className="rounded-[8px] border bg-white/76 p-3 shadow-sm" style={{ borderColor: style.border }}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: style.dot }} />
                <p className="truncate text-xs font-black uppercase tracking-[0.08em]" style={{ color: style.text }}>
                  {categoryLabels[category]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => clearCategory(group.map((ingredient) => ingredient.name))}
                disabled={!selectedCount}
                className="pressable min-h-8 flex-none rounded-full border border-[#ead8e2] bg-white px-3 py-1 text-[11px] font-black text-[#633d55] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Clear {selectedCount ? `(${selectedCount})` : ""}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {group.map((ingredient) => {
                const active = selected.includes(ingredient.name);
                return (
                  <FoodItemCard
                    key={ingredient.key}
                    id={ingredient.key}
                    name={ingredient.name}
                    category={ingredient.category}
                    icon={ingredient.icon || foodIcons[ingredient.key]}
                    imageSrc={ingredient.imageSrc || foodImageSrc[ingredient.key]}
                    selected={active}
                    color={style}
                    onToggle={() => toggle(ingredient.name)}
                  />
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
