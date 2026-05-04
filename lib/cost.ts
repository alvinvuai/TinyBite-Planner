import type { generateMealRequestSchema } from "@/lib/schemas";
import type { z } from "zod";

export type UsageSummary = {
  usedUsd: number;
  budgetUsd: number;
  remainingUsd: number;
  percentUsed: number;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

type GenerateMealRequest = z.infer<typeof generateMealRequestSchema>;

export function getBudgetUsd() {
  return Number(process.env.MONTHLY_BUDGET_USD || 10);
}

export function getInputPricePer1M() {
  return Number(process.env.OPENAI_INPUT_PRICE_PER_1M || 0);
}

export function getOutputPricePer1M() {
  return Number(process.env.OPENAI_OUTPUT_PRICE_PER_1M || 0);
}

export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function estimateRequestTokens(input: GenerateMealRequest) {
  const promptChars = JSON.stringify(input).length + 1800;
  return estimateTokens(promptChars.toString()) + estimateTokens(JSON.stringify(input));
}

export function maxOutputTokensForMode(mode: "single" | "whole_day") {
  return mode === "whole_day" ? 1500 : 650;
}

export function calculateUsd({ inputTokens, outputTokens }: TokenUsage) {
  return (inputTokens / 1_000_000) * getInputPricePer1M() + (outputTokens / 1_000_000) * getOutputPricePer1M();
}

export function toUsageSummary(usedUsd: number): UsageSummary {
  const budgetUsd = getBudgetUsd();
  const remainingUsd = Math.max(0, budgetUsd - usedUsd);
  const percentUsed = budgetUsd > 0 ? Math.min(100, (usedUsd / budgetUsd) * 100) : 100;
  return { usedUsd, budgetUsd, remainingUsd, percentUsed };
}

export function monthKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
