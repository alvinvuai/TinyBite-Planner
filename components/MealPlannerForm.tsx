"use client";

import { useEffect, useState } from "react";
import { BabyMascot } from "@/components/BabyMascot";
import { CuteButton } from "@/components/CuteButton";
import { IngredientChips } from "@/components/IngredientChips";
import { MealQuantityGrid } from "@/components/MealQuantityGrid";
import { MealReviewPanel } from "@/components/MealReviewPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SuggestedMeals } from "@/components/SuggestedMeals";
import { UsageBadge } from "@/components/UsageBadge";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { createMealBuilderItem, suggestMeals } from "@/lib/nutrition";
import type { ChildProfile, MealResponse, PlanningMode } from "@/types/meal";
import type { MealBuilderItem, MealReview } from "@/types/nutrition";

const mealTypes = [
  "Breakfast",
  "Snack after breakfast / morning tea",
  "Lunch",
  "Afternoon tea",
  "Dinner",
  "After dinner snack",
  "Small portion eating with family",
  "Bedtime milk/yoghurt",
  "Whole day plan",
];

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
  const [response, setResponse] = useState<MealResponse | null>(null);
  const [mealItems, setMealItems] = useState<MealBuilderItem[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [review, setReview] = useState<MealReview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const savedProfile = localStorage.getItem("tinybite-profile");
      const savedUsage = localStorage.getItem("tinybite-usage");
      if (savedProfile) setProfile({ ...defaultProfile, ...(JSON.parse(savedProfile) as Partial<ChildProfile>) });
      if (savedUsage) {
        setResponse({
          mode: "single",
          source: "fallback",
          usage: JSON.parse(savedUsage) as MealResponse["usage"],
        });
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("tinybite-profile", JSON.stringify(profile));
  }, [profile]);

  function updateMode(nextMode: PlanningMode) {
    setMode(nextMode);
    if (nextMode === "whole_day") setMealType("Whole day plan");
    if (nextMode === "single" && mealType === "Whole day plan") setMealType("Breakfast");
  }

  function addTranscript(text: string) {
    setFreeText((current) => [current, text].filter(Boolean).join(" ").trim());
  }

  function updateSelectedIngredients(nextSelected: string[]) {
    setSelectedIngredients(nextSelected);
    setReview(null);
    setSelectedMealId(null);
    setMealItems((current) => {
      const nextKeys = new Set(nextSelected);
      const kept = current.filter((item) =>
        nextSelected.some((selected) => createMealBuilderItem(selected)?.ingredientKey === item.ingredientKey),
      );
      const existingKeys = new Set(kept.map((item) => item.ingredientKey));
      const added = Array.from(nextKeys)
        .map((selected) => createMealBuilderItem(selected))
        .filter((item): item is MealBuilderItem => item !== null && !existingKeys.has(item.ingredientKey));
      return [...kept, ...added];
    });
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
          items: mealItems,
          childProfile: profile,
        }),
      });
      const data = (await result.json()) as MealReview & { message?: string };
      if (!result.ok) {
        throw new Error(data.message || "Meal review failed.");
      }
      setReview(data);
      if (data.usage) {
        setResponse({ mode, source: "fallback", usage: data.usage });
        localStorage.setItem("tinybite-usage", JSON.stringify(data.usage));
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const suggestedMeals = suggestMeals(mealItems, mealType);
  const canReview = mealItems.length > 0;

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <UsageBadge usage={response?.usage} />
        <CuteButton type="button" variant="ghost" onClick={() => setSettingsOpen(true)}>
          Settings
        </CuteButton>
      </header>

      <section className="pt-2 text-center">
        <BabyMascot isLoading={loading} />
        <h1 className="mt-1 text-4xl font-black tracking-normal text-[#633d55]">TinyBite Planner</h1>
        <p className="mx-auto mt-2 max-w-sm text-base font-semibold leading-6 text-[#765066]">
          Cute meal ideas with toddler-sized portions
        </p>
      </section>

      <section className="soft-card mt-5 space-y-5 p-4">
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

        <label className="block space-y-2">
          <span className="text-sm font-black text-[#633d55]">Meal type</span>
          <select
            value={mealType}
            onChange={(event) => {
              setMealType(event.target.value);
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
          <IngredientChips selected={selectedIngredients} onChange={updateSelectedIngredients} />
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-black text-[#633d55]">Tell TinyBite what you have</span>
          <textarea
            value={freeText}
            onChange={(event) => setFreeText(event.target.value)}
            rows={4}
            placeholder="I have eggs and rice and cheese and banana for breakfast."
            className="min-h-32 w-full resize-none rounded-[8px] border border-white/80 bg-white/78 px-4 py-3 text-base font-semibold leading-6 text-[#633d55] shadow-sm outline-none placeholder:text-[#b999aa] focus:border-[#ff8dbc]"
          />
        </label>

        <VoiceRecorder onTranscript={addTranscript} disabled={loading} />

        <CuteButton type="button" className="w-full text-base" disabled={!canReview || loading} onClick={reviewMeal}>
          {loading ? (
            <span className="inline-flex items-center justify-center gap-1">
              Reviewing this little plate
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
              <span className="loading-dot">.</span>
            </span>
          ) : (
            "Review this meal for my kid"
          )}
        </CuteButton>

        {error ? <p className="rounded-[8px] bg-[#fff0d7] p-3 text-sm font-bold leading-6 text-[#7a4a20]">{error}</p> : null}
      </section>

      <div className="mt-5 space-y-5">
        <SuggestedMeals meals={suggestedMeals} selectedId={selectedMealId} onSelect={setSelectedMealId} />
        <MealQuantityGrid
          items={mealItems}
          onChange={(items) => {
            setMealItems(items);
            setReview(null);
          }}
        />
        <MealReviewPanel review={review} loading={loading} error={error} />
      </div>

      <SettingsPanel open={settingsOpen} profile={profile} onOpenChange={setSettingsOpen} onChange={setProfile} />
    </div>
  );
}
