"use client";

import Image from "next/image";
import type { NutritionCategory } from "@/types/nutrition";

type FoodItemCardProps = {
  id: string;
  name: string;
  category: NutritionCategory;
  icon?: string;
  imageSrc?: string;
  selected: boolean;
  color: {
    text: string;
    bg: string;
    border: string;
    dot: string;
  };
  onToggle: () => void;
};

const fallbackIcons: Record<NutritionCategory, string> = {
  carb: "🍚",
  protein: "🍗",
  dairy: "🥛",
  fruit: "🍓",
  vegetable: "🥦",
  fat: "🥑",
  treat: "🍪",
};

export function FoodItemCard({ id, name, category, icon, imageSrc, selected, color, onToggle }: FoodItemCardProps) {
  const visual = icon || fallbackIcons[category];

  return (
    <button
      type="button"
      data-food-id={id}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
      aria-pressed={selected}
      aria-label={`${selected ? "Remove" : "Add"} ${name}`}
      className="pressable group relative flex min-h-[9.25rem] w-full flex-col items-center justify-between rounded-[8px] border p-3 text-center shadow-sm outline-none transition duration-150 focus-visible:ring-4 focus-visible:ring-[#f4a9cf]/45"
      style={{
        background: selected ? `linear-gradient(180deg, ${color.bg} 0%, #fffafd 100%)` : "rgba(255,250,253,0.92)",
        borderColor: selected ? color.dot : color.border,
        boxShadow: selected
          ? `0 16px 30px color-mix(in srgb, ${color.dot} 24%, transparent), inset 0 1px 0 rgba(255,255,255,0.95)`
          : "0 8px 18px rgba(126,70,101,0.08)",
        transform: selected ? "translateY(-2px)" : undefined,
      }}
    >
      <span
        className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full border text-sm font-black transition"
        style={{
          background: selected ? color.dot : "#fffafd",
          borderColor: selected ? color.dot : "#ead8e2",
          color: selected ? "#ffffff" : color.text,
          opacity: selected ? 1 : 0.58,
        }}
        aria-hidden="true"
      >
        {selected ? "✓" : "+"}
      </span>

      <span
        className="mt-3 grid h-20 w-20 place-items-center rounded-full border text-5xl shadow-inner transition group-hover:scale-[1.03]"
        style={{
          background: selected ? "#ffffff" : color.bg,
          borderColor: color.border,
        }}
        aria-hidden="true"
      >
        {imageSrc ? <Image src={imageSrc} alt="" width={64} height={64} className="h-16 w-16 object-contain" /> : visual}
      </span>

      <span className="mt-3 flex min-h-10 items-center text-sm font-black leading-tight text-[#5e3752]">{name}</span>
    </button>
  );
}
