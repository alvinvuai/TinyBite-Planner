import Link from "next/link";
import { getMealRecordStore, getMealRecordStoreName } from "@/lib/mealRecordStore";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const records = await getMealRecordStore().list();
  const storageName = getMealRecordStoreName();
  const totalConsumed = records.reduce((sum, record) => sum + record.totalConsumedCalories, 0);
  const today = new Date().toLocaleDateString("en-CA");
  const todayRecords = records.filter((record) => record.date === today);
  const todayConsumed = todayRecords.reduce((sum, record) => sum + record.totalConsumedCalories, 0);

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#fff9fc_0%,#fff0e2_48%,#f3ecff_100%)] px-4 py-6 text-[#47243d]">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#9c456c]">Dua database</p>
            <h1 className="brand-title mt-1 text-4xl font-black text-[#633d55]">Meal records</h1>
          </div>
          <Link className="pressable rounded-full border border-[#e7ccd9] bg-[#fffafd] px-5 py-3 text-sm font-black text-[#5e3752] shadow-sm" href="/">
            Back to planner
          </Link>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric label="Records" value={records.length.toString()} />
          <Metric label="Today consumed" value={`${todayConsumed} kcal`} />
          <Metric label="All consumed" value={`${totalConsumed} kcal`} />
        </section>

        <section className="soft-card overflow-hidden">
          <div className="border-b border-[#ead8e2] p-4">
            <p className="text-sm font-black text-[#633d55]">Saved meals for user Dua</p>
            <p className="mt-1 text-xs font-semibold text-[#765066]">
              This report reads from {storageName}. Neon is used automatically when DATABASE_URL is configured.
            </p>
          </div>

          {records.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-[#fff8fb] text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Meal</th>
                    <th className="px-4 py-3">Completion</th>
                    <th className="px-4 py-3">Meal kcal</th>
                    <th className="px-4 py-3">Consumed kcal</th>
                    <th className="px-4 py-3">Adjusted ingredients</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0dce7]">
                  {records.map((record) => (
                    <tr key={record.id} className="align-top">
                      <td className="px-4 py-3 font-bold text-[#633d55]">{record.date}</td>
                      <td className="px-4 py-3 font-bold text-[#633d55]">{record.mealName}</td>
                      <td className="px-4 py-3">{record.completionPercent}%</td>
                      <td className="px-4 py-3">{record.totalMealCalories}</td>
                      <td className="px-4 py-3 font-black text-[#8a5422]">{record.totalConsumedCalories}</td>
                      <td className="px-4 py-3">
                        <ul className="space-y-1">
                          {record.ingredients.map((ingredient) => (
                            <li key={`${record.id}-${ingredient.ingredientKey}`} className="text-[#765066]">
                              <span className="font-black text-[#633d55]">{ingredient.name}</span>: {ingredient.amount} {ingredient.unit},{" "}
                              {ingredient.calories} kcal
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 text-sm font-semibold leading-6 text-[#765066]">
              No saved meal records yet. Save a meal from the planner and it will appear here.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="soft-card p-4">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#9c456c]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[#633d55]">{value}</p>
    </div>
  );
}
