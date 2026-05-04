import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { monthKey } from "@/lib/cost";

export type UsageRecord = {
  month: string;
  inputTokens: number;
  outputTokens: number;
  estimatedUsd: number;
  thresholdNotified: number[];
  updatedAt: string;
};

export interface UsageStore {
  get(month?: string): Promise<UsageRecord>;
  add(inputTokens: number, outputTokens: number, estimatedUsd: number, month?: string): Promise<UsageRecord>;
  markNotified(threshold: number, month?: string): Promise<UsageRecord>;
}

const emptyRecord = (month = monthKey()): UsageRecord => ({
  month,
  inputTokens: 0,
  outputTokens: 0,
  estimatedUsd: 0,
  thresholdNotified: [],
  updatedAt: new Date().toISOString(),
});

class MemoryUsageStore implements UsageStore {
  private records = new Map<string, UsageRecord>();

  async get(month = monthKey()) {
    return this.records.get(month) || emptyRecord(month);
  }

  async add(inputTokens: number, outputTokens: number, estimatedUsd: number, month = monthKey()) {
    const current = await this.get(month);
    const next = {
      ...current,
      inputTokens: current.inputTokens + inputTokens,
      outputTokens: current.outputTokens + outputTokens,
      estimatedUsd: current.estimatedUsd + estimatedUsd,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(month, next);
    return next;
  }

  async markNotified(threshold: number, month = monthKey()) {
    const current = await this.get(month);
    const next = {
      ...current,
      thresholdNotified: Array.from(new Set([...current.thresholdNotified, threshold])).sort((a, b) => a - b),
      updatedAt: new Date().toISOString(),
    };
    this.records.set(month, next);
    return next;
  }
}

class FileUsageStore implements UsageStore {
  private filePath = path.join(process.cwd(), "data", "usage.json");

  private async readAll(): Promise<Record<string, UsageRecord>> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return JSON.parse(raw) as Record<string, UsageRecord>;
    } catch {
      return {};
    }
  }

  private async writeAll(records: Record<string, UsageRecord>) {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(records, null, 2), "utf8");
  }

  async get(month = monthKey()) {
    const records = await this.readAll();
    return records[month] || emptyRecord(month);
  }

  async add(inputTokens: number, outputTokens: number, estimatedUsd: number, month = monthKey()) {
    const records = await this.readAll();
    const current = records[month] || emptyRecord(month);
    const next = {
      ...current,
      inputTokens: current.inputTokens + inputTokens,
      outputTokens: current.outputTokens + outputTokens,
      estimatedUsd: current.estimatedUsd + estimatedUsd,
      updatedAt: new Date().toISOString(),
    };
    records[month] = next;
    await this.writeAll(records);
    return next;
  }

  async markNotified(threshold: number, month = monthKey()) {
    const records = await this.readAll();
    const current = records[month] || emptyRecord(month);
    const next = {
      ...current,
      thresholdNotified: Array.from(new Set([...current.thresholdNotified, threshold])).sort((a, b) => a - b),
      updatedAt: new Date().toISOString(),
    };
    records[month] = next;
    await this.writeAll(records);
    return next;
  }
}

let store: UsageStore | null = null;

export function getUsageStore(): UsageStore {
  if (!store) {
    store = process.env.VERCEL ? new MemoryUsageStore() : new FileUsageStore();
    if (process.env.VERCEL) {
      console.warn(
        "TinyBite usage store is in-memory on Vercel. Add Upstash Redis, Vercel KV, Supabase, or Postgres for persistent production usage tracking.",
      );
    }
  }
  return store;
}
