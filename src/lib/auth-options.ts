import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, isSuperadminEnv } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        if (isSuperadminEnv(email, password)) {
          const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (existing) {
            return { id: existing.id, email: existing.email, role: existing.role };
          }
          const passwordHash = await hashPassword(password);
          const [inserted] = await db
            .insert(users)
            .values({
              email,
              passwordHash,
              role: "superadmin",
              emailVerifiedAt: new Date(),
            })
            .returning({ id: users.id, email: users.email, role: users.role });
          if (inserted) return { id: inserted.id, email: inserted.email, role: inserted.role };
          return null;
        }

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) return null;
        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;
        if (!user.emailVerifiedAt) return null;
        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
};
