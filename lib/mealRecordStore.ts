import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MealRecord } from "@/types/mealRecord";

export type MealRecordStore = {
  list: () => Promise<MealRecord[]>;
  add: (record: MealRecord) => Promise<MealRecord>;
};

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "meal-records.json");

class JsonMealRecordStore implements MealRecordStore {
  async list() {
    try {
      const content = await readFile(filePath, "utf8");
      return JSON.parse(content) as MealRecord[];
    } catch {
      return [];
    }
  }

  async add(record: MealRecord) {
    const records = await this.list();
    const nextRecords = [record, ...records].slice(0, 1000);
    await mkdir(dataDir, { recursive: true });
    await writeFile(filePath, `${JSON.stringify(nextRecords, null, 2)}\n`, "utf8");
    return record;
  }
}

let store: MealRecordStore | null = null;

export function getMealRecordStore() {
  if (!store) {
    store = new JsonMealRecordStore();
  }
  return store;
}
