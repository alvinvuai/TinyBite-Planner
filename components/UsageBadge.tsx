import type { MealResponse } from "@/types/meal";

type UsageBadgeProps = {
  usage?: MealResponse["usage"];
};

export function UsageBadge({ usage }: UsageBadgeProps) {
  const used = usage?.usedUsd ?? 0;
  const budget = usage?.budgetUsd ?? 10;
  const percent = usage?.percentUsed ?? 0;
  const warning = percent >= 80;

  return (
    <div className={`rounded-full px-4 py-2 text-xs font-bold shadow-sm ${warning ? "bg-[#fff0cc] text-[#7d4b10]" : "bg-white/70 text-[#765066]"}`}>
      AI budget used: ${used.toFixed(2)} / ${budget.toFixed(0)}
      {warning ? " · watch usage" : ""}
    </div>
  );
}
