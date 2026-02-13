import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { computeAndSaveDaySnapshot } from "@/lib/day-snapshot";
import { z } from "zod";

const bodySchema = z.object({
  date: z.string(),
  activityId: z.string().uuid().nullable(),
  durationMinutes: z.number().nullable(),
  manualKcal: z.number().nullable(),
  wahooCorrection: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const parsed = bodySchema.parse(body);
    await db.insert(activityLogs).values({
      userId: session.user.id,
      dayDate: parsed.date,
      activityId: parsed.activityId ?? undefined,
      durationMinutes: parsed.durationMinutes ?? undefined,
      manualKcal: parsed.manualKcal ?? undefined,
      wahooCorrection: parsed.wahooCorrection ?? false,
    });
    await computeAndSaveDaySnapshot(session.user.id, parsed.date);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
