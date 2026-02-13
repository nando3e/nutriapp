import { db } from "@/db";
import { days } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";

export type DayRow = {
  date: string;
  closedAt: Date | null;
  snapshotKcalIn?: number | null;
  snapshotKcalOut?: number | null;
};

/**
 * Fetch day row for a user/date. Tolerates missing snapshot columns (e.g. before migration 0004).
 */
export async function getDayRow(
  userId: string,
  dateStr: string
): Promise<DayRow | null> {
  try {
    const rows = await db
      .select({
        date: days.date,
        closedAt: days.closedAt,
        snapshotKcalIn: days.snapshotKcalIn,
        snapshotKcalOut: days.snapshotKcalOut,
      })
      .from(days)
      .where(and(eq(days.userId, userId), eq(days.date, dateStr)))
      .limit(1);
    const r = rows[0];
    if (!r) return null;
    return {
      date: r.date,
      closedAt: r.closedAt,
      snapshotKcalIn: r.snapshotKcalIn ?? null,
      snapshotKcalOut: r.snapshotKcalOut ?? null,
    };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === "42703" || err?.message?.includes?.("snapshot_kcal")) {
      const rows = await db
        .select({ date: days.date, closedAt: days.closedAt })
        .from(days)
        .where(and(eq(days.userId, userId), eq(days.date, dateStr)))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      return {
        date: r.date,
        closedAt: r.closedAt,
        snapshotKcalIn: null,
        snapshotKcalOut: null,
      };
    }
    throw e;
  }
}

/**
 * Fetch days in range with snapshots. Tolerates missing snapshot columns.
 */
export async function getDaysInRange(
  userId: string,
  from: string,
  to: string
): Promise<DayRow[]> {
  try {
    const rows = await db
      .select({
        date: days.date,
        closedAt: days.closedAt,
        snapshotKcalIn: days.snapshotKcalIn,
        snapshotKcalOut: days.snapshotKcalOut,
      })
      .from(days)
      .where(
        and(
          eq(days.userId, userId),
          gte(days.date, from),
          lte(days.date, to)
        )
      );
    return rows as DayRow[];
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    if (err?.code === "42703" || err?.message?.includes?.("snapshot_kcal")) {
      const rows = await db
        .select({ date: days.date, closedAt: days.closedAt })
        .from(days)
        .where(
          and(
            eq(days.userId, userId),
            gte(days.date, from),
            lte(days.date, to)
          )
        );
      return rows.map((r) => ({
        date: r.date,
        closedAt: r.closedAt,
        snapshotKcalIn: null,
        snapshotKcalOut: null,
      }));
    }
    throw e;
  }
}
