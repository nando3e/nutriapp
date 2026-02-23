import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { foods } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  kcalPer100g: z.number(),
  proteinPer100g: z.number().default(0),
  fatPer100g: z.number().default(0),
  carbsPer100g: z.number().default(0),
  unitType: z.enum(["grams", "units"]).default("grams"),
  category: z.string().max(64).optional().nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const list = await db
    .select()
    .from(foods)
    .where(eq(foods.userId, session.user.id))
    .orderBy(asc(foods.category), asc(foods.name));
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    await db.insert(foods).values({
      userId: session.user.id,
      name: data.name,
      kcalPer100g: data.kcalPer100g,
      proteinPer100g: data.proteinPer100g,
      fatPer100g: data.fatPer100g,
      carbsPer100g: data.carbsPer100g,
      unitType: data.unitType,
      category: data.category ?? null,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
