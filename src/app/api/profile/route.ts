import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { profiles, weightLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().optional().nullable(),
  sex: z.enum(["male", "female"]).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  heightCm: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v))),
  targetWeightKg: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v))),
  targetDate: z.string().optional().nullable(),
  calorieGoal: z.union([z.number(), z.string()]).optional().transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v))),
  proteinGoal: z.union([z.number(), z.string()]).optional().transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v))),
  fatGoal: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v))),
  carbGoal: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v))),
  neatFactor: z.union([z.number(), z.string()]).optional().nullable().transform((v) => (v === "" || v === null || v === undefined ? undefined : Number(v))),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const [p] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  const [latestWeight] = await db
    .select({ weightKg: weightLogs.weightKg, date: weightLogs.date })
    .from(weightLogs)
    .where(eq(weightLogs.userId, session.user.id))
    .orderBy(desc(weightLogs.date))
    .limit(1);

  const out = p ? { ...p, latestWeightKg: latestWeight?.weightKg ?? null, latestWeightDate: latestWeight?.date ?? null } : null;
  return NextResponse.json(out);
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const data = updateSchema.parse(body);
    const [existing] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);
    const updatePayload: Record<string, unknown> = { updatedAt: new Date() };
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) updatePayload[k] = v === "" ? null : v;
    }
    if (existing) {
      await db
        .update(profiles)
        .set(updatePayload as typeof profiles.$inferInsert)
        .where(eq(profiles.id, existing.id));
    } else {
      const insertData: Record<string, unknown> = { userId: session.user.id };
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && v !== "") insertData[k] = v;
      }
      await db.insert(profiles).values(insertData as typeof profiles.$inferInsert);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
