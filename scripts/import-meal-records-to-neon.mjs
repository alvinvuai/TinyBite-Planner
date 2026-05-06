import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";

function loadEnvFile(fileName) {
  const filePath = path.join(process.cwd(), fileName);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL, POSTGRES_URL, or NEON_DATABASE_URL.");
  process.exit(1);
}

const localFile = path.join(process.cwd(), "data", "meal-records.json");
if (!existsSync(localFile)) {
  console.log("No local data/meal-records.json file found. Nothing to import.");
  process.exit(0);
}

const records = JSON.parse(readFileSync(localFile, "utf8"));
if (!Array.isArray(records) || records.length === 0) {
  console.log("Local meal-records.json is empty. Nothing to import.");
  process.exit(0);
}

const sql = neon(databaseUrl);

await sql`
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
await sql`CREATE INDEX IF NOT EXISTS meal_records_user_date_idx ON meal_records (user_name, date DESC, created_at DESC)`;

let imported = 0;
for (const record of records) {
  await sql`
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
      ${record.user || "Dua"},
      ${record.date}::date,
      ${record.mealName},
      ${record.completionPercent},
      ${record.totalMealCalories},
      ${record.totalConsumedCalories},
      ${JSON.stringify(record.ingredients || [])}::jsonb,
      ${record.createdAt || new Date().toISOString()}::timestamptz
    )
    ON CONFLICT (id) DO NOTHING
  `;
  imported += 1;
}

console.log(`Imported ${imported} local meal record(s) into Neon.`);
