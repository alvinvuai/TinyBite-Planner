"use client";

import type { MealReview } from "@/types/nutrition";

type MealReviewPanelProps = {
  review: MealReview | null;
  loading: boolean;
  error: string;
};

export function MealReviewPanel({ review, loading, error }: MealReviewPanelProps) {
  if (loading) {
    return (
      <section className="soft-card p-4 text-sm font-black text-[#633d55]">
        Reviewing the little plate<span className="loading-dot">.</span>
        <span className="loading-dot">.</span>
        <span className="loading-dot">.</span>
      </section>
    );
  }

  if (error) {
    return <section className="rounded-[8px] bg-[#fff0d7] p-4 text-sm font-bold leading-6 text-[#7a4a20]">{error}</section>;
  }

  if (!review) return null;

  return (
    <section className="sparkle-pop soft-card space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c35f8d]">Meal review</p>
          <h2 className="mt-1 text-xl font-black text-[#633d55]">{review.verdict}</h2>
        </div>
        <div className="rounded-full bg-[#fff0d7] px-3 py-2 text-xs font-black text-[#8a5422]">{review.totalCalories} kcal</div>
      </div>

      <ReviewList title="Looks good" items={review.strengths} />
      <ReviewList title="Tiny tweaks" items={review.suggestions} />
      <ReviewList title="Safety" items={review.safetyNotes} />

      <div className="rounded-[8px] bg-[#ffe6f0] p-3 text-sm font-semibold leading-6 text-[#765066]">
        <p className="font-black text-[#9c456c]">Feeding note</p>
        <p>{review.feedingNote}</p>
      </div>
    </section>
  );
}

function ReviewList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-[8px] bg-white/72 p-3">
      <p className="text-sm font-black text-[#633d55]">{title}</p>
      <ul className="mt-2 space-y-1 text-sm font-semibold leading-6 text-[#765066]">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
