import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { days } from "@/db/schema";
import { computeAndSaveDaySnapshot } from "@/lib/day-snapshot";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  date: z.string(),
  close: z.boolean(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { date, close } = bodySchema.parse(body);
    if (close) {
      await computeAndSaveDaySnapshot(session.user.id, date);
      const existing = await db
        .select()
        .from(days)
        .where(and(eq(days.userId, session.user.id), eq(days.date, date)))
        .limit(1);
      const now = new Date();
      if (existing.length > 0) {
        await db
          .update(days)
          .set({ closedAt: now, updatedAt: now })
          .where(and(eq(days.userId, session.user.id), eq(days.date, date)));
      } else {
        await db.insert(days).values({
          userId: session.user.id,
          date,
          closedAt: now,
        });
      }
    } else {
      await db
        .update(days)
        .set({ closedAt: null, updatedAt: new Date() })
        .where(and(eq(days.userId, session.user.id), eq(days.date, date)));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
