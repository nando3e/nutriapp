import { NextResponse } from "next/server";
import { db } from "@/db";
import { verificationTokens, users } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login?error=InvalidToken", req.url));
  }

  const [vt] = await db
    .select()
    .from(verificationTokens)
    .where(and(eq(verificationTokens.token, token), gt(verificationTokens.expiresAt, new Date())))
    .limit(1);

  if (!vt) {
    return NextResponse.redirect(new URL("/login?error=TokenExpired", req.url));
  }

  await db
    .update(users)
    .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.email, vt.email));
  await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

  const base = process.env.NEXTAUTH_URL || new URL(req.url).origin;
  return NextResponse.redirect(new URL("/login?verified=1", base));
}
