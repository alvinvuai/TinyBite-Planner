type MealRecordIdentity = {
  id?: string;
  date: string;
  mealName: string;
};

export const requiredDailyMealNames = ["Breakfast", "Lunch", "Afternoon tea", "Dinner"] as const;

export function normalizeMealRecordName(mealName: string) {
  return mealName.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

export function findDuplicateMealRecord<T extends MealRecordIdentity>(
  records: T[],
  date: string,
  mealName: string,
  ignoreRecordId?: string,
) {
  const normalizedMealName = normalizeMealRecordName(mealName);
  return records.find(
    (record) =>
      record.date === date &&
      record.id !== ignoreRecordId &&
      normalizeMealRecordName(record.mealName) === normalizedMealName,
  );
}

export function getMissingRequiredMeals(records: MealRecordIdentity[], date: string) {
  const loggedMealNames = new Set(
    records
      .filter((record) => record.date === date)
      .map((record) => normalizeMealRecordName(record.mealName)),
  );

  return requiredDailyMealNames.filter((mealName) => !loggedMealNames.has(normalizeMealRecordName(mealName)));
}
