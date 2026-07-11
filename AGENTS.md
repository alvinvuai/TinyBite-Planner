# AGENTS.md

This file captures practical project knowledge for future coding agents working on **Dưa Béo**.

## Project Identity

- Current app title: **Dưa Béo**.
- Original project name: TinyBite Planner.
- GitHub remote: `https://github.com/alvinvuai/TinyBite-Planner.git`.
- Main branch: `main`.
- Primary user: Alvin.
- Child/user label in saved meal records: `"Dua"`.

Do not rename the app away from **Dưa Béo** unless explicitly asked.

## Tech Stack

- Next.js App Router.
- TypeScript.
- React.
- Tailwind CSS.
- Zod.
- OpenAI Node SDK.
- Vercel deployment target.
- No database yet for v1; local JSON files are used for local development.

## Important Commands

```bash
npm install
npm run dev
npm run lint
npm run build
git status -sb
```

Local dev URL:

```text
http://127.0.0.1:3000/
```

Before reporting code changes as done, prefer running:

```bash
npm run lint
npm run build
```

For UI work, also verify in a browser/mobile viewport.

## Important Files

```text
app/page.tsx
app/layout.tsx
app/globals.css
app/report/page.tsx
app/api/generate-meal/route.ts
app/api/parse-meal/route.ts
app/api/review-meal/route.ts
app/api/transcribe/route.ts
app/api/meal-records/route.ts
app/api/usage/route.ts
components/MealPlannerForm.tsx
components/MealAssistant.tsx
components/IngredientChips.tsx
components/MealQuantityGrid.tsx
components/MealReviewPanel.tsx
components/VoiceRecorder.tsx
lib/nutrition.ts
lib/cost.ts
lib/usageStore.ts
lib/mealRecordStore.ts
lib/openai.ts
lib/schemas.ts
types/nutrition.ts
types/meal.ts
```

## Environment Variables

Keep secrets out of git. `.env.local` is for local development and is ignored.

Vercel environment variables should be configured in the Vercel dashboard.

```bash
OPENAI_API_KEY=
OPENAI_MEAL_MODEL=
OPENAI_TRANSCRIBE_MODEL=
OPENAI_INPUT_PRICE_PER_1M=
OPENAI_OUTPUT_PRICE_PER_1M=
MONTHLY_BUDGET_USD=10
ADMIN_SECRET=
NOTIFY_EMAIL=
RESEND_API_KEY=
DATABASE_URL=
```

Notes:

- AI is optional. If `OPENAI_API_KEY` is missing or empty, the app should still work using fallback rules.
- `hasOpenAiKey()` should treat whitespace-only keys as missing.
- OpenAI pricing should stay configurable through environment variables.
- OpenAI project budgets are soft alerts, not a guaranteed hard stop. The app must enforce its own budget.

## Product Rules

The app is for toddler meal planning, not medical diagnosis.

Always preserve these behavioral rules:

- Do not promise weight gain.
- Encourage GP/paediatrician/dietitian review if poor weight gain continues.
- Prefer finger foods.
- Avoid noodles and congee by default.
- Keep rice safe and familiar, but avoid unlimited plain rice advice.
- Keep protein separate if mixed protein causes rice refusal.
- Use small toddler portions.
- Fruit is planned and portioned, not a rescue food.
- Milk is scheduled, not a rescue food.
- Grapes must be quartered lengthwise.
- Avoid whole nuts and thick spoonfuls of nut butter/tahini.
- Keep salt low.
- Keep mealtime guidance calm and low pressure.

## Meal Types

Keep this full list unless the user asks for changes:

```text
Breakfast
Dessert after breakfast
Snack after breakfast / morning tea
Lunch
Dessert after lunch
Afternoon tea
Dinner
After dinner snack
Small portion eating with family
Bedtime milk/yoghurt
Whole day plan
```

Food filtering rules:

- Main meals show the full food builder.
- Dessert meals show mostly fruit/dairy.
- Snacks and tea show lighter foods.
- Bedtime milk/yoghurt shows yoghurt, fresh cow milk, and PediaSure milk only.
- Switching meal type should remove unsuitable selected ingredients.

## Meal Schedule

The app shows a suggested time frame when a meal type is selected.

Sleep anchors:

- Lunch nap: about 11:30 am-1:30 pm.
- Night sleep: about 8:45 pm-7:00 am.

Current schedule:

- Breakfast: 7:15-8:00 am.
- Dessert after breakfast: 8:15-8:45 am.
- Snack after breakfast / morning tea: 9:45-10:20 am.
- Lunch: 10:45-11:20 am.
- Dessert after lunch: 1:35-2:00 pm.
- Afternoon tea: 3:00-3:45 pm.
- Dinner: 5:30-6:15 pm.
- Small portion eating with family: 6:15-6:45 pm.
- After dinner snack: 7:00-7:30 pm.
- Bedtime milk/yoghurt: 7:45-8:15 pm.
- Whole day plan: 7:15 am-8:15 pm.

## Units And Nutrition

Important UX rule: no `cup` unit should appear anywhere.

Use item-specific units:

- Rice: grams, tbsp.
- Banana: banana, slice, grams.
- Milk: ml only.
- Egg: egg, grams.
- Oil/butter: tsp, tbsp, grams.
- Cheese/yoghurt: grams and suitable food-specific units.

The quantity grid has:

- Ingredient column.
- Suggested amount column, fixed by meal target.
- Adjusted amount column, user-editable.
- Calories column.

Calories should update when adjusted amount or unit changes.

## Saved Meal Records

Meal records are stored locally in:

```text
data/meal-records.json
```

This file is ignored by git. If `DATABASE_URL`, `POSTGRES_URL`, or `NEON_DATABASE_URL` is configured, meal records are stored in Neon Postgres instead.

Record requirements:

- `user` is always `"Dua"`.
- Save date, meal name, selected ingredients, adjusted amounts, total meal calories, completion percentage, and total consumed calories.
- `totalConsumedCalories = totalMealCalories * completionPercent / 100`.
- Daily meal tracking should alert/report if Breakfast, Lunch, Afternoon tea, or Dinner is missing.
- Do not allow duplicate saved records for the same date and meal name. If a same-day meal already exists, ask the user to edit/update the previous saved record instead of adding another.

Ways to inspect records:

- UI: **Report** button.
- Page: `/report`.
- API: `/api/meal-records`.
- Local file: `data/meal-records.json`.
- Neon dashboard when `DATABASE_URL` is configured.

Vercel caveat: local JSON storage is not persistent in production serverless. The current sustainable storage choice for meal records is Neon Postgres.

Neon table:

```sql
meal_records (
  id uuid primary key,
  user_name text default 'Dua',
  date date,
  meal_name text,
  completion_percent integer,
  total_meal_calories integer,
  total_consumed_calories integer,
  ingredients jsonb,
  created_at timestamptz
)
```

The table is created automatically on first read/save. To import local JSON records into Neon:

```bash
npm run import:meal-records
```

## Usage And Cost Tracking

Current usage tracking:

- Local development: `data/usage.json`.
- Vercel: in-memory fallback.

This is acceptable for development only. It is not enough for production hard budget enforcement.

Meal generation currently:

- Estimates cost before the AI call.
- Blocks if budget would be exceeded.
- Uses OpenAI `usage` tokens after the response when available.
- Sends fallback meal when OpenAI is unavailable or budget is reached.

Review meal currently:

- Calls OpenAI if available and under budget.
- Falls back to local numeric review on OpenAI failure or invalid response.

Important improvement:

- Add a persistent `UsageStore` implementation before public launch.
- Add budget checks to review and transcribe with projected costs.
- Add rate limiting to every AI endpoint.

## Security Notes

Potential attack: someone can call public API endpoints many times and run up Vercel/OpenAI usage.

Recommended before public sharing:

- Add app password/login because there is only one intended user.
- Add Vercel WAF rate limiting for `/api/*`.
- Add durable usage storage.
- Add rate limits to:
  - `/api/generate-meal`.
  - `/api/review-meal`.
  - `/api/transcribe`.
- Add transcription upload size and recording duration limits.
- Use a dedicated OpenAI Project and restrict allowed models.
- Set OpenAI alerts, but do not rely on OpenAI budget as a hard stop.

Best protection stack:

```text
App password + Vercel WAF + persistent budget store + endpoint rate limits + OpenAI project alerts
```

## Known Bug Lessons

### Empty API Response JSON Error

If the UI shows `Unexpected end of JSON input`, check for an API route returning an empty 500 response while the frontend calls `response.json()`.

Fix pattern:

- Use `safeParse` for Zod validation.
- Catch `request.json()` errors.
- Return JSON for every error path.
- On frontend, read `response.text()` and parse defensively if needed.

This was fixed for `/api/review-meal`.

### Ingredient Lookup

Do not match ingredients by display label only. Match by:

- key.
- display name.
- aliases.

This fixed the Full-fat yoghurt quantity/report issue.

### Next Generated Types

`npm run build` can change `next-env.d.ts` between `.next/dev/types/routes.d.ts` and `.next/types/routes.d.ts`. Treat this as generated noise unless the project intentionally updates it.

### AI Meal Entry (parse-meal)

The prompt bar is an AI assistant (`components/MealAssistant.tsx` + `/api/parse-meal`), not keyword matching. The parent speaks or types a whole meal description ("this morning she had one egg, 8 tbsp rice, half a banana, ate 80%") and the AI fills meal type, foods with amounts/units, record date, and completion percent. Key behaviors:

- The API gets the full ingredient catalog (keys, aliases, unit ids, defaults) in the system prompt and must return only valid keys/units; the route repairs invalid ones to defaults.
- Supports English and Vietnamese descriptions.
- If a food is ambiguous (plain "soup" vs beef/chicken/pork vege soup, Vietnamese "bo"), the AI asks ONE short clarifying question shown as a bubble above the prompt bar; the answer can be voice or text. Conversation history is kept client-side and replayed to the API.
- Unknown foods become custom items with estimated toddler-portion calories instead of triggering questions.
- If the description includes completion or a date, the save dialog auto-opens pre-filled so one tap saves the record.
- When the AI is unavailable (no key, over budget, error) the old client-side keyword matching (`applyFreeText` in `MealPlannerForm.tsx`) is used as fallback.
- Usage/cost is tracked through the same `usageStore` budget as review-meal.

### Voice Input

Voice input has two paths: browser speech recognition when available, and `/api/transcribe` with OpenAI as a fallback. Keep the UI visible even when unsupported, surface the API error message in the recorder, and remember that server transcription requires a non-empty `OPENAI_API_KEY`.

The voice control belongs inside the main chat/search-style prompt bar, next to the send/enter button. Keep clear listening, processing, completed, and error states with visible animation or status text.

If transcription reaches OpenAI but fails with `429 insufficient_quota`, the key is being accepted but the OpenAI project has no usable quota/credits or has hit a project limit. Show that clearly to the user instead of a generic transcription failure.

## UI Guidance

Keep the UI:

- Mobile-first.
- iPhone-friendly.
- Touch-friendly.
- Gentle pastel, but with readable contrast.
- Premium and trustworthy, not messy or overly childish.

Known preferences:

- Buttons should be readable with deeper plum text.
- Avoid pale text on pale backgrounds.
- Avoid gradient button backgrounds unless specifically requested.
- Ingredient chips should visibly light up/raise when selected.
- Ingredient visuals must match the actual food. Do not let known ingredients fall back to broad category icons; add a specific emoji or a small SVG in `public/food/` when no good emoji exists.
- Quail egg is a first-class protein food and should remain available with a quail egg unit, not just as generic egg.
- Unit buttons must be compact on phone.
- Voice input should stay in the main prompt bar beside the send/enter button.
- The old **Type foods** button/modal should stay removed; typed food entry belongs in the prompt bar.
- Hide the **Whole day** planning option from the main UI unless Alvin asks to bring it back.
- Keep **Tips** and **Calories Map** in the top menu beside **Report**.
- Saved meal records should be editable from the report, not only date-changeable.
- Food category headers should offer a quick way to clear selected foods nested inside that category.
- Main page should remain clean with selection on the left and editable quantities on the right for wider screens.

## Git Workflow

The user often asks "push to GitHub".

When pushing:

1. Run `git status -sb`.
2. Inspect the diff.
3. Stage only relevant files.
4. Commit with a short message.
5. Push to `origin main`.
6. Confirm the working tree is clean.

Do not stage `.env.local`, `data/usage.json`, or `data/meal-records.json`.

Known pushed commits:

```text
d23899d Initial TinyBite Planner app
cd8f061 Improve meal planner nutrition UI
46231c9 Refine mobile unit controls
d559058 Add meal record report storage
26ec534 Filter foods by meal type
e51137a Fix meal review fallback
```

## Browser Verification Notes

If browser automation through the in-app browser plugin fails because of Node version mismatch, use bundled Playwright from:

```text
C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe
```

Set:

```powershell
$env:NODE_PATH='C:\Users\user\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'
```

Then run a small Playwright script against:

```text
http://127.0.0.1:3000/
```

Useful UI checks:

- Breakfast shows full food categories.
- Dessert hides heavy proteins/vegetables/oil.
- Snack hides heavy dinner foods.
- Bedtime milk/yoghurt shows only milk/yoghurt choices.
- Review button returns a review and not a JSON parser error.
- Save meal record opens completion slider and saves to report.
