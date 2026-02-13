import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import {
  profiles,
  foodLogs,
  foods,
  activityLogs,
  activities,
  weightLogs,
} from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { mifflinStJeor, ageFromBirthDate } from "@/lib/tmb";
import { getDaysInRange } from "@/lib/days-query";
import { computeAndSaveDaySnapshot } from "@/lib/day-snapshot";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from || !to) {
    return NextResponse.json(
      { error: "from y to (YYYY-MM-DD) requeridos" },
      { status: 400 }
    );
  }

  const userId = session.user.id;

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  const foodEntries = await db
    .select({
      dayDate: foodLogs.dayDate,
      quantityGrams: foodLogs.quantityGrams,
      quantityUnits: foodLogs.quantityUnits,
      customKcal: foodLogs.customKcal,
      customProtein: foodLogs.customProtein,
      customFat: foodLogs.customFat,
      customCarbs: foodLogs.customCarbs,
      unitType: foods.unitType,
      kcalPer100g: foods.kcalPer100g,
      proteinPer100g: foods.proteinPer100g,
      fatPer100g: foods.fatPer100g,
      carbsPer100g: foods.carbsPer100g,
    })
    .from(foodLogs)
    .leftJoin(foods, eq(foodLogs.foodId, foods.id))
    .where(
      and(
        eq(foodLogs.userId, userId),
        gte(foodLogs.dayDate, from),
        lte(foodLogs.dayDate, to)
      )
    );

  const activityEntries = await db
    .select({
      dayDate: activityLogs.dayDate,
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
        gte(activityLogs.dayDate, from),
        lte(activityLogs.dayDate, to)
      )
    );

  const weightsInRange = await db
    .select({ date: weightLogs.date, weightKg: weightLogs.weightKg })
    .from(weightLogs)
    .where(
      and(
        eq(weightLogs.userId, userId),
        gte(weightLogs.date, from),
        lte(weightLogs.date, to)
      )
    );

  const daysInRange = await getDaysInRange(userId, from, to);
  const snapshotByDate: Record<string, { in: number; out: number }> = {};
  const closedDates = new Set<string>();
  for (const d of daysInRange) {
    if (d.closedAt) closedDates.add(d.date);
    // Solo usar snapshot si el día está cerrado; si no, recalcular para que coincida con el dashboard
    if (d.date && d.closedAt && d.snapshotKcalIn != null && d.snapshotKcalOut != null) {
      snapshotByDate[d.date] = { in: d.snapshotKcalIn, out: d.snapshotKcalOut };
    }
  }

  let totalKcalIn = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  for (const row of foodEntries) {
    if (row.customKcal != null) {
      totalKcalIn += row.customKcal;
      totalProtein += row.customProtein ?? 0;
      totalFat += row.customFat ?? 0;
      totalCarbs += row.customCarbs ?? 0;
    } else if (row.unitType === "grams") {
      const q = (row.quantityGrams ?? 0) / 100;
      totalKcalIn += (row.kcalPer100g ?? 0) * q;
      totalProtein += (row.proteinPer100g ?? 0) * q;
      totalFat += (row.fatPer100g ?? 0) * q;
      totalCarbs += (row.carbsPer100g ?? 0) * q;
    } else {
      const u = row.quantityUnits ?? 0;
      totalKcalIn += (row.kcalPer100g ?? 0) * u;
      totalProtein += (row.proteinPer100g ?? 0) * u;
      totalFat += (row.fatPer100g ?? 0) * u;
      totalCarbs += (row.carbsPer100g ?? 0) * u;
    }
  }

  const weightValues = weightsInRange
    .map((w) => w.weightKg)
    .filter((kg): kg is number => kg != null && kg > 0);
  const avgWeight =
    weightValues.length > 0
      ? weightValues.reduce((a, b) => a + b, 0) / weightValues.length
      : null;

  const heightCm = profile?.heightCm ?? 170;
  const birthDate = profile?.birthDate ?? null;
  const age = ageFromBirthDate(birthDate);
  const sex = profile?.sex ?? "male";
  const weightForTmb = avgWeight ?? 70;

  const tmbDaily =
    age != null && heightCm
      ? mifflinStJeor(weightForTmb, heightCm, age, sex)
      : 1600;
  const neatFactor = profile?.neatFactor != null && profile.neatFactor > 0 ? Number(profile.neatFactor) : 1.15;
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const daysCount = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)) + 1);
  const totalTmb = tmbDaily * daysCount;
  const totalTmbNeat = totalTmb * neatFactor;

  let totalActivityKcal = 0;
  for (const a of activityEntries) {
    if (a.manualKcal != null) {
      totalActivityKcal += a.wahooCorrection ? a.manualKcal * 0.8 : a.manualKcal;
    } else if (a.met != null && a.durationMinutes != null) {
      totalActivityKcal += a.met * weightForTmb * (a.durationMinutes / 60);
    }
  }

  const totalKcalOut = totalTmbNeat + totalActivityKcal;
  const balance = totalKcalIn - totalKcalOut;

  const totalMacroG = totalProtein + totalFat + totalCarbs;
  const proportions =
    totalMacroG > 0
      ? {
          protein: Math.round((totalProtein / totalMacroG) * 100),
          fat: Math.round((totalFat / totalMacroG) * 100),
          carbs: Math.round((totalCarbs / totalMacroG) * 100),
        }
      : { protein: 0, fat: 0, carbs: 0 };

  // Detalle por día: ingerido y gastado (TMB + actividad) por cada fecha en el rango
  const kcalByDay: Record<string, number> = {};
  const activityByDay: Record<string, number> = {};
  for (const row of foodEntries) {
    const d = row.dayDate;
    if (!d) continue;
    let k = 0;
    if (row.customKcal != null) {
      k = row.customKcal;
    } else if (row.unitType === "grams") {
      k = ((row.kcalPer100g ?? 0) * (row.quantityGrams ?? 0)) / 100;
    } else {
      k = (row.kcalPer100g ?? 0) * (row.quantityUnits ?? 0);
    }
    kcalByDay[d] = (kcalByDay[d] ?? 0) + k;
  }
  for (const a of activityEntries) {
    const d = a.dayDate;
    if (!d) continue;
    let k = 0;
    if (a.manualKcal != null) {
      k = a.wahooCorrection ? a.manualKcal * 0.8 : a.manualKcal;
    } else if (a.met != null && a.durationMinutes != null) {
      k = a.met * weightForTmb * (a.durationMinutes / 60);
    }
    activityByDay[d] = (activityByDay[d] ?? 0) + k;
  }

  const datesWithLogs = new Set<string>();
  for (const row of foodEntries) {
    if (row.dayDate) datesWithLogs.add(row.dayDate);
  }
  for (const a of activityEntries) {
    if (a.dayDate) datesWithLogs.add(a.dayDate);
  }
  for (const w of weightsInRange) {
    if (w.date) datesWithLogs.add(w.date);
  }
  const hasData = (dateStr: string) =>
    datesWithLogs.has(dateStr) || closedDates.has(dateStr);

  const tmbRounded = Math.round(tmbDaily * neatFactor);
  const byDay: {
    date: string;
    hasData: boolean;
    kcalIn?: number;
    kcalOut?: number;
    balance?: number;
    /** TMB×NEAT ese día (peso de ese día). Solo si se calculó, no si viene de snapshot. */
    tmbNeat?: number;
    /** Actividad ese día. Solo si se calculó. */
    activityKcal?: number;
  }[] = [];
  const fromTime = fromDate.getTime();
  const toTime = toDate.getTime();
  const oneDay = 24 * 60 * 60 * 1000;
  for (let t = fromTime; t <= toTime; t += oneDay) {
    const dateStr = new Date(t).toISOString().slice(0, 10);
    if (!hasData(dateStr)) {
      byDay.push({ date: dateStr, hasData: false });
      continue;
    }
    const snap = snapshotByDate[dateStr];
    let kcalIn: number;
    let kcalOut: number;
    let tmbNeat: number | undefined;
    let activityKcal: number | undefined;
    if (snap) {
      kcalIn = snap.in;
      kcalOut = snap.out;
    } else {
      const saved = await computeAndSaveDaySnapshot(userId, dateStr);
      kcalIn = saved.kcalIn;
      kcalOut = saved.kcalOut;
      tmbNeat = saved.tmbNeat;
      activityKcal = saved.activityKcal;
    }
    const dayBalance = Math.round(kcalIn - kcalOut);
    byDay.push({
      date: dateStr,
      hasData: true,
      kcalIn,
      kcalOut,
      balance: dayBalance,
      tmbNeat,
      activityKcal,
    });
  }

  const withData = byDay.filter((r) => r.hasData && r.kcalIn != null && r.kcalOut != null);
  const totalKcalInFromByDay = withData.reduce((s, r) => s + (r.kcalIn ?? 0), 0);
  const totalKcalOutFromByDay = withData.reduce((s, r) => s + (r.kcalOut ?? 0), 0);
  const balanceFromByDay = Math.round(totalKcalInFromByDay - totalKcalOutFromByDay);

  return NextResponse.json({
    from,
    to,
    daysCount,
    totalKcalIn: totalKcalInFromByDay,
    totalKcalOut: totalKcalOutFromByDay,
    totalTmb: Math.round(totalTmb),
    totalTmbNeat: Math.round(totalTmbNeat),
    totalActivityKcal: Math.round(totalActivityKcal),
    balance: balanceFromByDay,
    totalProtein: Math.round(totalProtein),
    totalFat: Math.round(totalFat),
    totalCarbs: Math.round(totalCarbs),
    proportions,
    tmbDaily: Math.round(tmbDaily),
    byDay,
  });
}
