"use client";

import { categoryLabels, categoryStyles, formatAmount, mealTargets } from "@/lib/nutrition";
import type { NutritionCategory, NutritionSummary } from "@/types/nutrition";

type NutritionDashboardProps = {
  summary: NutritionSummary;
  mealType: string;
};

const nutrientTargets = {
  protein: 20,
  fiber: 14,
  iron: 9,
  zinc: 3,
  calcium: 500,
  omega3: 40,
};

const categoryOrder: NutritionCategory[] = ["carb", "protein", "dairy", "fruit", "vegetable", "fat", "treat"];

export function NutritionDashboard({ summary, mealType }: NutritionDashboardProps) {
  const target = mealTargets[mealType] ?? mealTargets.Breakfast;
  const macroCalories = {
    carbs: summary.macros.carbs * 4,
    protein: summary.macros.protein * 4,
    fat: summary.macros.fat * 9,
  };
  const macroTotal = Math.max(1, macroCalories.carbs + macroCalories.protein + macroCalories.fat);
  const carbPct = Math.round((macroCalories.carbs / macroTotal) * 100);
  const proteinPct = Math.round((macroCalories.protein / macroTotal) * 100);
  const fatPct = Math.max(0, 100 - carbPct - proteinPct);
  return (
    <section className="soft-card space-y-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[#633d55]">Nutrition balance</p>
          <p className="text-xs font-semibold leading-5 text-[#8a6679]">Estimated from the adjusted column.</p>
        </div>
        <div className="rounded-full bg-[#fff0d7] px-3 py-2 text-xs font-black text-[#8a5422]">
          {summary.totalCalories} / {summary.targetCalories} kcal
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[8px] bg-white/72 p-3">
          <div
            className="mx-auto grid h-32 w-32 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#f0a65e 0 ${carbPct}%, #d95763 ${carbPct}% ${carbPct + proteinPct}%, #d6a819 ${
                carbPct + proteinPct
              }% 100%)`,
            }}
            aria-label={`Macro chart: ${carbPct}% carbs, ${proteinPct}% protein, ${fatPct}% fat`}
          >
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-inner">
              <span className="text-lg font-black text-[#633d55]">{Math.round(summary.macros.protein)}g</span>
              <span className="-mt-4 text-[10px] font-bold text-[#8a6679]">protein</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px] font-black text-[#765066]">
            <span>Carb {carbPct}%</span>
            <span>Protein {proteinPct}%</span>
            <span>Fat {fatPct}%</span>
          </div>
        </div>

        <div className="space-y-2 rounded-[8px] bg-white/72 p-3">
          <MetricBar label="Calories" value={summary.totalCalories} target={summary.targetCalories} suffix="kcal" color="#d95763" />
          <MetricBar label="Protein" value={summary.macros.protein} target={target.protein} suffix="g" color="#d95763" />
          <MetricBar label="Carb" value={summary.macros.carbs} target={target.carbs} suffix="g" color="#f0a65e" />
          <MetricBar label="Fat" value={summary.macros.fat} target={target.fat} suffix="g" color="#d6a819" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <NutrientTile label="Iron" value={summary.nutrients.iron} target={nutrientTargets.iron} unit="mg" />
        <NutrientTile label="Zinc" value={summary.nutrients.zinc} target={nutrientTargets.zinc} unit="mg" />
        <NutrientTile label="Fibre" value={summary.nutrients.fiber} target={nutrientTargets.fiber} unit="g" />
        <NutrientTile label="Calcium" value={summary.nutrients.calcium} target={nutrientTargets.calcium} unit="mg" />
        <NutrientTile label="Omega 3" value={summary.nutrients.omega3} target={nutrientTargets.omega3} unit="mg" />
      </div>

      <div className="rounded-[8px] bg-white/72 p-3">
        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">Food group energy</p>
        <div className="mt-3 space-y-2">
          {categoryOrder
            .filter((category) => summary.categoryCalories[category] > 0)
            .map((category) => {
              const style = categoryStyles[category];
              const pct = Math.min(100, Math.round((summary.categoryCalories[category] / Math.max(1, summary.totalCalories)) * 100));
              return (
                <div key={category} className="grid grid-cols-[6.8rem_1fr_3rem] items-center gap-2 text-xs font-bold text-[#765066]">
                  <span style={{ color: style.text }}>{categoryLabels[category]}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-[#f5e7ee]">
                    <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: style.dot }} />
                  </span>
                  <span className="text-right">{pct}%</span>
                </div>
              );
            })}
        </div>
      </div>

      <p className="rounded-[8px] bg-[#fff8fb] p-3 text-xs font-semibold leading-5 text-[#8a6679]">
        Target: {target.note} This is a planning estimate, not medical advice. For ongoing low weight or no gain, keep GP,
        paediatrician, or dietitian review in the loop.
      </p>
    </section>
  );
}

function MetricBar({ label, value, target, suffix, color }: { label: string; value: number; target: number; suffix: string; color: string }) {
  const pct = Math.min(140, Math.round((value / Math.max(1, target)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-black text-[#633d55]">
        <span>{label}</span>
        <span>
          {formatAmount(value)} / {target} {suffix}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#f5e7ee]">
        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
      </div>
    </div>
  );
}

function NutrientTile({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return (
    <div className="rounded-[8px] bg-white/72 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#9c456c]">{label}</p>
      <p className="mt-1 text-lg font-black text-[#633d55]">
        {formatAmount(value)}
        <span className="ml-1 text-[10px] text-[#8a6679]">{unit}</span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f5e7ee]">
        <span className="block h-full rounded-full bg-[#ff9fc5]" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[10px] font-semibold text-[#9a7487]">{pct}% daily</p>
    </div>
  );
}
