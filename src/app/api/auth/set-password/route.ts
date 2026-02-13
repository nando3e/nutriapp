import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificationTokens, users } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { hashPassword } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token, password } = bodySchema.parse(body);

    const [vt] = await db
      .select()
      .from(verificationTokens)
      .where(and(eq(verificationTokens.token, token), gt(verificationTokens.expiresAt, new Date())))
      .limit(1);

    if (!vt) {
      return NextResponse.json({ error: "Enlace caducado o no válido" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    await db
      .update(users)
      .set({
        passwordHash,
        emailVerifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.email, vt.email));
    await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

    return NextResponse.json({ message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.errors[0]?.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
