import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { MealRecord } from "@/types/mealRecord";

export type MealRecordStore = {
  list: () => Promise<MealRecord[]>;
  add: (record: MealRecord) => Promise<MealRecord>;
  update: (record: MealRecord) => Promise<MealRecord | null>;
  updateDate: (id: string, date: string) => Promise<MealRecord | null>;
};

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "meal-records.json");

function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL || "";
}

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

  async update(record: MealRecord) {
    const records = await this.list();
    const index = records.findIndex((item) => item.id === record.id && item.user === "Dua");
    if (index === -1) return null;

    const nextRecords = records.map((item, recordIndex) => (recordIndex === index ? record : item));
    await mkdir(dataDir, { recursive: true });
    await writeFile(filePath, `${JSON.stringify(nextRecords, null, 2)}\n`, "utf8");
    return record;
  }

  async updateDate(id: string, date: string) {
    const records = await this.list();
    const index = records.findIndex((record) => record.id === id && record.user === "Dua");
    if (index === -1) return null;

    const updated = { ...records[index], date };
    const nextRecords = records.map((record, recordIndex) => (recordIndex === index ? updated : record));
    await mkdir(dataDir, { recursive: true });
    await writeFile(filePath, `${JSON.stringify(nextRecords, null, 2)}\n`, "utf8");
    return updated;
  }
}

class NeonMealRecordStore implements MealRecordStore {
  private sql: NeonQueryFunction<false, false>;
  private ready: Promise<void> | null = null;

  constructor(databaseUrl: string) {
    this.sql = neon(databaseUrl);
  }

  private async ensureTable() {
    if (!this.ready) {
      this.ready = (async () => {
        await this.sql`
          CREATE TABLE IF NOT EXISTS meal_records (
            id uuid PRIMARY KEY,
            user_name text NOT NULL DEFAULT 'Dua',
            date date NOT NULL,
            meal_name text NOT NULL,
            completion_percent integer NOT NULL CHECK (completion_percent >= 0 AND completion_percent <= 100),
            total_meal_calories integer NOT NULL CHECK (total_meal_calories >= 0),
            total_consumed_calories integer NOT NULL CHECK (total_consumed_calories >= 0),
            ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now()
          )
        `;
        await this.sql`CREATE INDEX IF NOT EXISTS meal_records_user_date_idx ON meal_records (user_name, date DESC, created_at DESC)`;
      })();
    }

    await this.ready;
  }

  async list() {
    await this.ensureTable();
    const rows = await this.sql`
      SELECT
        id::text,
        user_name,
        to_char(date, 'YYYY-MM-DD') AS date,
        meal_name,
        completion_percent,
        total_meal_calories,
        total_consumed_calories,
        ingredients,
        created_at::text
      FROM meal_records
      WHERE user_name = 'Dua'
      ORDER BY date DESC, created_at DESC
      LIMIT 1000
    `;

    return rows.map(toMealRecord);
  }

  async add(record: MealRecord) {
    await this.ensureTable();
    await this.sql`
      INSERT INTO meal_records (
        id,
        user_name,
        date,
        meal_name,
        completion_percent,
        total_meal_calories,
        total_consumed_calories,
        ingredients,
        created_at
      )
      VALUES (
        ${record.id}::uuid,
        ${record.user},
        ${record.date}::date,
        ${record.mealName},
        ${record.completionPercent},
        ${record.totalMealCalories},
        ${record.totalConsumedCalories},
        ${JSON.stringify(record.ingredients)}::jsonb,
        ${record.createdAt}::timestamptz
      )
    `;
    return record;
  }

  async update(record: MealRecord) {
    await this.ensureTable();
    const rows = await this.sql`
      UPDATE meal_records
      SET
        date = ${record.date}::date,
        meal_name = ${record.mealName},
        completion_percent = ${record.completionPercent},
        total_meal_calories = ${record.totalMealCalories},
        total_consumed_calories = ${record.totalConsumedCalories},
        ingredients = ${JSON.stringify(record.ingredients)}::jsonb,
        created_at = ${record.createdAt}::timestamptz
      WHERE id = ${record.id}::uuid
        AND user_name = 'Dua'
      RETURNING
        id::text,
        user_name,
        to_char(date, 'YYYY-MM-DD') AS date,
        meal_name,
        completion_percent,
        total_meal_calories,
        total_consumed_calories,
        ingredients,
        created_at::text
    `;

    return rows[0] ? toMealRecord(rows[0]) : null;
  }

  async updateDate(id: string, date: string) {
    await this.ensureTable();
    const rows = await this.sql`
      UPDATE meal_records
      SET date = ${date}::date
      WHERE id = ${id}::uuid
        AND user_name = 'Dua'
      RETURNING
        id::text,
        user_name,
        to_char(date, 'YYYY-MM-DD') AS date,
        meal_name,
        completion_percent,
        total_meal_calories,
        total_consumed_calories,
        ingredients,
        created_at::text
    `;

    return rows[0] ? toMealRecord(rows[0]) : null;
  }
}

function toMealRecord(row: Record<string, unknown>): MealRecord {
  return {
    id: String(row.id),
    user: "Dua",
    date: String(row.date),
    mealName: String(row.meal_name),
    completionPercent: Number(row.completion_percent),
    totalMealCalories: Number(row.total_meal_calories),
    totalConsumedCalories: Number(row.total_consumed_calories),
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : JSON.parse(String(row.ingredients || "[]")),
    createdAt: String(row.created_at),
  };
}

let store: MealRecordStore | null = null;

export function getMealRecordStore() {
  if (!store) {
    const databaseUrl = getDatabaseUrl();
    store = databaseUrl ? new ResilientMealRecordStore(new NeonMealRecordStore(databaseUrl), new JsonMealRecordStore()) : new JsonMealRecordStore();
  }
  return store;
}

export function getMealRecordStoreName() {
  return getDatabaseUrl() ? "Neon Postgres" : "local JSON";
}

class ResilientMealRecordStore implements MealRecordStore {
  constructor(
    private primary: MealRecordStore,
    private fallback: MealRecordStore,
  ) {}

  async list() {
    try {
      return await this.primary.list();
    } catch (error) {
      console.warn("Neon meal record read failed. Falling back to local JSON.", error);
      return this.fallback.list();
    }
  }

  async add(record: MealRecord) {
    try {
      return await this.primary.add(record);
    } catch (error) {
      console.warn("Neon meal record save failed. Falling back to local JSON.", error);
      return this.fallback.add(record);
    }
  }

  async update(record: MealRecord) {
    try {
      const updated = await this.primary.update(record);
      return updated ?? this.fallback.update(record);
    } catch (error) {
      console.warn("Neon meal record update failed. Falling back to local JSON.", error);
      return this.fallback.update(record);
    }
  }

  async updateDate(id: string, date: string) {
    try {
      const updated = await this.primary.updateDate(id, date);
      return updated ?? this.fallback.updateDate(id, date);
    } catch (error) {
      console.warn("Neon meal record date update failed. Falling back to local JSON.", error);
      return this.fallback.updateDate(id, date);
    }
  }
}
