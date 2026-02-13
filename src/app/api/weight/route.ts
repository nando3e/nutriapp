import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { weightLogs } from "@/db/schema";
import { computeAndSaveDaySnapshot } from "@/lib/day-snapshot";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  date: z.string(),
  weightKg: z.number(),
  waistCm: z.number().nullable().optional(),
  moment: z.enum(["start", "end"]).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { date, weightKg, waistCm, moment } = bodySchema.parse(body);
    const existing = await db
      .select()
      .from(weightLogs)
      .where(and(eq(weightLogs.userId, session.user.id), eq(weightLogs.date, date)))
      .limit(1);
    if (existing.length > 0) {
      await db
        .update(weightLogs)
        .set({
          weightKg,
          waistCm: waistCm ?? undefined,
          moment: moment ?? "start",
        })
        .where(eq(weightLogs.id, existing[0].id));
    } else {
      await db.insert(weightLogs).values({
        userId: session.user.id,
        date,
        weightKg,
        waistCm: waistCm ?? undefined,
        moment: (moment as "start" | "end") ?? "start",
      });
    }
    await computeAndSaveDaySnapshot(session.user.id, date);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
