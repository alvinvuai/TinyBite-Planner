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
  chicken: "🍗",
  chicken_thigh: "🍗",
  chicken_drumstick: "🍗",
  fish: "🐟",
  prawn: "🍤",
  beef: "🥩",
  pork: "🥓",
  beef_vege_soup: "🍲",
  chicken_vege_soup: "🥘",
  pork_vege_soup: "🍜",
  tofu: "⬜",
  beans_lentils: "🫘",
  avocado: "🥑",
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
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: style.dot }} />
              <p className="text-xs font-black uppercase tracking-[0.08em]" style={{ color: style.text }}>
                {categoryLabels[category]}
              </p>
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
                    imageSrc={ingredient.imageSrc}
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
