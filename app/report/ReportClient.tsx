"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type NutritionTotals = {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  iron: number;
  zinc: number;
  calcium: number;
  omega3: number;
};

type ReportMealRecord = {
  id: string;
  date: string;
  mealName: string;
  completionPercent: number;
  totalMealCalories: number;
  totalConsumedCalories: number;
  ingredients: Array<{
    ingredientKey: string;
    name: string;
    amount: number;
    unit: string;
    calories: number;
  }>;
  nutritionOffered: NutritionTotals;
  nutritionConsumed: NutritionTotals;
};

type DatePreset = "today" | "week" | "month" | "custom" | "all";

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const dayIndex = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - dayIndex);
  return result;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatNumber(value: number, decimals = 1) {
  return Number(value.toFixed(decimals)).toString();
}

function sumNutrition(records: ReportMealRecord[], key: keyof NutritionTotals) {
  return records.reduce((sum, record) => sum + record.nutritionConsumed[key], 0);
}

export function ReportClient({ records, storageName }: { records: ReportMealRecord[]; storageName: string }) {
  const today = useMemo(() => toDateKey(new Date()), []);
  const [preset, setPreset] = useState<DatePreset>("today");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);

  const filteredRecords = useMemo(() => {
    if (!records.length) return [];
    if (preset === "all") return records;

    const todayDate = new Date();
    let startKey = "";
    let endKey = toDateKey(todayDate);

    if (preset === "today") {
      startKey = endKey;
    } else if (preset === "week") {
      startKey = toDateKey(startOfWeek(todayDate));
    } else if (preset === "month") {
      startKey = toDateKey(startOfMonth(todayDate));
    } else {
      if (!customStart || !customEnd) return [];
      startKey = customStart <= customEnd ? customStart : customEnd;
      endKey = customStart <= customEnd ? customEnd : customStart;
    }

    return records.filter((record) => record.date >= startKey && record.date <= endKey);
  }, [customEnd, customStart, preset, records]);

  const totalConsumed = filteredRecords.reduce((sum, record) => sum + record.totalConsumedCalories, 0);
  const totalMealCalories = filteredRecords.reduce((sum, record) => sum + record.totalMealCalories, 0);
  const averageCompletion = filteredRecords.length
    ? filteredRecords.reduce((sum, record) => sum + record.completionPercent, 0) / filteredRecords.length
    : 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#fff9fc_0%,#fff0e2_48%,#f3ecff_100%)] px-4 py-6 text-[#47243d]">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9c456c]">Dua database</p>
            <h1 className="brand-title mt-1 text-4xl font-black text-[#633d55]">Meal records</h1>
          </div>
          <Link className="pressable rounded-full border border-[#e7ccd9] bg-[#fffafd] px-5 py-3 text-sm font-black text-[#5e3752] shadow-sm" href="/">
            Back to planner
          </Link>
        </header>

        <section className="soft-card p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">Range</span>
              <select
                value={preset}
                onChange={(event) => setPreset(event.target.value as DatePreset)}
                className="min-h-11 rounded-[8px] border border-[#ead8e2] bg-white px-3 text-sm font-bold text-[#633d55]"
              >
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="custom">Custom range</option>
                <option value="all">All time</option>
              </select>
            </label>

            {preset === "custom" ? (
              <>
                <label className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">Start</span>
                  <input
                    type="date"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="min-h-11 rounded-[8px] border border-[#ead8e2] bg-white px-3 text-sm font-bold text-[#633d55]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">End</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="min-h-11 rounded-[8px] border border-[#ead8e2] bg-white px-3 text-sm font-bold text-[#633d55]"
                  />
                </label>
              </>
            ) : null}
          </div>
          <p className="mt-3 text-xs font-semibold text-[#765066]">This report reads from {storageName}. Filter applies to dashboard and table together.</p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Records" value={filteredRecords.length.toString()} />
          <Metric label="Consumed kcal" value={`${totalConsumed} kcal`} />
          <Metric label="Offered kcal" value={`${totalMealCalories} kcal`} />
          <Metric label="Avg completion" value={`${formatNumber(averageCompletion, 0)}%`} />
          <Metric label="Protein (consumed)" value={`${formatNumber(sumNutrition(filteredRecords, "protein"))} g`} />
          <Metric label="Carb (consumed)" value={`${formatNumber(sumNutrition(filteredRecords, "carbs"))} g`} />
          <Metric label="Fat (consumed)" value={`${formatNumber(sumNutrition(filteredRecords, "fat"))} g`} />
          <Metric label="Fibre (consumed)" value={`${formatNumber(sumNutrition(filteredRecords, "fiber"))} g`} />
        </section>

        <section className="soft-card overflow-hidden">
          <div className="border-b border-[#ead8e2] p-4">
            <p className="text-sm font-black text-[#633d55]">Saved meals for user Dua</p>
            <p className="mt-1 text-xs font-semibold text-[#765066]">
              Per-meal nutrition is shown as offered and estimated consumed based on completion percentage.
            </p>
          </div>

          {filteredRecords.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead className="bg-[#fff8fb] text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Meal</th>
                    <th className="px-4 py-3">Completion</th>
                    <th className="px-4 py-3">Meal kcal</th>
                    <th className="px-4 py-3">Consumed kcal</th>
                    <th className="px-4 py-3">Nutrition offered / consumed</th>
                    <th className="px-4 py-3">Adjusted ingredients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0dce7]">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="align-top">
                      <td className="px-4 py-3 font-bold text-[#633d55]">{record.date}</td>
                      <td className="px-4 py-3 font-bold text-[#633d55]">{record.mealName}</td>
                      <td className="px-4 py-3">{record.completionPercent}%</td>
                      <td className="px-4 py-3">{record.totalMealCalories}</td>
                      <td className="px-4 py-3 font-black text-[#8a5422]">{record.totalConsumedCalories}</td>
                      <td className="px-4 py-3">
                        <div className="rounded-[8px] border border-[#f0dce7] bg-white/70 p-2 text-xs leading-5">
                          <p className="font-black text-[#633d55]">
                            Protein {formatNumber(record.nutritionOffered.protein)}g / {formatNumber(record.nutritionConsumed.protein)}g
                          </p>
                          <p>
                            Carbs {formatNumber(record.nutritionOffered.carbs)}g / {formatNumber(record.nutritionConsumed.carbs)}g
                          </p>
                          <p>
                            Fat {formatNumber(record.nutritionOffered.fat)}g / {formatNumber(record.nutritionConsumed.fat)}g
                          </p>
                          <p>
                            Fibre {formatNumber(record.nutritionOffered.fiber)}g / {formatNumber(record.nutritionConsumed.fiber)}g
                          </p>
                          <p>
                            Iron {formatNumber(record.nutritionOffered.iron, 2)}mg / {formatNumber(record.nutritionConsumed.iron, 2)}mg
                          </p>
                          <p>
                            Zinc {formatNumber(record.nutritionOffered.zinc, 2)}mg / {formatNumber(record.nutritionConsumed.zinc, 2)}mg
                          </p>
                          <p>
                            Calcium {formatNumber(record.nutritionOffered.calcium, 1)}mg / {formatNumber(record.nutritionConsumed.calcium, 1)}mg
                          </p>
                          <p>
                            Omega-3 {formatNumber(record.nutritionOffered.omega3, 1)}mg / {formatNumber(record.nutritionConsumed.omega3, 1)}mg
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ul className="space-y-1">
                          {record.ingredients.map((ingredient) => (
                            <li key={`${record.id}-${ingredient.ingredientKey}`} className="text-[#765066]">
                              <span className="font-black text-[#633d55]">{ingredient.name}</span>: {ingredient.amount} {ingredient.unit},{" "}
                              {ingredient.calories} kcal
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-sm font-semibold leading-6 text-[#765066]">
              No records in this date range yet. Try another filter or save a meal from the planner.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-card p-4">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#633d55]">{value}</p>
    </div>
  );
}
