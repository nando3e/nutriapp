import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { profiles, foodLogs, foods, activityLogs, activities, weightLogs } from "@/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { mifflinStJeor, ageFromBirthDate } from "@/lib/tmb";
import { getDayRow } from "@/lib/days-query";
import { computeAndSaveDaySnapshot } from "@/lib/day-snapshot";
import { DayView } from "@/components/DayView";
import { CalendarLink } from "@/components/CalendarLink";
import { HoyTabs } from "@/components/HoyTabs";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const params = await searchParams;
  const dateParam = params.date;
  const viewParam =
    params.view === "actividad"
      ? "actividad"
      : params.view === "mediciones"
        ? "mediciones"
        : "comidas";
  const day = dateParam ? startOfDay(new Date(dateParam)) : new Date();
  const dateStr = format(day, "yyyy-MM-dd");
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isPastDay = dateStr < todayStr;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  const dayRow = await getDayRow(session.user.id, dateStr);

  const logs = await db
    .select({
      id: foodLogs.id,
      dayDate: foodLogs.dayDate,
      quantityGrams: foodLogs.quantityGrams,
      quantityUnits: foodLogs.quantityUnits,
      foodId: foodLogs.foodId,
      meal: foodLogs.meal,
      customName: foodLogs.customName,
      customKcal: foodLogs.customKcal,
      customProtein: foodLogs.customProtein,
      customFat: foodLogs.customFat,
      customCarbs: foodLogs.customCarbs,
      name: foods.name,
      kcalPer100g: foods.kcalPer100g,
      proteinPer100g: foods.proteinPer100g,
      fatPer100g: foods.fatPer100g,
      carbsPer100g: foods.carbsPer100g,
      unitType: foods.unitType,
    })
    .from(foodLogs)
    .leftJoin(foods, eq(foodLogs.foodId, foods.id))
    .where(and(eq(foodLogs.userId, session.user.id), eq(foodLogs.dayDate, dateStr)));

  const activityEntries = await db
    .select({
      id: activityLogs.id,
      activityId: activityLogs.activityId,
      durationMinutes: activityLogs.durationMinutes,
      manualKcal: activityLogs.manualKcal,
      wahooCorrection: activityLogs.wahooCorrection,
      name: activities.name,
      met: activities.met,
    })
    .from(activityLogs)
    .leftJoin(activities, eq(activityLogs.activityId, activities.id))
    .where(and(eq(activityLogs.userId, session.user.id), eq(activityLogs.dayDate, dateStr)));

  const [weightRow] = await db
    .select()
    .from(weightLogs)
    .where(and(eq(weightLogs.userId, session.user.id), eq(weightLogs.date, dateStr)))
    .limit(1);

  const [latestWeightUpTo] = await db
    .select({ weightKg: weightLogs.weightKg })
    .from(weightLogs)
    .where(and(eq(weightLogs.userId, session.user.id), lte(weightLogs.date, dateStr)))
    .orderBy(desc(weightLogs.date))
    .limit(1);

  const weightForTmb = weightRow?.weightKg ?? latestWeightUpTo?.weightKg ?? profile?.targetWeightKg ?? 70;
  const heightCm = profile?.heightCm ?? 170;
  const age = ageFromBirthDate(profile?.birthDate ?? null);
  const sex = profile?.sex ?? "male";
  const tmbDaily =
    age != null && heightCm
      ? mifflinStJeor(weightForTmb, heightCm, age, sex)
      : 1600;
  const neatFactor = profile?.neatFactor != null && profile.neatFactor > 0 ? Number(profile.neatFactor) : 1.15;

  const calorieGoal = profile?.calorieGoal ?? 1700;
  const proteinGoal = profile?.proteinGoal ?? 180;

  let totalKcal = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  for (const log of logs) {
    if (log.customKcal != null) {
      totalKcal += log.customKcal;
      totalProtein += log.customProtein ?? 0;
      totalFat += log.customFat ?? 0;
      totalCarbs += log.customCarbs ?? 0;
    } else if (log.unitType === "grams") {
      const q = (log.quantityGrams ?? 0) / 100;
      totalKcal += (log.kcalPer100g ?? 0) * q;
      totalProtein += (log.proteinPer100g ?? 0) * q;
      totalFat += (log.fatPer100g ?? 0) * q;
      totalCarbs += (log.carbsPer100g ?? 0) * q;
    } else {
      const u = log.quantityUnits ?? 0;
      totalKcal += (log.kcalPer100g ?? 0) * u;
      totalProtein += (log.proteinPer100g ?? 0) * u;
      totalFat += (log.fatPer100g ?? 0) * u;
      totalCarbs += (log.carbsPer100g ?? 0) * u;
    }
  }

  let totalActivityKcal = 0;
  const weightKg = weightRow?.weightKg ?? latestWeightUpTo?.weightKg ?? profile?.targetWeightKg ?? 70;
  for (const a of activityEntries) {
    if (a.manualKcal != null) {
      totalActivityKcal += a.wahooCorrection ? a.manualKcal * 0.8 : a.manualKcal;
    } else if (a.met != null && a.durationMinutes != null) {
      totalActivityKcal += a.met * weightKg * (a.durationMinutes / 60);
    }
  }

  let displayKcal = Math.round(totalKcal);
  let displayExpenditure = Math.round(tmbDaily * neatFactor + totalActivityKcal);

  if (isPastDay && dayRow?.snapshotKcalIn != null && dayRow?.snapshotKcalOut != null) {
    displayKcal = dayRow.snapshotKcalIn;
    displayExpenditure = dayRow.snapshotKcalOut;
  } else if (isPastDay) {
    await computeAndSaveDaySnapshot(session.user.id, dateStr);
    displayKcal = Math.round(totalKcal);
    displayExpenditure = Math.round(tmbDaily * neatFactor + totalActivityKcal);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight truncate min-w-0">
          {dateParam ? format(day, "EEEE d MMMM yyyy", { locale: es }) : "Hoy"}
        </h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center min-w-0">
          <CalendarLink currentDate={dateStr} />
          <HoyTabs dateStr={dateStr} view={viewParam} />
        </div>
      </div>

      <DayView
        mode={viewParam}
        dateStr={dateStr}
        isClosed={!!dayRow?.closedAt}
        totalKcal={displayKcal}
        totalProtein={Math.round(totalProtein)}
        totalFat={Math.round(totalFat)}
        totalCarbs={Math.round(totalCarbs)}
        calorieGoal={calorieGoal}
        proteinGoal={proteinGoal}
        fatGoal={profile?.fatGoal ?? undefined}
        carbGoal={profile?.carbGoal ?? undefined}
        activityKcal={Math.round(totalActivityKcal)}
        dailyExpenditure={displayExpenditure}
        weightKg={weightRow?.weightKg}
        waistCm={weightRow?.waistCm}
        weightMoment={weightRow?.moment ?? undefined}
        foodLogs={logs}
        activityLogs={activityEntries}
        targetWeightKg={profile?.targetWeightKg ?? undefined}
        targetDate={profile?.targetDate ?? undefined}
        userId={session.user.id}
      />
    </div>
  );
}
