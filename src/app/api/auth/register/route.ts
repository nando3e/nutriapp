import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { users, verificationTokens } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = bodySchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await db.select().from(users).where(eq(users.email, normalizedEmail)).limit(1);
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con este email." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        passwordHash,
        role: "user",
        emailVerifiedAt: null,
      })
      .returning({ id: users.id, email: users.email });

    if (!user) {
      return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.insert(verificationTokens).values({
      email: normalizedEmail,
      token,
      expiresAt,
    });

    await sendVerificationEmail(normalizedEmail, token);

    return NextResponse.json({
      message: "Cuenta creada. Revisa tu email para verificar.",
      userId: user.id,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error en el registro" }, { status: 500 });
  }
}
