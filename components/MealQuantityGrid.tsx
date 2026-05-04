"use client";

import { useState } from "react";
import { CuteButton } from "@/components/CuteButton";
import {
  convertMealBuilderItemUnit,
  convertSuggestedMealBuilderItemUnit,
  createMealBuilderItem,
  formatAmount,
  ingredientDefinitions,
  summarizeMeal,
  updateMealBuilderItem,
} from "@/lib/nutrition";
import type { MealBuilderItem, UnitOption } from "@/types/nutrition";

type MealQuantityGridProps = {
  items: MealBuilderItem[];
  onChange: (items: MealBuilderItem[]) => void;
};

export function MealQuantityGrid({ items, onChange }: MealQuantityGridProps) {
  const [extraKey, setExtraKey] = useState("beans_lentils");
  const summary = summarizeMeal(items);

  function updateItem(id: string, next: MealBuilderItem) {
    onChange(items.map((item) => (item.id === id ? next : item)));
  }

  function addExtra() {
    const definition = ingredientDefinitions.find((item) => item.key === extraKey);
    if (!definition) return;
    const next = createMealBuilderItem(definition.name);
    if (next) onChange([...items, next]);
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  if (!items.length) {
    return (
      <section className="soft-card p-4 text-sm font-bold leading-6 text-[#765066]">
        Select foods above and TinyBite will show editable toddler-sized quantities here.
      </section>
    );
  }

  return (
    <section className="soft-card space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#633d55]">Editable ingredient quantities</p>
          <p className="text-xs font-semibold leading-5 text-[#8a6679]">Calories update when you change amount or unit.</p>
        </div>
        <div className="rounded-full bg-[#fff0d7] px-3 py-2 text-xs font-black text-[#8a5422]">{summary.totalCalories} kcal</div>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-white/80 bg-white/62">
        <div className="grid grid-cols-[0.95fr_0.78fr_1fr_0.48fr] gap-2 bg-[#fff8fb] px-3 py-2 text-[9px] font-black uppercase tracking-[0.06em] text-[#9c456c] sm:text-xs">
          <span>Ingredient</span>
          <span>Suggested</span>
          <span>Adjust</span>
          <span className="text-right">Calories</span>
        </div>
        <div className="divide-y divide-[#f4dce6]">
          {items.map((item) => {
            const definition = ingredientDefinitions.find((definitionItem) => definitionItem.key === item.ingredientKey);
            if (!definition) return null;
            const unit = definition.units.find((unitItem) => unitItem.unit === item.unit) || definition.units[0];
            const suggestedUnit = definition.units.find((unitItem) => unitItem.unit === item.suggestedUnit) || definition.units[0];
            return (
              <div key={item.id} className="grid grid-cols-[0.95fr_0.78fr_1fr_0.48fr] items-center gap-2 px-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-black leading-5 text-[#633d55]">{item.name}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-4 text-[#9a7487]">{Math.round(item.grams)} g est.</p>
                  <button type="button" className="mt-2 text-[10px] font-black text-[#c35f8d]" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black leading-5 text-[#633d55]">{formatAmount(item.suggestedAmount ?? item.amount)}</p>
                  <UnitMenu
                    label={`${item.name} suggested unit`}
                    units={definition.units}
                    selected={suggestedUnit.unit}
                    onSelect={(nextUnit) => updateItem(item.id, convertSuggestedMealBuilderItemUnit(item, nextUnit))}
                  />
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-[#9a7487]">fixed</p>
                </div>
                <div className="grid min-w-0 gap-1">
                  <div className="grid grid-cols-[1.65rem_minmax(2.75rem,1fr)_1.65rem] items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Decrease ${item.name}`}
                    className="pressable h-8 rounded-full bg-[#ffe0ec] text-base font-black text-[#9c456c]"
                    onClick={() => updateItem(item.id, updateMealBuilderItem(item, item.amount - unit.step))}
                  >
                    -
                  </button>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={unit.min}
                      step={unit.step}
                      value={formatAmount(item.amount)}
                      onChange={(event) => updateItem(item.id, updateMealBuilderItem(item, Number(event.target.value || unit.min)))}
                      className="h-8 min-w-0 rounded-[8px] border border-[#f6cbdb] bg-white px-1 text-center text-sm font-black text-[#633d55]"
                    />
                  <button
                    type="button"
                    aria-label={`Increase ${item.name}`}
                    className="pressable h-8 rounded-full bg-[#ffe0ec] text-base font-black text-[#9c456c]"
                    onClick={() => updateItem(item.id, updateMealBuilderItem(item, item.amount + unit.step))}
                  >
                    +
                  </button>
                  </div>
                  <UnitMenu
                    label={`${item.name} adjusted unit`}
                    units={definition.units}
                    selected={unit.unit}
                    onSelect={(nextUnit) => updateItem(item.id, convertMealBuilderItemUnit(item, nextUnit))}
                  />
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#8a5422]">{item.calories}</p>
                  <p className="text-[11px] font-bold text-[#b48b61]">kcal</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          value={extraKey}
          onChange={(event) => setExtraKey(event.target.value)}
          className="min-h-12 rounded-[8px] border border-white/80 bg-white/78 px-4 text-sm font-bold text-[#633d55]"
        >
          {ingredientDefinitions.map((definition) => (
            <option key={definition.key} value={definition.key}>
              Add {definition.name}
            </option>
          ))}
        </select>
        <CuteButton type="button" variant="secondary" onClick={addExtra}>
          Add ingredient
        </CuteButton>
      </div>

      <p className="text-xs font-semibold leading-5 text-[#8a6679]">
        Nutrition values are estimates for planning. Packaging, cooking method, and exact food variety can change calories.
      </p>
    </section>
  );
}

function UnitMenu({
  label,
  units,
  selected,
  onSelect,
}: {
  label: string;
  units: UnitOption[];
  selected: string;
  onSelect: (unit: string) => void;
}) {
  const active = units.find((unit) => unit.unit === selected) || units[0];

  return (
    <div className="relative mt-1">
      <select
        aria-label={label}
        value={active.unit}
        onChange={(event) => onSelect(event.currentTarget.value)}
        className="min-h-8 w-full min-w-0 appearance-none rounded-full border-0 bg-[#ffd7e8] px-2 py-1 pr-5 text-[11px] font-black text-[#9c456c] shadow-sm outline-none"
      >
        {units.map((unit) => (
          <option key={unit.unit} value={unit.unit}>
            {unit.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#9c456c]">▼</span>
    </div>
  );
}
