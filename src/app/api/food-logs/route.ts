import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/db";
import { foodLogs } from "@/db/schema";
import { computeAndSaveDaySnapshot } from "@/lib/day-snapshot";
import { z } from "zod";

const MEALS = ["desayuno", "media_manana", "comida", "merienda", "cena", "extra"] as const;

const bodySchemaWithFood = z.object({
  date: z.string(),
  foodId: z.string().uuid(),
  quantityGrams: z.number().nullable(),
  quantityUnits: z.number().nullable(),
  meal: z.enum(MEALS).optional(),
});

const customSchema = z.object({
  name: z.string().min(1, "Nombre obligatorio"),
  kcal: z.number().min(0),
  protein: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
});

const bodySchemaWithCustom = z.object({
  date: z.string(),
  meal: z.enum(MEALS).optional(),
  custom: customSchema,
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const body = await req.json();

    if (body.custom != null) {
      const parsed = bodySchemaWithCustom.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
      }
      const { date, meal, custom } = parsed.data;
      await db.insert(foodLogs).values({
        userId: session.user.id,
        dayDate: date,
        meal: meal ?? "comida",
        customName: custom.name,
        customKcal: custom.kcal,
        customProtein: custom.protein ?? null,
        customFat: custom.fat ?? null,
        customCarbs: custom.carbs ?? null,
      });
      await computeAndSaveDaySnapshot(session.user.id, date);
      return NextResponse.json({ ok: true });
    }

    const parsed = bodySchemaWithFood.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Datos inválidos" }, { status: 400 });
    }
    const { date, foodId, quantityGrams, quantityUnits, meal } = parsed.data;
    if (quantityGrams == null && quantityUnits == null) {
      return NextResponse.json(
        { error: "Indica cantidad en gramos o unidades" },
        { status: 400 }
      );
    }
    await db.insert(foodLogs).values({
      userId: session.user.id,
      dayDate: date,
      foodId,
      quantityGrams: quantityGrams ?? undefined,
      quantityUnits: quantityUnits ?? undefined,
      meal: meal ?? "comida",
    });
    await computeAndSaveDaySnapshot(session.user.id, date);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
