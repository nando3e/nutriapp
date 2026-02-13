import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { foodLogs } from "@/db/schema";
import { and, eq } from "drizzle-orm";

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
