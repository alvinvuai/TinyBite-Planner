"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getMissingRequiredMeals, requiredDailyMealNames } from "@/lib/mealRecordRules";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

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
type RecordPreset = "all" | "today" | "yesterday" | "week" | "last_week" | "month";

type UpdateDateResponse = {
  record?: {
    date?: string;
  };
  message?: string;
};

type StandardProgress = {
  metric: string;
  unit: string;
  consumed: number;
  target: number;
  percent: number;
  chartPercent: number;
  consumedLabel: string;
  targetLabel: string;
};

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

function formatChartDate(iso: string) {
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [, month, day] = parts;
  return `${month}/${day}`;
}

function dateKeyToDate(key: string) {
  return new Date(`${key}T00:00:00`);
}

function daysInclusive(startKey: string, endKey: string) {
  const start = dateKeyToDate(startKey);
  const end = dateKeyToDate(endKey);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const ms = end.getTime() - start.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / 86400000) + 1;
}

function dateKeysBetween(startKey: string, endKey: string) {
  const safeStart = startKey <= endKey ? startKey : endKey;
  const safeEnd = startKey <= endKey ? endKey : startKey;
  const cursor = dateKeyToDate(safeStart);
  const end = dateKeyToDate(safeEnd);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(end.getTime())) return [];

  const keys: string[] = [];
  for (let guard = 0; cursor <= end && guard < 3660; guard += 1) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
}

const chartTooltipStyle = {
  borderRadius: 8,
  border: "1px solid #ead8e2",
  fontSize: 12,
  fontWeight: 700,
  color: "#633d55",
};

const recordsPerPage = 10;

function sumNutrition(records: ReportMealRecord[], key: keyof NutritionTotals) {
  return records.reduce((sum, record) => sum + record.nutritionConsumed[key], 0);
}

function sortRecordsByDate(records: ReportMealRecord[]) {
  return [...records].sort((a, b) => b.date.localeCompare(a.date));
}

function filterRecordsByPreset(records: ReportMealRecord[], preset: RecordPreset) {
  if (preset === "all") return sortRecordsByDate(records);

  const todayDate = new Date();
  const todayKey = toDateKey(todayDate);
  let startKey = todayKey;
  let endKey = todayKey;

  if (preset === "yesterday") {
    const yesterday = new Date(todayDate);
    yesterday.setDate(yesterday.getDate() - 1);
    startKey = toDateKey(yesterday);
    endKey = startKey;
  } else if (preset === "week") {
    startKey = toDateKey(startOfWeek(todayDate));
  } else if (preset === "last_week") {
    const thisWeekStart = startOfWeek(todayDate);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    startKey = toDateKey(lastWeekStart);
    endKey = toDateKey(lastWeekEnd);
  } else if (preset === "month") {
    startKey = toDateKey(startOfMonth(todayDate));
  }

  return sortRecordsByDate(records.filter((record) => record.date >= startKey && record.date <= endKey));
}

export function ReportClient({ records, storageName }: { records: ReportMealRecord[]; storageName: string }) {
  const today = useMemo(() => toDateKey(new Date()), []);
  const [reportRecords, setReportRecords] = useState(() => sortRecordsByDate(records));
  const [preset, setPreset] = useState<DatePreset>("week");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState(today);
  const [savingDateId, setSavingDateId] = useState<string | null>(null);
  const [editError, setEditError] = useState("");
  const [showRecords, setShowRecords] = useState(false);
  const [recordPreset, setRecordPreset] = useState<RecordPreset>("all");
  const [recordPage, setRecordPage] = useState(1);

  const filteredRecords = useMemo(() => {
    if (!reportRecords.length) return [];
    if (preset === "all") return sortRecordsByDate(reportRecords);

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

    return sortRecordsByDate(reportRecords.filter((record) => record.date >= startKey && record.date <= endKey));
  }, [customEnd, customStart, preset, reportRecords]);

  const coverageDateKeys = useMemo(() => {
    const todayDate = new Date();
    const todayKey = toDateKey(todayDate);

    if (preset === "today") return [todayKey];
    if (preset === "week") return dateKeysBetween(toDateKey(startOfWeek(todayDate)), todayKey);
    if (preset === "month") return dateKeysBetween(toDateKey(startOfMonth(todayDate)), todayKey);
    if (preset === "custom") {
      if (!customStart || !customEnd) return [];
      return dateKeysBetween(customStart, customEnd);
    }

    const dates = reportRecords.map((record) => record.date).sort((a, b) => a.localeCompare(b));
    return dates.length ? dateKeysBetween(dates[0], todayKey) : [todayKey];
  }, [customEnd, customStart, preset, reportRecords]);

  const requiredMealCoverage = useMemo(
    () =>
      coverageDateKeys
        .map((date) => {
          const missingMeals = getMissingRequiredMeals(reportRecords, date);
          return {
            date,
            loggedCount: requiredDailyMealNames.length - missingMeals.length,
            missingMeals,
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [coverageDateKeys, reportRecords],
  );
  const incompleteRequiredMealDays = requiredMealCoverage.filter((day) => day.missingMeals.length > 0);
  const completeRequiredMealDays = requiredMealCoverage.length - incompleteRequiredMealDays.length;

  const totalConsumed = filteredRecords.reduce((sum, record) => sum + record.totalConsumedCalories, 0);
  const totalMealCalories = filteredRecords.reduce((sum, record) => sum + record.totalMealCalories, 0);
  const averageCompletion = filteredRecords.length
    ? filteredRecords.reduce((sum, record) => sum + record.completionPercent, 0) / filteredRecords.length
    : 0;

  const dailySeries = useMemo(() => {
    const map = new Map<string, { consumed: number; offered: number }>();
    for (const record of filteredRecords) {
      const cur = map.get(record.date) ?? { consumed: 0, offered: 0 };
      cur.consumed += record.totalConsumedCalories;
      cur.offered += record.totalMealCalories;
      map.set(record.date, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, totals]) => ({
        date,
        dateLabel: formatChartDate(date),
        consumed: totals.consumed,
        offered: totals.offered,
      }));
  }, [filteredRecords]);

  const completionByDay = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    for (const record of filteredRecords) {
      const cur = map.get(record.date) ?? { sum: 0, count: 0 };
      cur.sum += record.completionPercent;
      cur.count += 1;
      map.set(record.date, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({
        date,
        dateLabel: formatChartDate(date),
        avgCompletion: v.count ? Math.round(v.sum / v.count) : 0,
      }));
  }, [filteredRecords]);

  const macroSlices = useMemo(() => {
    const protein = sumNutrition(filteredRecords, "protein");
    const carbs = sumNutrition(filteredRecords, "carbs");
    const fat = sumNutrition(filteredRecords, "fat");
    const total = protein + carbs + fat;
    if (total < 0.001) return [];
    return [
      { name: "Protein", value: protein, color: "#9c456c" },
      { name: "Carbs", value: carbs, color: "#c17a4a" },
      { name: "Fat", value: fat, color: "#5a8f6e" },
    ];
  }, [filteredRecords]);

  const periodDays = useMemo(() => {
    if (!reportRecords.length) return 0;
    const todayDate = new Date();
    const todayKey = toDateKey(todayDate);
    if (preset === "today") return 1;
    if (preset === "week") return daysInclusive(toDateKey(startOfWeek(todayDate)), todayKey);
    if (preset === "month") return daysInclusive(toDateKey(startOfMonth(todayDate)), todayKey);
    if (preset === "custom") {
      if (!customStart || !customEnd) return 0;
      const start = customStart <= customEnd ? customStart : customEnd;
      const end = customStart <= customEnd ? customEnd : customStart;
      return daysInclusive(start, end);
    }
    if (!filteredRecords.length) return 0;
    const dates = filteredRecords.map((record) => record.date).sort((a, b) => a.localeCompare(b));
    return daysInclusive(dates[0], dates[dates.length - 1]);
  }, [customEnd, customStart, filteredRecords, preset, reportRecords.length]);

  const standardsData = useMemo(() => {
    const daily = [
      { metric: "Calories", unit: "kcal", consumed: totalConsumed, target: 1000, decimals: 0 },
      { metric: "Protein", unit: "g", consumed: sumNutrition(filteredRecords, "protein"), target: 20, decimals: 1 },
      { metric: "Iron", unit: "mg", consumed: sumNutrition(filteredRecords, "iron"), target: 3, decimals: 2 },
      { metric: "Zinc", unit: "mg", consumed: sumNutrition(filteredRecords, "zinc"), target: 3, decimals: 2 },
      { metric: "Calcium", unit: "mg", consumed: sumNutrition(filteredRecords, "calcium"), target: 700, decimals: 1 },
    ];
    const targetMultiplier = Math.max(1, periodDays);
    return daily.map((item): StandardProgress => {
      const target = item.target * targetMultiplier;
      const percent = target > 0 ? (item.consumed / target) * 100 : 0;
      return {
        metric: item.metric,
        unit: item.unit,
        consumed: item.consumed,
        target,
        percent,
        chartPercent: Math.min(130, percent),
        consumedLabel: `${formatNumber(item.consumed, item.decimals)} ${item.unit}`,
        targetLabel: `${formatNumber(target, item.decimals)} ${item.unit}`,
      };
    });
  }, [filteredRecords, periodDays, totalConsumed]);

  const recordListRecords = useMemo(() => filterRecordsByPreset(reportRecords, recordPreset), [recordPreset, reportRecords]);
  const recordPageCount = Math.max(1, Math.ceil(recordListRecords.length / recordsPerPage));
  const safeRecordPage = Math.min(recordPage, recordPageCount);
  const paginatedRecords = useMemo(() => {
    const start = (safeRecordPage - 1) * recordsPerPage;
    return recordListRecords.slice(start, start + recordsPerPage);
  }, [recordListRecords, safeRecordPage]);

  function startEditingDate(record: ReportMealRecord) {
    setEditingRecordId(record.id);
    setEditDate(record.date);
    setEditError("");
  }

  function cancelEditingDate() {
    setEditingRecordId(null);
    setEditError("");
  }

  async function saveRecordDate(record: ReportMealRecord) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editDate)) {
      setEditError("Choose a valid date.");
      return;
    }

    setSavingDateId(record.id);
    setEditError("");

    try {
      const response = await fetch("/api/meal-records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, date: editDate }),
      });
      const text = await response.text();
      let data: UpdateDateResponse = {};
      if (text) {
        try {
          data = JSON.parse(text) as UpdateDateResponse;
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        setEditError(data.message || "Date could not be updated.");
        return;
      }

      const nextDate = data.record?.date || editDate;
      setReportRecords((current) => sortRecordsByDate(current.map((item) => (item.id === record.id ? { ...item, date: nextDate } : item))));
      setEditingRecordId(null);
    } catch {
      setEditError("Date could not be updated. Please try again.");
    } finally {
      setSavingDateId(null);
    }
  }

  function renderDateEditor(record: ReportMealRecord, layout: "table" | "card") {
    if (editingRecordId !== record.id) {
      return (
        <button
          type="button"
          onClick={() => startEditingDate(record)}
          className={
            layout === "card"
              ? "pressable min-h-11 w-full rounded-full bg-[#633d55] px-4 py-2 text-sm font-black text-white shadow-sm"
              : "pressable whitespace-nowrap rounded-full bg-[#633d55] px-4 py-2 text-xs font-black text-white shadow-sm"
          }
        >
          Change date
        </button>
      );
    }

    return (
      <div className={layout === "card" ? "space-y-3 rounded-[8px] border border-[#ead8e2] bg-[#fffafd] p-3" : "min-w-[12rem] space-y-2"}>
        <label className="block text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]" htmlFor={`record-date-${record.id}-${layout}`}>
          Record date
        </label>
        <input
          id={`record-date-${record.id}-${layout}`}
          aria-label={`Date for ${record.mealName}`}
          type="date"
          value={editDate}
          onChange={(event) => setEditDate(event.target.value)}
          className="min-h-10 w-full rounded-[8px] border border-[#ead8e2] bg-white px-2 text-sm font-bold text-[#633d55]"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveRecordDate(record)}
            disabled={savingDateId === record.id}
            className="pressable min-h-10 flex-1 whitespace-nowrap rounded-full bg-[#633d55] px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingDateId === record.id ? "Saving" : "Save"}
          </button>
          <button
            type="button"
            onClick={cancelEditingDate}
            disabled={savingDateId === record.id}
            className="pressable min-h-10 flex-1 rounded-full border border-[#e7ccd9] bg-white px-3 py-2 text-xs font-black text-[#633d55] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
        {editError ? <p className="text-xs font-bold text-[#9c2f45]">{editError}</p> : null}
      </div>
    );
  }

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
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <label
                htmlFor="report-range-preset"
                className="shrink-0 text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]"
              >
                Range
              </label>
              <select
                id="report-range-preset"
                value={preset}
                onChange={(event) => setPreset(event.target.value as DatePreset)}
                className="min-h-11 min-w-[11rem] rounded-[8px] border border-[#ead8e2] bg-white px-3 text-sm font-bold text-[#633d55]"
              >
                <option value="today">Today</option>
                <option value="week">This week</option>
                <option value="month">This month</option>
                <option value="custom">Custom range</option>
                <option value="all">All time</option>
              </select>
            </div>

            {preset === "custom" ? (
              <>
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <label
                    htmlFor="report-range-start"
                    className="shrink-0 text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]"
                  >
                    Start
                  </label>
                  <input
                    id="report-range-start"
                    type="date"
                    value={customStart}
                    onChange={(event) => setCustomStart(event.target.value)}
                    className="min-h-11 rounded-[8px] border border-[#ead8e2] bg-white px-3 text-sm font-bold text-[#633d55]"
                  />
                </div>
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <label
                    htmlFor="report-range-end"
                    className="shrink-0 text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]"
                  >
                    End
                  </label>
                  <input
                    id="report-range-end"
                    type="date"
                    value={customEnd}
                    onChange={(event) => setCustomEnd(event.target.value)}
                    className="min-h-11 rounded-[8px] border border-[#ead8e2] bg-white px-3 text-sm font-bold text-[#633d55]"
                  />
                </div>
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

        <section className="soft-card p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#633d55]">Required meal check</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#765066]">
                Daily record target: {requiredDailyMealNames.join(", ")}.
              </p>
            </div>
            <p className="rounded-full bg-[#fff0d7] px-3 py-1 text-xs font-black text-[#7a4a20]">
              {completeRequiredMealDays}/{requiredMealCoverage.length || 1} complete day(s)
            </p>
          </div>

          {incompleteRequiredMealDays.length ? (
            <div className="mt-4 divide-y divide-[#f0dce7] overflow-hidden rounded-[8px] border border-[#ead8e2] bg-white/60">
              {incompleteRequiredMealDays.slice(0, 8).map((day) => (
                <div key={day.date} className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
                  <div>
                    <p className="text-sm font-black text-[#633d55]">{day.date}</p>
                    <p className="mt-1 text-xs font-bold text-[#765066]">{day.loggedCount}/4 required meal(s) logged</p>
                  </div>
                  <p className="text-sm font-black text-[#9c2f45]">Missing: {day.missingMeals.join(", ")}</p>
                </div>
              ))}
              {incompleteRequiredMealDays.length > 8 ? (
                <p className="px-3 py-3 text-xs font-bold text-[#765066]">
                  {incompleteRequiredMealDays.length - 8} more day(s) are missing required meals in this range.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 rounded-[8px] border border-[#b9e5c2] bg-[#f2fff1] p-3 text-sm font-bold text-[#356f3f]">
              All days in this range have Breakfast, Lunch, Afternoon tea, and Dinner logged.
            </p>
          )}
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div className="soft-card p-4">
            <p className="text-sm font-black text-[#633d55]">Calories by day</p>
            <p className="mt-1 text-xs font-semibold text-[#765066]">Consumed vs offered kcal, summed per calendar day.</p>
            {dailySeries.length ? (
              <div className="mt-4 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySeries} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0dce7" />
                    <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: "#765066", fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 11, fill: "#765066", fontWeight: 600 }} width={44} />
                    <Tooltip contentStyle={chartTooltipStyle} labelStyle={{ color: "#633d55", fontWeight: 800 }} />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: "#633d55" }} />
                    <Bar name="Consumed kcal" dataKey="consumed" fill="#9c456c" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar name="Offered kcal" dataKey="offered" fill="#e8b86d" radius={[6, 6, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-[#765066]">No day-level data in this range.</p>
            )}
          </div>

          <div className="soft-card p-4">
            <p className="text-sm font-black text-[#633d55]">Macros consumed</p>
            <p className="mt-1 text-xs font-semibold text-[#765066]">Share of protein, carbs, and fat (grams) for the filter.</p>
            {macroSlices.length ? (
              <div className="mt-4 h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroSlices}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={96}
                      paddingAngle={2}
                    >
                      {macroSlices.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} stroke="#fffafd" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => {
                        const n = typeof value === "number" ? value : Number(value);
                        const grams = Number.isFinite(n) ? n : 0;
                        return [`${formatNumber(grams)} g`, ""];
                      }}
                      contentStyle={chartTooltipStyle}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700, color: "#633d55" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="mt-4 text-sm font-semibold text-[#765066]">No macro data in this range.</p>
            )}
          </div>
        </section>

        <section className="soft-card p-4">
          <p className="text-sm font-black text-[#633d55]">Consumed vs standard target</p>
          <p className="mt-1 text-xs font-semibold text-[#765066]">
            Target baseline: 1000 kcal/day, protein 20 g/day, iron 3 mg/day, zinc 3 mg/day, calcium 700 mg/day.
          </p>
          <p className="mt-1 text-xs font-semibold text-[#765066]">
            Range multiplier: {Math.max(1, periodDays)} day(s). Bars show percent of target so small-unit nutrients stay readable.
          </p>
          <div className="mt-4 h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={standardsData} layout="vertical" margin={{ top: 8, right: 18, left: 8, bottom: 6 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0dce7" />
                <XAxis
                  type="number"
                  domain={[0, 130]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 11, fill: "#765066", fontWeight: 600 }}
                />
                <YAxis dataKey="metric" type="category" tick={{ fontSize: 12, fill: "#633d55", fontWeight: 800 }} width={86} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  labelStyle={{ color: "#633d55", fontWeight: 800 }}
                  formatter={(_value, _name, props) => {
                    const item = props.payload as StandardProgress;
                    return [`${item.consumedLabel} of ${item.targetLabel} (${formatNumber(item.percent, 0)}%)`, "Consumed"];
                  }}
                />
                <ReferenceLine x={100} stroke="#8a5422" strokeDasharray="4 4" label={{ value: "Target", fill: "#8a5422", fontSize: 11, fontWeight: 800 }} />
                <Bar name="Consumed percent of target" dataKey="chartPercent" fill="#9c456c" radius={[0, 8, 8, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {standardsData.map((item) => (
              <div key={item.metric} className="rounded-[8px] border border-[#ead8e2] bg-white/70 p-3">
                <p className="text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">{item.metric}</p>
                <p className="mt-1 text-lg font-black text-[#633d55]">{formatNumber(item.percent, 0)}%</p>
                <p className="mt-1 text-xs font-bold text-[#765066]">
                  {item.consumedLabel} / {item.targetLabel}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="soft-card p-4">
          <p className="text-sm font-black text-[#633d55]">Average meal completion by day</p>
          <p className="mt-1 text-xs font-semibold text-[#765066]">Mean completion % across meals logged on each day.</p>
          {completionByDay.length ? (
            <div className="mt-4 h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completionByDay} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0dce7" />
                  <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: "#765066", fontWeight: 600 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#765066", fontWeight: 600 }} width={36} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value) => {
                      const n = typeof value === "number" ? value : Number(value);
                      const pct = Number.isFinite(n) ? n : 0;
                      return [`${formatNumber(pct, 0)}%`, "Avg completion"];
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgCompletion"
                    name="Avg completion %"
                    stroke="#8a5422"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#8a5422", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-4 text-sm font-semibold text-[#765066]">No completion trend in this range.</p>
          )}
        </section>

        <section className="soft-card overflow-hidden">
          <div className={`${showRecords ? "border-b border-[#ead8e2]" : ""} p-4`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#633d55]">Saved meals for user Dua</p>
                <p className="mt-1 text-xs font-semibold text-[#765066]">
                  Records are hidden by default. Open them when you need to review or change a saved date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRecords((current) => !current);
                  setRecordPage(1);
                  setEditingRecordId(null);
                  setEditError("");
                }}
                className="pressable min-h-11 rounded-full bg-[#633d55] px-5 py-2 text-sm font-black text-white shadow-sm"
                aria-expanded={showRecords}
              >
                {showRecords ? "Hide records" : "All records"}
              </button>
            </div>
          </div>

          {showRecords ? (
            <>
              <div className="border-b border-[#ead8e2] bg-[#fff8fb] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-3">
                    <label htmlFor="record-list-filter" className="shrink-0 text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">
                      Record filter
                    </label>
                    <select
                      id="record-list-filter"
                      value={recordPreset}
                      onChange={(event) => {
                        setRecordPreset(event.target.value as RecordPreset);
                        setRecordPage(1);
                        setEditingRecordId(null);
                        setEditError("");
                      }}
                      className="min-h-11 min-w-[11rem] rounded-[8px] border border-[#ead8e2] bg-white px-3 text-sm font-bold text-[#633d55]"
                    >
                      <option value="all">All records</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="week">This week</option>
                      <option value="last_week">Last week</option>
                      <option value="month">This month</option>
                    </select>
                  </div>
                  <p className="text-xs font-bold text-[#765066]">
                    {recordListRecords.length} record(s), page {safeRecordPage} of {recordPageCount}
                  </p>
                </div>
              </div>

              {paginatedRecords.length ? (
                <>
              <div className="divide-y divide-[#f0dce7] lg:hidden">
                {paginatedRecords.map((record) => (
                  <article key={record.id} className="space-y-4 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">{record.date}</p>
                        <h2 className="mt-1 text-lg font-black text-[#633d55]">{record.mealName}</h2>
                      </div>
                      <div className="min-w-[9rem] flex-1 sm:max-w-[14rem]">{renderDateEditor(record, "card")}</div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <CompactMetric label="Done" value={`${record.completionPercent}%`} />
                      <CompactMetric label="Meal" value={`${record.totalMealCalories}`} />
                      <CompactMetric label="Ate" value={`${record.totalConsumedCalories}`} emphasis />
                    </div>

                    <details className="rounded-[8px] border border-[#ead8e2] bg-white/70">
                      <summary className="cursor-pointer px-3 py-3 text-sm font-black text-[#633d55]">Nutrition offered / consumed</summary>
                      <div className="border-t border-[#f0dce7] p-3">
                        <NutritionSummary record={record} />
                      </div>
                    </details>

                    <details className="rounded-[8px] border border-[#ead8e2] bg-white/70">
                      <summary className="cursor-pointer px-3 py-3 text-sm font-black text-[#633d55]">Adjusted ingredients</summary>
                      <div className="border-t border-[#f0dce7] p-3">
                        <IngredientList record={record} />
                      </div>
                    </details>
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="bg-[#fff8fb] text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Meal</th>
                    <th className="px-4 py-3">Completion</th>
                    <th className="px-4 py-3">Meal kcal</th>
                    <th className="px-4 py-3">Consumed kcal</th>
                    <th className="px-4 py-3">Nutrition offered / consumed</th>
                    <th className="px-4 py-3">Adjusted ingredients</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0dce7]">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="align-top">
                      <td className="px-4 py-3 font-bold text-[#633d55]">{record.date}</td>
                      <td className="px-4 py-3 font-bold text-[#633d55]">{record.mealName}</td>
                      <td className="px-4 py-3">{record.completionPercent}%</td>
                      <td className="px-4 py-3">{record.totalMealCalories}</td>
                      <td className="px-4 py-3 font-black text-[#8a5422]">{record.totalConsumedCalories}</td>
                      <td className="px-4 py-3">
                        <div className="rounded-[8px] border border-[#f0dce7] bg-white/70 p-2 text-xs leading-5">
                          <NutritionSummary record={record} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <IngredientList record={record} />
                      </td>
                      <td className="px-4 py-3">
                        {renderDateEditor(record, "table")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <RecordPagination page={safeRecordPage} pageCount={recordPageCount} onPageChange={setRecordPage} />
                </>
              ) : (
                <div className="p-4 text-sm font-semibold leading-6 text-[#765066]">
                  No records for this filter. Try All records or another date range.
                </div>
              )}
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function RecordPagination({ page, pageCount, onPageChange }: { page: number; pageCount: number; onPageChange: (page: number) => void }) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ead8e2] bg-[#fff8fb] p-4">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="pressable min-h-10 rounded-full border border-[#e7ccd9] bg-white px-4 py-2 text-xs font-black text-[#633d55] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          className="pressable min-h-10 rounded-full bg-[#633d55] px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function CompactMetric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-[8px] border border-[#ead8e2] bg-white/70 px-2 py-3">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#9c456c]">{label}</p>
      <p className={`mt-1 text-base font-black ${emphasis ? "text-[#8a5422]" : "text-[#633d55]"}`}>{value}</p>
    </div>
  );
}

function NutritionSummary({ record }: { record: ReportMealRecord }) {
  return (
    <div className="text-xs leading-5 text-[#5f4057]">
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
  );
}

function IngredientList({ record }: { record: ReportMealRecord }) {
  return (
    <ul className="space-y-1">
      {record.ingredients.map((ingredient) => (
        <li key={`${record.id}-${ingredient.ingredientKey}`} className="text-sm text-[#765066]">
          <span className="font-black text-[#633d55]">{ingredient.name}</span>: {ingredient.amount} {ingredient.unit}, {ingredient.calories} kcal
        </li>
      ))}
    </ul>
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
