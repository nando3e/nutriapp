import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { foodLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const patchSchema = z.object({
  quantityGrams: z.number().positive().optional().nullable(),
  quantityUnits: z.number().positive().optional().nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const data = patchSchema.parse(body);
    await db
      .update(foodLogs)
      .set({
        ...(data.quantityGrams !== undefined && { quantityGrams: data.quantityGrams }),
        ...(data.quantityUnits !== undefined && { quantityUnits: data.quantityUnits }),
      })
      .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, session.user.id)));
    const [log] = await db
      .select({ dayDate: foodLogs.dayDate })
      .from(foodLogs)
      .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, session.user.id)))
      .limit(1);
    if (log?.dayDate) {
      const { computeAndSaveDaySnapshot } = await import("@/lib/day-snapshot");
      await computeAndSaveDaySnapshot(session.user.id, log.dayDate);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  const [log] = await db
    .select({ dayDate: foodLogs.dayDate })
    .from(foodLogs)
    .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, session.user.id)))
    .limit(1);
  await db
    .delete(foodLogs)
    .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, session.user.id)));
  if (log?.dayDate) {
    const { computeAndSaveDaySnapshot } = await import("@/lib/day-snapshot");
    await computeAndSaveDaySnapshot(session.user.id, log.dayDate);
  }
  return NextResponse.json({ ok: true });
}
