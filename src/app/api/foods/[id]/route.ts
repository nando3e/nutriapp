import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { foods } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  kcalPer100g: z.number().optional(),
  proteinPer100g: z.number().optional(),
  fatPer100g: z.number().optional(),
  carbsPer100g: z.number().optional(),
  unitType: z.enum(["grams", "units"]).optional(),
  category: z.string().max(64).optional().nullable(),
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
    const data = updateSchema.parse(body);
    const [row] = await db
      .select()
      .from(foods)
      .where(and(eq(foods.id, id), eq(foods.userId, session.user.id)))
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    await db
      .update(foods)
      .set({
        ...(data.name != null && { name: data.name }),
        ...(data.kcalPer100g != null && { kcalPer100g: data.kcalPer100g }),
        ...(data.proteinPer100g != null && { proteinPer100g: data.proteinPer100g }),
        ...(data.fatPer100g != null && { fatPer100g: data.fatPer100g }),
        ...(data.carbsPer100g != null && { carbsPer100g: data.carbsPer100g }),
        ...(data.unitType != null && { unitType: data.unitType }),
        ...(data.category !== undefined && { category: data.category }),
      })
      .where(and(eq(foods.id, id), eq(foods.userId, session.user.id)));
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
  await db
    .delete(foods)
    .where(and(eq(foods.id, id), eq(foods.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
