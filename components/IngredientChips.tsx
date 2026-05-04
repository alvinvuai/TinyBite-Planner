"use client";

const ingredients = [
  "Rice",
  "Egg",
  "Cheese",
  "Yoghurt",
  "Banana",
  "Mandarin",
  "Grape",
  "Kiwi",
  "Plum",
  "Dried plum / prune",
  "Pear",
  "Chicken",
  "Fish",
  "Beef",
  "Pork",
  "Tofu",
  "Beans / lentils",
  "Avocado",
  "Bread",
  "Biscuit",
  "Vegetables",
  "Butter",
  "Olive oil",
];

type IngredientChipsProps = {
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function IngredientChips({ selected, onChange }: IngredientChipsProps) {
  function toggle(ingredient: string) {
    onChange(selected.includes(ingredient) ? selected.filter((item) => item !== ingredient) : [...selected, ingredient]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ingredients.map((ingredient) => {
        const active = selected.includes(ingredient);
        return (
          <button
            key={ingredient}
            type="button"
            onClick={() => toggle(ingredient)}
            className={`pressable min-h-10 rounded-full border px-3.5 py-2 text-sm font-semibold ${
              active
                ? "translate-y-[-3px] border-[#ff72ad] bg-[linear-gradient(145deg,#ffe0ec,#fff7fb)] text-[#8c3d61] shadow-[0_14px_24px_rgba(255,114,173,0.30),inset_0_1px_0_rgba(255,255,255,0.96)] ring-2 ring-[#ffc2dc]"
                : "border-white/80 bg-white/58 text-[#765066] shadow-[0_5px_12px_rgba(184,105,139,0.08)] hover:-translate-y-0.5 hover:bg-white/82 hover:shadow-[0_10px_18px_rgba(184,105,139,0.14)]"
            }`}
            aria-pressed={active}
          >
            {ingredient}
          </button>
        );
      })}
    </div>
  );
}
