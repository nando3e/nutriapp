import { db } from "@/db";
import {
  profiles,
  foodLogs,
  foods,
  activityLogs,
  activities,
  weightLogs,
  days,
} from "@/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";
import { mifflinStJeor, ageFromBirthDate } from "@/lib/tmb";

export type DaySnapshotResult = {
  kcalIn: number;
  kcalOut: number;
  /** TMB × NEAT para ese día (peso de ese día o último hasta entonces). Sin actividad. */
  tmbNeat: number;
  /** kcal de actividad ese día. */
  activityKcal: number;
};

/**
 * Computes kcal in and kcal out (TMB×NEAT + actividad) for a day and upserts the day row with snapshot.
 * Used so that past days are frozen and future weight/NEAT changes don't affect them.
 * Returns the saved values so callers can use them consistently.
 * TMB usa el peso de ese día (o el último registrado hasta esa fecha), no el promedio del periodo.
 */
export async function computeAndSaveDaySnapshot(
  userId: string,
  dateStr: string
): Promise<DaySnapshotResult> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const foodRows = await db
    .select({
      quantityGrams: foodLogs.quantityGrams,
      quantityUnits: foodLogs.quantityUnits,
      customKcal: foodLogs.customKcal,
      unitType: foods.unitType,
      kcalPer100g: foods.kcalPer100g,
    })
    .from(foodLogs)
    .leftJoin(foods, eq(foodLogs.foodId, foods.id))
    .where(
      and(
        eq(foodLogs.userId, userId),
        eq(foodLogs.dayDate, dateStr)
      )
    );

  const activityRows = await db
    .select({
      durationMinutes: activityLogs.durationMinutes,
      manualKcal: activityLogs.manualKcal,
      wahooCorrection: activityLogs.wahooCorrection,
      met: activities.met,
    })
    .from(activityLogs)
    .leftJoin(activities, eq(activityLogs.activityId, activities.id))
    .where(
      and(
        eq(activityLogs.userId, userId),
        eq(activityLogs.dayDate, dateStr)
      )
    );

  const [weightRow] = await db
    .select({ weightKg: weightLogs.weightKg })
    .from(weightLogs)
    .where(
      and(
        eq(weightLogs.userId, userId),
        eq(weightLogs.date, dateStr)
      )
    )
    .limit(1);

  const [latestWeight] = await db
    .select({ weightKg: weightLogs.weightKg })
    .from(weightLogs)
    .where(
      and(
        eq(weightLogs.userId, userId),
        lte(weightLogs.date, dateStr)
      )
    )
    .orderBy(desc(weightLogs.date))
    .limit(1);

  let totalKcalIn = 0;
  for (const row of foodRows) {
    if (row.customKcal != null) {
      totalKcalIn += row.customKcal;
    } else if (row.unitType === "grams") {
      totalKcalIn +=
        ((row.kcalPer100g ?? 0) * (row.quantityGrams ?? 0)) / 100;
    } else {
      totalKcalIn += (row.kcalPer100g ?? 0) * (row.quantityUnits ?? 0);
    }
  }

  const weightForTmb =
    weightRow?.weightKg ??
    latestWeight?.weightKg ??
    profile?.targetWeightKg ??
    70;
  let totalActivityKcal = 0;
  for (const a of activityRows) {
    if (a.manualKcal != null) {
      totalActivityKcal += a.wahooCorrection ? a.manualKcal * 0.8 : a.manualKcal;
    } else if (a.met != null && a.durationMinutes != null) {
      totalActivityKcal +=
        a.met * weightForTmb * (a.durationMinutes / 60);
    }
  }

  const heightCm = profile?.heightCm ?? 170;
  const age = ageFromBirthDate(profile?.birthDate ?? null);
  const sex = profile?.sex ?? "male";
  const tmbDaily =
    age != null && heightCm
      ? mifflinStJeor(weightForTmb, heightCm, age, sex)
      : 1600;
  const neatFactor =
    profile?.neatFactor != null && profile.neatFactor > 0
      ? Number(profile.neatFactor)
      : 1.15;
  const tmbNeat = Math.round(tmbDaily * neatFactor);
  const totalKcalOut = Math.round(tmbDaily * neatFactor + totalActivityKcal);

  const kcalIn = Math.round(totalKcalIn);

  const existing = await db
    .select({ date: days.date })
    .from(days)
    .where(
      and(eq(days.userId, userId), eq(days.date, dateStr))
    )
    .limit(1);

  try {
    if (existing.length > 0) {
      await db
        .update(days)
        .set({
          snapshotKcalIn: kcalIn,
          snapshotKcalOut: totalKcalOut,
          updatedAt: new Date(),
        })
        .where(
          and(eq(days.userId, userId), eq(days.date, dateStr))
        );
    } else {
      await db.insert(days).values({
        userId,
        date: dateStr,
        snapshotKcalIn: kcalIn,
        snapshotKcalOut: totalKcalOut,
      });
    }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === "42703" || err?.message?.includes?.("snapshot_kcal")) {
      // Snapshot columns not yet migrated; skip persist, return computed values
    } else {
      throw e;
    }
  }
  return { kcalIn, kcalOut: totalKcalOut, tmbNeat, activityKcal: totalActivityKcal };
}
