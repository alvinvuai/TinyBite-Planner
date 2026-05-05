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
import { VoiceRecorder } from "@/components/VoiceRecorder";
import {
  createMealBuilderItem,
  getAllowedIngredientDefinitions,
  isIngredientAllowedForMeal,
  mealTargets,
  mealTypes,
  normalizeIngredient,
  rebalanceSuggestedItems,
  suggestMeals,
  summarizeMeal,
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

export function MealPlannerForm() {
  const [mode, setMode] = useState<PlanningMode>("single");
  const [mealType, setMealType] = useState("Breakfast");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [profile, setProfile] = useState<ChildProfile>(defaultProfile);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [textOpen, setTextOpen] = useState(false);
  const [tipsOpen, setTipsOpen] = useState(false);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [completionPercent, setCompletionPercent] = useState(80);
  const [mealItems, setMealItems] = useState<MealBuilderItem[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [review, setReview] = useState<MealReview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const savedProfile = localStorage.getItem("tinybite-profile");
      if (savedProfile) setProfile({ ...defaultProfile, ...(JSON.parse(savedProfile) as Partial<ChildProfile>) });
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("tinybite-profile", JSON.stringify(profile));
  }, [profile]);

  const suggestedMeals = suggestMeals(mealItems, mealType);
  const summary = useMemo(() => summarizeMeal(mealItems, mealType), [mealItems, mealType]);
  const canReview = mealItems.length > 0;

  function updateMode(nextMode: PlanningMode) {
    setMode(nextMode);
    if (nextMode === "whole_day") changeMealType("Whole day plan");
    if (nextMode === "single" && mealType === "Whole day plan") changeMealType("Breakfast");
  }

  function changeMealType(nextMealType: string) {
    setMealType(nextMealType);
    const allowedKeys = new Set(getAllowedIngredientDefinitions(nextMealType).map((ingredient) => ingredient.key));
    setSelectedIngredients((current) => current.filter((selected) => isIngredientAllowedForMeal(selected, nextMealType)));
    setMealItems((current) => rebalanceSuggestedItems(current.filter((item) => allowedKeys.has(item.ingredientKey)), nextMealType, true));
    setReview(null);
    setSelectedMealId(null);
  }

  function addTranscript(text: string) {
    setFreeText((current) => [current, text].filter(Boolean).join(" ").trim());
    setTextOpen(true);
  }

  function updateSelectedIngredients(nextSelected: string[], targetMealType = mealType) {
    const allowedSelected = nextSelected.filter((selected) => isIngredientAllowedForMeal(selected, targetMealType));
    setSelectedIngredients(allowedSelected);
    setReview(null);
    setSelectedMealId(null);
    setMealItems((current) => {
      const kept = current.filter((item) => allowedSelected.some((selected) => createMealBuilderItem(selected)?.ingredientKey === item.ingredientKey));
      const existingKeys = new Set(kept.map((item) => item.ingredientKey));
      const added = allowedSelected
        .map((selected) => createMealBuilderItem(selected))
        .filter((item): item is MealBuilderItem => item !== null && !existingKeys.has(item.ingredientKey));
      return rebalanceSuggestedItems([...kept, ...added], targetMealType, true);
    });
  }

  function applyFreeText() {
    const normalized = normalizeIngredient(freeText);
    const inferredMeal = mealTypes.find((type) => normalized.includes(normalizeIngredient(type)));
    const targetMealType = inferredMeal ?? mealType;
    const textIngredients = getAllowedIngredientDefinitions(targetMealType)
      .filter((definition) => definition.aliases.some((alias) => normalized.includes(normalizeIngredient(alias))))
      .map((definition) => definition.name);
    if (inferredMeal) changeMealType(inferredMeal);
    if (textIngredients.length) updateSelectedIngredients(Array.from(new Set([...selectedIngredients, ...textIngredients])), targetMealType);
    setTextOpen(false);
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

  async function saveMealRecord() {
    setError("");
    const totalMealCalories = summary.totalCalories;
    const result = await fetch("/api/meal-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: new Date().toLocaleDateString("en-CA"),
        mealName: mealType,
        completionPercent,
        totalMealCalories,
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
      }),
    });
    const data = (await result.json()) as { record?: { totalConsumedCalories: number }; message?: string };
    if (!result.ok || !data.record) {
      setError(data.message || "Could not save meal record.");
      return;
    }
    setSaveOpen(false);
    setSavedMessage(`Saved ${mealType}: about ${data.record.totalConsumedCalories} kcal consumed. View it in Report.`);
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <VoiceRecorder onTranscript={addTranscript} disabled={loading} floating />

      <header className="flex items-center justify-end gap-3">
        <Link className="pressable rounded-full border border-[#e7ccd9] bg-[#fffafd] px-5 py-3 text-sm font-black text-[#5e3752] shadow-sm" href="/report">
          Report
        </Link>
        <CuteButton type="button" variant="ghost" onClick={() => setSettingsOpen(true)}>
          Settings
        </CuteButton>
      </header>

      <section className="pt-2 text-center">
        <BabyMascot isLoading={loading} />
        <h1 className="brand-title mt-1 text-5xl font-black text-[#633d55]">Dưa Béo</h1>
        <p className="mx-auto mt-2 max-w-sm text-base font-semibold leading-6 text-[#765066]">
          Cute meal ideas with toddler-sized portions
        </p>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.25fr] lg:items-start">
        <div className="soft-card space-y-5 p-4">
          <div className="grid grid-cols-2 gap-2 rounded-[8px] bg-white/54 p-1">
            {(["single", "whole_day"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => updateMode(item)}
                className={`pressable min-h-12 rounded-[8px] text-sm font-black ${
                  mode === item ? "bg-white text-[#9c456c] shadow-sm" : "text-[#8a6679]"
                }`}
              >
                {item === "single" ? "Single meal" : "Whole day"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <CuteButton type="button" variant="secondary" onClick={() => setTextOpen(true)} className="min-h-10 px-4 py-2">
              Type foods
            </CuteButton>
            <CuteButton type="button" variant="secondary" onClick={() => setTipsOpen(true)} className="min-h-10 px-4 py-2">
              Mealtime tips
            </CuteButton>
            <CuteButton type="button" variant="secondary" onClick={() => setTargetsOpen(true)} className="min-h-10 px-4 py-2">
              Calorie map
            </CuteButton>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-black text-[#633d55]">Meal type</span>
            <select
              value={mealType}
              onChange={(event) => {
                changeMealType(event.target.value);
                if (event.target.value === "Whole day plan") setMode("whole_day");
              }}
              className="min-h-12 w-full rounded-[8px] border border-white/80 bg-white/78 px-4 text-base font-bold text-[#633d55] shadow-sm outline-none focus:border-[#ff8dbc]"
            >
              {mealTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>

          <div className="space-y-2">
            <p className="text-sm font-black text-[#633d55]">Available foods</p>
            <IngredientChips mealType={mealType} selected={selectedIngredients} onChange={updateSelectedIngredients} />
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
            <CuteButton type="button" variant="secondary" className="w-full text-base" disabled={!canReview} onClick={() => setSaveOpen(true)}>
              Save meal record
            </CuteButton>
          </div>

          {savedMessage ? <p className="rounded-[8px] bg-[#eaf7e5] p-3 text-sm font-bold text-[#356f3f]">{savedMessage}</p> : null}
          {error ? <p className="rounded-[8px] bg-[#fff0d7] p-3 text-sm font-bold leading-6 text-[#7a4a20]">{error}</p> : null}
          <MealReviewPanel review={review} loading={loading} error="" />
        </div>
      </section>

      {textOpen ? (
        <Modal title="Tell Dưa Béo what you have" onClose={() => setTextOpen(false)}>
          <textarea
            value={freeText}
            onChange={(event) => setFreeText(event.target.value)}
            rows={5}
            placeholder="I have eggs and rice and cheese and banana for breakfast."
            className="min-h-32 w-full resize-none rounded-[8px] border border-white/80 bg-white/78 px-4 py-3 text-base font-semibold leading-6 text-[#633d55] shadow-sm outline-none placeholder:text-[#b999aa] focus:border-[#ff8dbc]"
          />
          <div className="mt-3 flex justify-end">
            <CuteButton type="button" onClick={applyFreeText}>
              Add to planner
            </CuteButton>
          </div>
        </Modal>
      ) : null}

      {saveOpen ? (
        <Modal title="How much did she finish?" onClose={() => setSaveOpen(false)}>
          <div className="rounded-[8px] bg-white/72 p-4">
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
          </div>
          <div className="mt-3 flex justify-end">
            <CuteButton type="button" onClick={saveMealRecord}>
              Save record
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
            {mealTypes.map((type) => {
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
