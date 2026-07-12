"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { BabyMascot } from "@/components/BabyMascot";
import { CuteButton } from "@/components/CuteButton";
import { IngredientChips } from "@/components/IngredientChips";
import { MealQuantityGrid } from "@/components/MealQuantityGrid";
import { MealReviewPanel } from "@/components/MealReviewPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SuggestedMeals } from "@/components/SuggestedMeals";
import { MealAssistant, type ParsedMealResult } from "@/components/MealAssistant";
import {
  createCustomMealBuilderItem,
  createMealBuilderItem,
  getAllowedIngredientDefinitions,
  isIngredientAllowedForMeal,
  mealTargets,
  mealTypes,
  normalizeIngredient,
  rebalanceSuggestedItems,
  suggestMeals,
  summarizeMeal,
  updateMealBuilderItem,
} from "@/lib/nutrition";
import type { ChildProfile, PlanningMode } from "@/types/meal";
import type { MealBuilderItem, MealReview } from "@/types/nutrition";

const defaultProfile: ChildProfile = {
  ageMonths: 19.5,
  weightKg: 8.8,
  fingerFoodPreferred: true,
  avoidFoods: ["noodles", "congee"],
  goals: ["weight gain", "protein exposure", "reduce fruit/milk rescue"],
  acceptedSafeFoods: ["Rice", "Yoghurt", "Banana"],
  fruitOptions: ["Mandarin", "Grape", "Kiwi", "Plum", "Dried plum / prune", "Pear", "Banana"],
};

const mealDraftStorageKey = "tinybite-meal-drafts";
const defaultDraftId = "meal-draft-1";
const hiddenMealTypes = new Set(["Whole day plan"]);
const visibleMealTypes = mealTypes.filter((type) => !hiddenMealTypes.has(type));

type MealDraftSession = {
  id: string;
  title: string;
  mode: PlanningMode;
  mealType: string;
  selectedIngredients: string[];
  freeText: string;
  mealItems: MealBuilderItem[];
  selectedMealId: string | null;
  updatedAt: string;
};

type MealRecordPayload = {
  date: string;
  mealName: string;
  completionPercent: number;
  totalMealCalories: number;
  ingredients: Array<{
    ingredientKey: string;
    name: string;
    amount: number;
    unit: string;
    grams: number;
    calories: number;
    suggestedAmount: number;
    suggestedUnit: string;
    suggestedCalories: number;
  }>;
};

type SavedMealRecordResponse = {
  record?: {
    id: string;
    totalConsumedCalories: number;
  };
  merged?: boolean;
  existingRecord?: {
    id: string;
    date: string;
    mealName: string;
    completionPercent: number;
    totalConsumedCalories: number;
  };
  message?: string;
};

function normalizeVisibleMealType(mealType: string) {
  return visibleMealTypes.includes(mealType) ? mealType : "Breakfast";
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createEmptyDraft(mealType = "Breakfast", index = 1): MealDraftSession {
  const normalizedMealType = normalizeVisibleMealType(mealType);
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? `meal-draft-${crypto.randomUUID()}` : `meal-draft-${Date.now()}`,
    title: `Draft ${index}`,
    mode: "single",
    mealType: normalizedMealType,
    selectedIngredients: [],
    freeText: "",
    mealItems: [],
    selectedMealId: null,
    updatedAt: new Date().toISOString(),
  };
}

function createInitialDraft(): MealDraftSession {
  return {
    ...createEmptyDraft("Breakfast", 1),
    id: defaultDraftId,
  };
}

function nextDraftMealType(currentMealType: string) {
  if (currentMealType === "Breakfast") return "Lunch";
  if (currentMealType === "Lunch") return "Dinner";
  const currentIndex = visibleMealTypes.indexOf(currentMealType);
  return visibleMealTypes[currentIndex + 1] ?? "Breakfast";
}

function isMealDraftSession(value: unknown): value is MealDraftSession {
  if (!value || typeof value !== "object") return false;
  const draft = value as Partial<MealDraftSession>;
  return (
    typeof draft.id === "string" &&
    typeof draft.title === "string" &&
    (draft.mode === "single" || draft.mode === "whole_day") &&
    typeof draft.mealType === "string" &&
    Array.isArray(draft.selectedIngredients) &&
    typeof draft.freeText === "string" &&
    Array.isArray(draft.mealItems)
  );
}

function normalizeMealDraftSession(session: MealDraftSession): MealDraftSession {
  const mealType = normalizeVisibleMealType(session.mealType);
  const allowedKeys = new Set(getAllowedIngredientDefinitions(mealType).map((ingredient) => ingredient.key));
  return {
    ...session,
    mode: "single",
    mealType,
    selectedIngredients: session.selectedIngredients.filter((selected) => isIngredientAllowedForMeal(selected, mealType)),
    mealItems: rebalanceSuggestedItems(
      session.mealItems.filter((item) => allowedKeys.has(item.ingredientKey) || item.ingredientKey.startsWith("custom_")),
      mealType,
    ),
    selectedMealId: mealType === session.mealType ? session.selectedMealId : null,
  };
}

export function MealPlannerForm() {
  const [mealType, setMealType] = useState("Breakfast");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [profile, setProfile] = useState<ChildProfile>(defaultProfile);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [customFoodOpen, setCustomFoodOpen] = useState(false);
  const [foodListOpen, setFoodListOpen] = useState(false);
  const [customFoodName, setCustomFoodName] = useState("");
  const [customFoodCalories, setCustomFoodCalories] = useState("60");
  const [tipsOpen, setTipsOpen] = useState(false);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(80);
  const [recordDate, setRecordDate] = useState(localDateString());
  const [saveError, setSaveError] = useState("");
  const [duplicateRecord, setDuplicateRecord] = useState<SavedMealRecordResponse["existingRecord"] | null>(null);
  const [mealItems, setMealItems] = useState<MealBuilderItem[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [review, setReview] = useState<MealReview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [saveToastOpen, setSaveToastOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mealSessions, setMealSessions] = useState<MealDraftSession[]>(() => [createInitialDraft()]);
  const [activeSessionId, setActiveSessionId] = useState(defaultDraftId);
  const [sessionsReady, setSessionsReady] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const savedProfile = localStorage.getItem("tinybite-profile");
      if (savedProfile) setProfile({ ...defaultProfile, ...(JSON.parse(savedProfile) as Partial<ChildProfile>) });

      try {
        const savedDrafts = localStorage.getItem(mealDraftStorageKey);
        if (savedDrafts) {
          const parsed = JSON.parse(savedDrafts) as { activeSessionId?: string; sessions?: unknown[] };
          const sessions = Array.isArray(parsed.sessions) ? parsed.sessions.filter(isMealDraftSession).map(normalizeMealDraftSession) : [];
          if (sessions.length) {
            const active = sessions.find((session) => session.id === parsed.activeSessionId) ?? sessions[0];
            setMealSessions(sessions);
            setActiveSessionId(active.id);
            restoreSession(active);
          }
        }
      } catch {
        localStorage.removeItem(mealDraftStorageKey);
      } finally {
        setSessionsReady(true);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("tinybite-profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    if (!saveToastOpen) return;
    const timer = window.setTimeout(() => setSaveToastOpen(false), 2600);
    return () => window.clearTimeout(timer);
  }, [saveToastOpen]);

  useEffect(() => {
    function updateBackToTopVisibility() {
      setShowBackToTop(window.scrollY > 520);
    }

    updateBackToTopVisibility();
    window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateBackToTopVisibility);
  }, []);

  useEffect(() => {
    if (!sessionsReady) return;
    const activeIndex = mealSessions.findIndex((session) => session.id === activeSessionId);
    const activeSession = mealSessions[activeIndex];
    const activeSnapshot: MealDraftSession = {
      id: activeSessionId,
      title: activeSession?.title || `Draft ${activeIndex + 1 || 1}`,
      mode: "single",
      mealType,
      selectedIngredients,
      freeText,
      mealItems,
      selectedMealId,
      updatedAt: new Date().toISOString(),
    };
    const sessions = activeSession
      ? mealSessions.map((session) => (session.id === activeSessionId ? activeSnapshot : session))
      : [...mealSessions, activeSnapshot];
    localStorage.setItem(mealDraftStorageKey, JSON.stringify({ activeSessionId, sessions }));
  }, [activeSessionId, freeText, mealItems, mealSessions, mealType, selectedIngredients, selectedMealId, sessionsReady]);

  const suggestedMeals = suggestMeals(mealItems, mealType);
  const summary = useMemo(() => summarizeMeal(mealItems, mealType), [mealItems, mealType]);
  const canReview = mealItems.length > 0;

  function changeMealType(nextMealType: string) {
    setMealType(nextMealType);
    const allowedKeys = new Set(getAllowedIngredientDefinitions(nextMealType).map((ingredient) => ingredient.key));
    setSelectedIngredients((current) => current.filter((selected) => isIngredientAllowedForMeal(selected, nextMealType)));
    setMealItems((current) => rebalanceSuggestedItems(current.filter((item) => allowedKeys.has(item.ingredientKey) || item.ingredientKey.startsWith("custom_")), nextMealType));
    setReview(null);
    setSelectedMealId(null);
  }

  function restoreSession(session: MealDraftSession) {
    const normalizedSession = normalizeMealDraftSession(session);
    setMealType(normalizedSession.mealType);
    setSelectedIngredients(normalizedSession.selectedIngredients);
    setFreeText(normalizedSession.freeText);
    setMealItems(normalizedSession.mealItems);
    setSelectedMealId(normalizedSession.selectedMealId);
    setReview(null);
    setError("");
    setSavedMessage("");
  }

  function getCurrentSessionSnapshot(existing?: MealDraftSession): MealDraftSession {
    return {
      id: activeSessionId,
      title: existing?.title || `Draft ${mealSessions.findIndex((session) => session.id === activeSessionId) + 1 || 1}`,
      mode: "single",
      mealType,
      selectedIngredients,
      freeText,
      mealItems,
      selectedMealId,
      updatedAt: new Date().toISOString(),
    };
  }

  function switchSession(sessionId: string) {
    if (sessionId === activeSessionId) return;
    const target = mealSessions.find((session) => session.id === sessionId);
    if (!target) return;
    setMealSessions((current) =>
      current.map((session) => (session.id === activeSessionId ? getCurrentSessionSnapshot(session) : session)),
    );
    setActiveSessionId(target.id);
    restoreSession(target);
  }

  function addMealSession() {
    const nextSession = createEmptyDraft(nextDraftMealType(mealType), mealSessions.length + 1);
    setMealSessions((current) => [
      ...current.map((session) => (session.id === activeSessionId ? getCurrentSessionSnapshot(session) : session)),
      nextSession,
    ]);
    setActiveSessionId(nextSession.id);
    restoreSession(nextSession);
  }

  function closeMealSession(sessionId: string) {
    const closingActiveSession = sessionId === activeSessionId;
    if (mealSessions.length === 1) {
      const resetSession = createInitialDraft();
      setMealSessions([resetSession]);
      setActiveSessionId(resetSession.id);
      restoreSession(resetSession);
      return;
    }
    const remainingSessions = mealSessions
      .map((session) => (session.id === activeSessionId ? getCurrentSessionSnapshot(session) : session))
      .filter((session) => session.id !== sessionId);
    const nextActive = closingActiveSession ? remainingSessions[0] : remainingSessions.find((session) => session.id === activeSessionId);
    setMealSessions(remainingSessions);
    if (nextActive) {
      setActiveSessionId(nextActive.id);
      if (closingActiveSession) restoreSession(nextActive);
    }
  }

  function updateSelectedIngredients(nextSelected: string[], targetMealType = mealType) {
    const allowedSelected = nextSelected.filter((selected) => isIngredientAllowedForMeal(selected, targetMealType));
    setSelectedIngredients(allowedSelected);
    setReview(null);
    setSelectedMealId(null);
    setMealItems((current) => {
      const kept = current.filter(
        (item) =>
          item.ingredientKey.startsWith("custom_") ||
          allowedSelected.some((selected) => createMealBuilderItem(selected)?.ingredientKey === item.ingredientKey),
      );
      const existingKeys = new Set(kept.map((item) => item.ingredientKey));
      const added = allowedSelected
        .map((selected) => createMealBuilderItem(selected))
        .filter((item): item is MealBuilderItem => item !== null && !existingKeys.has(item.ingredientKey));
      return rebalanceSuggestedItems([...kept, ...added], targetMealType);
    });
  }

  function applyFreeText(text = freeText) {
    const trimmedText = text.trim();
    if (!trimmedText) return false;

    const normalized = normalizeIngredient(trimmedText);
    const inferredMeal = visibleMealTypes.find((type) => normalized.includes(normalizeIngredient(type)));
    const targetMealType = inferredMeal ?? mealType;
    const textIngredients = getAllowedIngredientDefinitions(targetMealType)
      .filter((definition) => definition.aliases.some((alias) => normalized.includes(normalizeIngredient(alias))))
      .map((definition) => definition.name);
    if (inferredMeal) changeMealType(inferredMeal);
    if (textIngredients.length) updateSelectedIngredients(Array.from(new Set([...selectedIngredients, ...textIngredients])), targetMealType);
    return Boolean(inferredMeal || textIngredients.length);
  }

  function applyParsedMeal(parsed: ParsedMealResult) {
    const nextMealType = parsed.mealType && visibleMealTypes.includes(parsed.mealType) ? parsed.mealType : mealType;
    const nextItems: MealBuilderItem[] = [];
    const chipNames: string[] = [];
    for (const entry of parsed.items ?? []) {
      if (entry.ingredientKey) {
        const base = createMealBuilderItem(entry.ingredientKey);
        if (base) {
          const amount = typeof entry.amount === "number" && entry.amount > 0 ? entry.amount : base.amount;
          nextItems.push(updateMealBuilderItem(base, amount, entry.unit || base.unit));
          chipNames.push(base.name);
          continue;
        }
      }
      if (entry.customName && typeof entry.customCalories === "number") {
        const custom = createCustomMealBuilderItem(entry.customName, entry.customCalories);
        if (custom) nextItems.push(custom);
      }
    }

    setMealType(nextMealType);
    setReview(null);
    setSelectedMealId(null);
    if (nextItems.length) {
      setSelectedIngredients(chipNames.filter((name) => isIngredientAllowedForMeal(name, nextMealType)));
      setMealItems(rebalanceSuggestedItems(nextItems, nextMealType));
    }
    if (typeof parsed.completionPercent === "number") setCompletionPercent(parsed.completionPercent);
    if (parsed.date) setRecordDate(parsed.date);
    else if (typeof parsed.completionPercent === "number") setRecordDate(localDateString());
    if (nextItems.length && (typeof parsed.completionPercent === "number" || parsed.date)) {
      setSaveError("");
      setDuplicateRecord(null);
      setSaveOpen(true);
    }
  }

  function addCustomFoodFromHome() {
    const next = createCustomMealBuilderItem(customFoodName, Number(customFoodCalories));
    if (!next) return;
    setMealItems((current) => [...current, next]);
    setReview(null);
    setSelectedMealId(null);
    setCustomFoodOpen(false);
    setCustomFoodName("");
    setCustomFoodCalories("60");
  }

  async function reviewMeal() {
    setLoading(true);
    setError("");
    setReview(null);
    try {
      const selectedMeal = suggestedMeals.find((meal) => meal.id === selectedMealId);
      const result = await fetch("/api/review-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealType,
          suggestedMealTitle: selectedMeal?.title,
          nutritionSummary: summary,
          items: mealItems,
          childProfile: profile,
        }),
      });
      const responseText = await result.text();
      let data = {} as MealReview & { message?: string };
      try {
        data = responseText ? (JSON.parse(responseText) as MealReview & { message?: string }) : data;
      } catch {
        throw new Error("Meal review failed. Please try again.");
      }
      if (!result.ok) {
        throw new Error(data.message || "Meal review failed.");
      }
      setReview(data);
      if (data.usage) {
        localStorage.setItem("tinybite-usage", JSON.stringify(data.usage));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function buildMealRecordPayload(): MealRecordPayload {
    return {
      date: recordDate,
      mealName: mealType,
      completionPercent,
      totalMealCalories: summary.totalCalories,
      ingredients: mealItems.map((item) => ({
        ingredientKey: item.ingredientKey,
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        grams: item.grams,
        calories: item.calories,
        suggestedAmount: item.suggestedAmount,
        suggestedUnit: item.suggestedUnit,
        suggestedCalories: item.suggestedCalories,
      })),
    };
  }

  function openSaveMealRecord() {
    setRecordDate(localDateString());
    setSaveError("");
    setDuplicateRecord(null);
    setSaveOpen(true);
  }

  async function saveMealRecord() {
    setSaveError("");
    setDuplicateRecord(null);
    setSavedMessage("");
    setSaving(true);
    try {
      const payload = buildMealRecordPayload();
      const result = await fetch("/api/meal-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseText = await result.text();
      let data: SavedMealRecordResponse = {};
      try {
        data = responseText ? (JSON.parse(responseText) as SavedMealRecordResponse) : data;
      } catch {
        throw new Error("Could not save meal record. Please try again.");
      }
      if (!result.ok || !data.record) {
        if (result.status === 409 && data.existingRecord) setDuplicateRecord(data.existingRecord);
        throw new Error(data.message || "Could not save meal record.");
      }
      setSaveOpen(false);
      setSaveToastOpen(true);
      setSavedMessage(
        data.merged
          ? `Merged this ${mealType.toLowerCase()} into the ${recordDate} record: about ${data.record.totalConsumedCalories} kcal consumed. View it in Report.`
          : `Saved ${mealType}: about ${data.record.totalConsumedCalories} kcal consumed. View it in Report.`,
      );
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Could not save meal record.");
    } finally {
      setSaving(false);
    }
  }

  async function updateExistingMealRecord() {
    if (!duplicateRecord) return;
    setSaveError("");
    setSaving(true);
    try {
      const payload = buildMealRecordPayload();
      const result = await fetch("/api/meal-records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: duplicateRecord.id, ...payload }),
      });
      const responseText = await result.text();
      let data: SavedMealRecordResponse = {};
      try {
        data = responseText ? (JSON.parse(responseText) as SavedMealRecordResponse) : data;
      } catch {
        throw new Error("Could not update the previous meal record. Please try again.");
      }
      if (!result.ok || !data.record) {
        if (result.status === 409 && data.existingRecord) setDuplicateRecord(data.existingRecord);
        throw new Error(data.message || "Could not update the previous meal record.");
      }
      setDuplicateRecord(null);
      setSaveOpen(false);
      setSaveToastOpen(true);
      setSavedMessage(`Updated ${mealType}: about ${data.record.totalConsumedCalories} kcal consumed. View it in Report.`);
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : "Could not update the previous meal record.");
    } finally {
      setSaving(false);
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      {showBackToTop ? (
        <button
          type="button"
          aria-label="Scroll to top"
          title="Scroll to top"
          onClick={scrollToTop}
          className="pressable fixed bottom-5 right-4 z-40 grid h-12 w-12 place-items-center rounded-full border border-[#e7ccd9] bg-[#fffafd] text-2xl font-black leading-none text-[#5e3752] shadow-[0_12px_26px_rgba(126,70,101,0.18)] sm:bottom-6 sm:right-6"
        >
          ↑
        </button>
      ) : null}

      {saveToastOpen ? (
        <div className="pointer-events-none fixed inset-x-3 top-20 z-[70] flex justify-center sm:top-6">
          <div className="save-success-pop relative overflow-hidden rounded-[8px] border border-[#b9e5c2] bg-[#f2fff1] px-5 py-4 text-center shadow-[0_18px_42px_rgba(71,121,76,0.22)]">
            <span className="save-success-sparkle left-4 top-3">✦</span>
            <span className="save-success-sparkle right-5 top-5 delay-150">✦</span>
            <span className="save-success-sparkle bottom-3 left-1/2 delay-300">✦</span>
            <p className="text-base font-black text-[#2f6b3a]">Record saved successfully</p>
            <p className="mt-1 text-xs font-bold text-[#4f7b58]">Added to Dua&apos;s meal report.</p>
          </div>
        </div>
      ) : null}

      <header className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <Link
          className="pressable inline-flex min-h-10 items-center rounded-full border border-[#e7ccd9] bg-[#fffafd] px-3 py-2 text-xs font-black text-[#5e3752] shadow-sm sm:px-4 sm:text-sm"
          href="/report"
        >
          Report
        </Link>
        <button
          type="button"
          onClick={() => setTipsOpen(true)}
          className="pressable inline-flex min-h-10 items-center rounded-full border border-[#ead8e2] bg-[#fffafd] px-3 py-2 text-xs font-black text-[#5e3752] shadow-sm sm:px-4 sm:text-sm"
        >
          Tips
        </button>
        <button
          type="button"
          onClick={() => setTargetsOpen(true)}
          className="pressable inline-flex min-h-10 items-center rounded-full border border-[#ead8e2] bg-[#fffafd] px-3 py-2 text-xs font-black text-[#5e3752] shadow-sm sm:px-4 sm:text-sm"
        >
          Calories Map
        </button>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="pressable inline-flex min-h-10 items-center rounded-full border border-[#ead8e2] bg-[#fffafd] px-3 py-2 text-xs font-black text-[#5e3752] shadow-sm sm:px-4 sm:text-sm"
        >
          Settings
        </button>
      </header>

      <section className="pt-2 text-center">
        <BabyMascot isLoading={loading} />
        <h1 className="brand-title mt-1 text-5xl font-black text-[#633d55]">Dưa Béo</h1>
        <p className="mx-auto mt-2 max-w-sm text-base font-semibold leading-6 text-[#765066]">
          Cute meal ideas with toddler-sized portions
        </p>
        <div className="mx-auto mt-4 inline-flex items-center gap-3 rounded-full border border-[#edc2d4] bg-[#fffafd] px-5 py-3 shadow-[0_12px_28px_rgba(126,70,101,0.12)]">
          <span className="text-xs font-black uppercase tracking-[0.1em] text-[#9c456c]">Actual calories</span>
          <span className="text-xl font-black text-[#633d55]">{Math.round(summary.totalCalories)} kcal</span>
        </div>
      </section>

      <section className="mx-auto mt-5 w-full max-w-3xl">
        <MealAssistant
          mealType={mealType}
          currentItems={mealItems.map((item) => ({ ingredientKey: item.ingredientKey, name: item.name, amount: item.amount, unit: item.unit }))}
          disabled={loading}
          value={freeText}
          onChangeText={setFreeText}
          onApply={applyParsedMeal}
          onFallback={applyFreeText}
        />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.25fr] lg:items-start">
        <div className="soft-card space-y-5 p-4">
          <div className="rounded-[8px] border border-[#efd6e2] bg-white/62 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-[#633d55]">Meal drafts</p>
              <CuteButton type="button" variant="secondary" onClick={addMealSession} className="min-h-9 px-3 py-2 text-xs">
                New draft
              </CuteButton>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {mealSessions.map((session, index) => {
                const active = session.id === activeSessionId;
                const foodCount = active ? mealItems.length : session.mealItems.length;
                return (
                  <div
                    key={session.id}
                    className={`flex min-w-[8.75rem] items-center rounded-[8px] border shadow-sm ${
                      active ? "border-[#c35f8d] bg-[#ffe6f0]" : "border-[#ead8e2] bg-[#fffafd]"
                    }`}
                  >
                    <button type="button" onClick={() => switchSession(session.id)} className="min-w-0 flex-1 px-3 py-2 text-left">
                      <span className={`block truncate text-xs font-black ${active ? "text-[#7d3157]" : "text-[#633d55]"}`}>
                        {session.title || `Draft ${index + 1}`}
                      </span>
                      <span className="block truncate text-[11px] font-bold text-[#8a6679]">
                        {active ? mealType : session.mealType} · {foodCount} foods
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Close ${session.title || `Draft ${index + 1}`}`}
                      onClick={() => closeMealSession(session.id)}
                      className="mr-1 grid h-7 w-7 flex-none place-items-center rounded-full text-xs font-black text-[#9c456c]"
                    >
                      x
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-black text-[#633d55]">Meal type</span>
            <select
              value={mealType}
              onChange={(event) => {
                changeMealType(event.target.value);
              }}
              className="min-h-12 w-full rounded-[8px] border border-white/80 bg-white/78 px-4 text-base font-bold text-[#633d55] shadow-sm outline-none focus:border-[#ff8dbc]"
            >
              {visibleMealTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <div className="rounded-[8px] border border-[#efd6e2] bg-white/62 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#633d55]">Food list</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#8a6679]">
                  AI can fill the meal from your description. Open this list when you want to add foods manually.
                </p>
              </div>
              <CuteButton type="button" variant="secondary" onClick={() => setFoodListOpen(true)} className="min-h-10 flex-none px-3 py-2 text-xs sm:px-4 sm:text-sm">
                Available foods
              </CuteButton>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <SuggestedMeals meals={suggestedMeals} selectedId={selectedMealId} onSelect={setSelectedMealId} />
          <MealQuantityGrid
            items={mealItems}
            mealType={mealType}
            onChange={(items) => {
              setMealItems(items);
              setReview(null);
            }}
          />

          <div className="soft-card grid gap-3 p-4 sm:grid-cols-2">
            <CuteButton type="button" className="w-full text-base" disabled={!canReview || loading} onClick={reviewMeal}>
              {loading ? (
                <span className="inline-flex items-center justify-center gap-1">
                  Reviewing
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                  <span className="loading-dot">.</span>
                </span>
              ) : (
                "Review this meal for my kid"
              )}
            </CuteButton>
            <CuteButton
              type="button"
              variant="secondary"
              className="w-full text-base"
              disabled={!canReview || saving}
              onClick={openSaveMealRecord}
            >
              Save meal record
            </CuteButton>
          </div>

          {savedMessage ? <p className="rounded-[8px] bg-[#eaf7e5] p-3 text-sm font-bold text-[#356f3f]">{savedMessage}</p> : null}
          {error ? <p className="rounded-[8px] bg-[#fff0d7] p-3 text-sm font-bold leading-6 text-[#7a4a20]">{error}</p> : null}
          <MealReviewPanel review={review} loading={loading} error="" />
        </div>
      </section>

      {customFoodOpen ? (
        <Modal title="Add custom food" onClose={() => setCustomFoodOpen(false)}>
          <div className="space-y-3">
            <input
              type="text"
              value={customFoodName}
              onChange={(event) => setCustomFoodName(event.currentTarget.value)}
              placeholder="Food name"
              className="min-h-12 w-full rounded-[8px] border border-white/80 bg-white/78 px-4 text-base font-semibold text-[#633d55] outline-none focus:border-[#ff8dbc]"
            />
            <input
              type="number"
              min={1}
              step={1}
              value={customFoodCalories}
              onChange={(event) => setCustomFoodCalories(event.currentTarget.value)}
              placeholder="Calories (kcal)"
              className="min-h-12 w-full rounded-[8px] border border-white/80 bg-white/78 px-4 text-base font-semibold text-[#633d55] outline-none focus:border-[#ff8dbc]"
            />
          </div>
          <div className="mt-3 flex justify-end">
            <CuteButton type="button" onClick={addCustomFoodFromHome}>
              Add to meal
            </CuteButton>
          </div>
        </Modal>
      ) : null}

      {foodListOpen ? (
        <Modal title={`Available foods for ${mealType}`} onClose={() => setFoodListOpen(false)}>
          <p className="mb-4 text-sm font-semibold leading-6 text-[#765066]">
            Tap a food to add or remove it from this meal. Your selected foods and actual calories update immediately.
          </p>
          <div className="mb-4 flex justify-end">
            <CuteButton
              type="button"
              variant="secondary"
              onClick={() => {
                setFoodListOpen(false);
                setCustomFoodOpen(true);
              }}
              className="min-h-10 px-4 py-2"
            >
              Custom food
            </CuteButton>
          </div>
          <IngredientChips mealType={mealType} selected={selectedIngredients} onChange={updateSelectedIngredients} />
        </Modal>
      ) : null}

      {saveOpen ? (
        <Modal title="How much did she finish?" onClose={() => setSaveOpen(false)}>
          <div className="rounded-[8px] bg-white/72 p-4">
            <label className="mb-4 block space-y-2">
              <span className="text-sm font-black text-[#633d55]">Meal date</span>
              <input
                type="date"
                value={recordDate}
                onChange={(event) => {
                  setRecordDate(event.currentTarget.value || localDateString());
                  setSaveError("");
                  setDuplicateRecord(null);
                }}
                className="min-h-12 w-full rounded-[8px] border border-[#f6cbdb] bg-white px-3 text-base font-black text-[#633d55] outline-none focus:border-[#ff8dbc]"
              />
            </label>
            <div className="flex items-center justify-between">
              <p className="text-sm font-black text-[#633d55]">Estimated completion</p>
              <p className="text-2xl font-black text-[#9c456c]">{completionPercent}%</p>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={completionPercent}
              onChange={(event) => setCompletionPercent(Number(event.currentTarget.value))}
              className="tiny-slider mt-4"
              style={{
                background: `linear-gradient(90deg, #b84a78 0 ${completionPercent}%, #f7ddea ${completionPercent}% 100%)`,
              }}
            />
            <p className="mt-3 text-sm font-semibold leading-6 text-[#765066]">
              Offered {summary.totalCalories} kcal. Estimated eaten {Math.round((summary.totalCalories * completionPercent) / 100)} kcal.
            </p>
            {saveError ? (
              <div className="mt-4 rounded-[8px] border border-[#f0c37c] bg-[#fff7e8] p-3 text-sm font-bold leading-6 text-[#7a4a20]">
                <p>{saveError}</p>
                {duplicateRecord ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <CuteButton type="button" variant="secondary" onClick={updateExistingMealRecord} disabled={saving} className="min-h-10 px-4 py-2 text-sm">
                      {saving ? "Updating..." : "Update previous record"}
                    </CuteButton>
                    <Link
                      href="/report"
                      className="pressable inline-flex min-h-10 items-center rounded-full border border-[#e7ccd9] bg-white px-4 py-2 text-sm font-black text-[#633d55]"
                    >
                      Open report
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex justify-end">
            <CuteButton type="button" onClick={saveMealRecord} disabled={saving}>
              {saving ? "Saving..." : "Save record"}
            </CuteButton>
          </div>
        </Modal>
      ) : null}

      {tipsOpen ? (
        <Modal title="Calm mealtime tips" onClose={() => setTipsOpen(false)}>
          <div className="space-y-3 text-sm font-semibold leading-6 text-[#765066]">
            <Tip title="When she cries" body="Pause, lower your voice, and name the feeling: You are upset. Food can wait. Keep the plate nearby without chasing bites." />
            <Tip title="When she eats only part" body="Say: You listened to your tummy. Keep the next planned food predictable instead of bargaining with fruit or milk." />
            <Tip title="When she wants family food" body="Offer a small planned top-up plate from family food, cut safely. Keep it on her plate, not from an adult fork." />
            <Tip title="When protein is refused" body="Keep rice safe and familiar. Put protein beside it in a tiny amount, not hidden or stuck to the rice." />
          </div>
        </Modal>
      ) : null}

      {targetsOpen ? (
        <Modal title="Tiny calorie map" onClose={() => setTargetsOpen(false)}>
          <div className="grid gap-2">
            {visibleMealTypes.map((type) => {
              const target = mealTargets[type];
              return (
                <div key={type} className="rounded-[8px] bg-white/72 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black text-[#633d55]">{type}</p>
                    <p className="rounded-full bg-[#fff0d7] px-3 py-1 text-xs font-black text-[#8a5422]">{target.calories} kcal</p>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-5 text-[#8a6679]">
                    Protein {target.protein}g · Carb {target.carbs}g · Fat {target.fat}g
                  </p>
                </div>
              );
            })}
          </div>
        </Modal>
      ) : null}

      <SettingsPanel open={settingsOpen} profile={profile} onOpenChange={setSettingsOpen} onChange={setProfile} />
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#51354a]/20 p-3 backdrop-blur-sm sm:place-items-center">
      <section className="soft-card max-h-[88vh] w-full max-w-lg overflow-auto p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-[#633d55]">{title}</h2>
          <button type="button" onClick={onClose} className="pressable grid h-10 w-10 place-items-center rounded-full bg-white/76 font-black text-[#9c456c]">
            x
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Tip({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[8px] bg-white/72 p-3">
      <p className="font-black text-[#633d55]">{title}</p>
      <p>{body}</p>
    </div>
  );
}
