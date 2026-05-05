# First Deployment Notes

Project: **Dua Beo / Dưa Béo**  
Repository: `https://github.com/alvinvuai/TinyBite-Planner.git`  
Framework: Next.js App Router, TypeScript, React, Tailwind CSS, Zod, OpenAI Node SDK  
Primary deployment target: Vercel

## Product Summary

This app started as **TinyBite Planner**, a mobile-first toddler meal planning app for a 19.5-month-old child around 8.8-9.0 kg with low weight and slow weight gain. The current app title is **Dưa Béo** and should stay that way unless the user explicitly asks otherwise.

The purpose is to help a parent quickly select available foods, see suggested toddler-sized portions, adjust the offered quantities, estimate calories and nutrients, save meal records, and optionally ask AI for a short review of the meal.

The app is intentionally gentle, parent-friendly, and practical. It should avoid pressure-based feeding advice, avoid using fruit or milk as a rescue reward, and encourage professional review if poor weight gain continues.

## Important Child Context

- Age: 19.5 months.
- Weight: around 8.8-9.0 kg.
- Low weight and little/no gain for about 3 months.
- Loves finger food.
- Likes white rice.
- Does not like congee.
- Avoid noodles for now.
- Often refuses meat/protein.
- May reject rice if protein is mixed into or stuck to rice.
- Fruit should not become a rescue reward after refusing main food.
- Meals should stay calm, predictable, and not pressured.
- If she eats her meal and asks for more, normal dinner food is allowed on her own plate.
- If she refuses and waits for family food, offer only a small planned top-up plate.

## Main Features Built

- Mobile-first Next.js app optimized for iPhone browser use.
- Pastel, baby-friendly visual design with soft pink, peach, cream, and lavender.
- CSS/SVG baby mascot, floating decorations, gentle animation, sparkle/loading details.
- Mode selector:
  - Single meal.
  - Whole day.
- Meal type list:
  - Breakfast.
  - Dessert after breakfast.
  - Snack after breakfast / morning tea.
  - Lunch.
  - Dessert after lunch.
  - Afternoon tea.
  - Dinner.
  - After dinner snack.
  - Small portion eating with family.
  - Bedtime milk/yoghurt.
  - Whole day plan.
- Categorized ingredient chips by nutrition group.
- Ingredient quantities with:
  - Fixed suggested amount column.
  - Adjustable amount column.
  - Calories column.
  - Unit selector.
  - Slider for fast adjustment.
  - Automatic calorie recalculation.
- No `cup` unit is used. Tablespoons and grams are preferred where appropriate.
- Food-specific measurement units:
  - Banana uses banana, slices, and grams.
  - Milk uses ml.
  - Egg uses egg and grams.
  - Oil/butter use tsp/tbsp/grams where relevant.
- PediaSure milk and fresh cow milk are separate items with different calorie assumptions.
- Suggested meal ideas are available behind a toggle/button and recipe details show only when selected.
- Optional text input is behind a button/modal.
- Voice button uses a microphone icon and is positioned at the far top-left.
- Settings panel stores child profile in `localStorage`.
- Report page for saved meal records.
- Meal record saving with estimated completion percentage.
- Review meal button calls AI when configured, otherwise local fallback.
- Suggested time frame shown for the selected meal, based on the child's nap and night sleep routine.

## Meal Timing Schedule

The child's usual sleep windows are:

- Lunch nap: about 11:30 am-1:30 pm.
- Night sleep: about 8:45 pm-7:00 am.

Suggested meal windows in the app:

- Breakfast: 7:15-8:00 am.
- Dessert after breakfast: 8:15-8:45 am.
- Snack after breakfast / morning tea: 9:45-10:20 am.
- Lunch: 10:45-11:20 am, before the lunch nap.
- Dessert after lunch: 1:35-2:00 pm, after waking from the lunch nap.
- Afternoon tea: 3:00-3:45 pm.
- Dinner: 5:30-6:15 pm.
- Small portion eating with family: 6:15-6:45 pm.
- After dinner snack: 7:00-7:30 pm.
- Bedtime milk/yoghurt: 7:45-8:15 pm, before the 8:45 pm bedtime.
- Whole day plan: 7:15 am-8:15 pm, built around the nap and night sleep.

## Food Selection Logic

Available foods are filtered by meal type to reduce mistakes:

- Main meals show the fuller builder: carb, protein/iron, dairy, fat, fruit, vegetable/fibre, treat.
- Main meal types:
  - Breakfast.
  - Lunch.
  - Dinner.
  - Small portion eating with family.
  - Whole day plan.
- Dessert meal types show mostly dairy and fruit.
- Snack/tea/after-dinner snacks show lighter foods such as yoghurt, cheese, milk, fruit, avocado, bread, and biscuit.
- Bedtime milk/yoghurt shows only yoghurt, fresh cow milk, and PediaSure milk.
- When switching meal type, ingredients that are no longer suitable are removed from the selected list and quantity table.

## AI Behavior

OpenAI is optional. The app still works without an API key through local rule-based fallback.

AI is used for:

- `/api/generate-meal`: structured meal ideas.
- `/api/review-meal`: short numeric meal review.
- `/api/transcribe`: optional voice-to-text.

All OpenAI calls are server-side. The API key is never exposed to the browser.

AI prompts should remain compact and should ask for strict JSON where possible. The app validates AI JSON using Zod.

AI should:

- Avoid medical diagnosis.
- Avoid promising guaranteed weight gain.
- Mention GP/paediatrician/dietitian review if poor weight gain continues.
- Prefer finger foods.
- Avoid noodles and congee by default.
- Keep rice safe but avoid unlimited plain rice advice.
- Keep protein separate if the child rejects mixed food.
- Use small toddler portions.
- Keep fruit planned and portioned.
- Keep milk/formula scheduled, not a rescue food.
- Mention choking safety for grapes, nuts, and hard foods.
- Require grapes to be quartered lengthwise.
- Mention nut butter/tahini only thinly spread or mixed, never thick spoonfuls.
- Keep salt low.

## Environment Variables

Use `.env.local` for local development only. It is ignored by git and should not be pushed.

For Vercel, add environment variables in the Vercel project dashboard, not by relying on `.env.local`.

Required or supported variables:

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
```

Notes:

- `OPENAI_API_KEY` is required only for AI generation and voice transcription.
- Without `OPENAI_API_KEY`, the app should use local fallback meal/review rules.
- `OPENAI_MEAL_MODEL` is configurable. The app was designed to use a cheap capable model.
- `OPENAI_TRANSCRIBE_MODEL` is configurable.
- Pricing variables should be copied from the current OpenAI pricing page and not hardcoded forever.
- `MONTHLY_BUDGET_USD` can be set to `2` or `10` depending on the desired app-side hard cap.
- `ADMIN_SECRET` protects `/api/usage`.
- `RESEND_API_KEY` is only for optional email notifications through Resend.

## OpenAI Budget And Token Controls

OpenAI project budgets are useful but should be treated as soft alert thresholds. OpenAI documentation says project monthly budgets alert but do not enforce a hard spending cap. Requests may continue after the budget is exceeded.

The app must enforce its own hard budget by checking usage before making OpenAI calls.

Current app-side controls:

- Estimate projected request cost before meal generation.
- Track actual token usage from OpenAI responses when available.
- Block meal generation if `MONTHLY_BUDGET_USD` would be exceeded.
- Return a fallback meal if budget is reached.
- Use `max_completion_tokens`:
  - Single meal around 650.
  - Whole day around 1500.
  - Review around 500.

Important: on Vercel, the current usage store is in memory, so it is not reliable across serverless instances. For real production budget protection, replace it with persistent storage such as Upstash Redis, Vercel KV, Supabase, Neon/Postgres, or another durable store.

## Attack And Abuse Protection Notes

If someone attacks the public site with many API requests, possible problems include:

- Vercel function usage increases.
- OpenAI token/audio costs increase.
- App becomes slow or unavailable.

Existing protections:

- API key is server-side only.
- `/api/generate-meal` has basic in-memory IP rate limiting.
- Meal generation checks estimated budget before calling OpenAI.
- AI output token count is capped.
- Fallback logic avoids OpenAI when the key is missing or budget is reached.

Recommended before public sharing:

- Add a simple app password/login because there is only one real user.
- Add Vercel WAF rate limiting for `/api/*`.
- Add persistent budget storage.
- Add rate limiting to `/api/review-meal` and `/api/transcribe`.
- Add audio upload size/duration limits.
- Use a dedicated OpenAI Project for this app.
- Restrict the OpenAI Project to only the needed models.
- Set OpenAI budget alerts at small thresholds such as `$1` and `$2`.
- Use Vercel Attack Challenge Mode if under active attack.

Best practical protection stack:

```text
App password + Vercel WAF + persistent budget store + endpoint rate limits + OpenAI project alerts
```

## Database / Records

The meal record feature currently uses a local JSON file:

```text
data/meal-records.json
```

This file is ignored by git.

Saved record fields include:

- `user`: always `"Dua"`.
- `date`: defaults to today's date.
- `mealName`: selected meal type, such as Breakfast.
- `completionPercent`: parent's estimate of how much was eaten.
- `ingredients`: selected ingredients and adjusted amounts.
- `totalMealCalories`: total offered calories.
- `totalConsumedCalories`: `completionPercent * totalMealCalories`.

Ways to check records:

- In the app: click **Report**.
- Browser path: `/report`.
- API: `/api/meal-records`.
- Local file: `data/meal-records.json`.

Important Vercel caveat: local JSON storage is not persistent in serverless production. Use Supabase, Neon/Postgres, Vercel KV, or Upstash Redis for real production records.

## Key Bug Fixes And Lessons

### Next.js Icon Bottom-Left

The bottom-left Next.js development indicator was removed from the app view.

### Title Changes

The app title changed from TinyBite Planner to **Dưa Béo**. A later temporary title change to `Mẹ Mai ơi! Nhanh nhanh ...` was reverted. Current desired title is **Dưa Béo**.

Vietnamese title rendering uses a font appropriate for Vietnamese text.

### Button Readability

The color palette was improved because some buttons had poor contrast. Avoid pale text on pale pink backgrounds. Prefer deeper plum text on light pastel surfaces.

### Voice Button

The voice/mic button was moved out of the control cluster and placed as a floating top-left button. The icon was centered in the circular boundary.

### Unit Buttons

On phone, unit buttons were too large. They were made more compact. `cup` was removed from all item unit choices.

### Full-Fat Yoghurt Bug

Full-fat yoghurt did not show quantity/report correctly. The issue was ingredient matching: lookup logic did not reliably match display names, keys, and aliases. The fix made ingredient lookup accept display name, key, and aliases.

### Review JSON Error

Clicking **Review this meal for my kid** showed `Unexpected end of JSON input`.

Cause:

- `/api/review-meal` could throw and return an empty 500 response.
- The frontend called `result.json()` unconditionally.
- Parsing an empty response caused the JSON error.

Fix:

- API now catches bad JSON, validation errors, OpenAI failures, empty AI responses, and invalid AI JSON.
- API returns JSON for errors.
- API falls back to local numeric review if OpenAI fails.
- Frontend reads response text and parses defensively.

## GitHub History

Known pushed commits:

- `d23899d` Initial TinyBite Planner app.
- `cd8f061` Improve meal planner nutrition UI.
- `46231c9` Refine mobile unit controls.
- `d559058` Add meal record report storage.
- `26ec534` Filter foods by meal type.
- `e51137a` Fix meal review fallback.

Current branch:

```bash
main
```

Remote:

```bash
https://github.com/alvinvuai/TinyBite-Planner.git
```

## Deployment Checklist

1. Push latest code to GitHub.
2. Import the repository in Vercel.
3. Set environment variables in Vercel.
4. Do not upload `.env.local` to GitHub.
5. Set `OPENAI_API_KEY` in Vercel only when AI is desired.
6. Set `MONTHLY_BUDGET_USD`.
7. Set `OPENAI_INPUT_PRICE_PER_1M` and `OPENAI_OUTPUT_PRICE_PER_1M`.
8. Set `ADMIN_SECRET`.
9. Deploy.
10. Test:
    - Home page loads on iPhone viewport.
    - Meal type filtering works.
    - Ingredient selection creates quantities.
    - Unit conversion works.
    - Review button returns either AI or fallback review.
    - Save meal record works.
    - `/report` shows saved record.
    - `/api/usage` requires admin secret.

## Useful Commands

```bash
npm install
npm run dev
npm run lint
npm run build
git status -sb
git push origin main
```

Local app URL:

```text
http://127.0.0.1:3000/
```

## Future Improvements

- Add app password/login before public use.
- Add Vercel WAF rate limiting.
- Add durable storage for usage and meal records.
- Add rate limiting to all AI endpoints.
- Add strict voice upload size and duration limits.
- Add persistent charts for weekly/monthly food intake.
- Add exportable reports for GP/paediatrician/dietitian visits.
- Add better nutrition database values from verified food labels and local Australian food data.
- Add multi-day trends: average calories offered, average calories eaten, protein exposure count, fruit count, milk count.
- Add backup/restore for meal records.
