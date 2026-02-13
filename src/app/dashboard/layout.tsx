import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { DashboardNav } from "@/components/DashboardNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-dark-bg/90 backdrop-blur-xl">
        <div className="relative flex items-center justify-between px-4 py-4 max-w-4xl mx-auto w-full min-w-0">
          <Link href="/dashboard" className="font-semibold text-lg text-white tracking-tight">
            NutriApp
          </Link>
          <DashboardNav user={session.user} />
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-5 max-w-4xl mx-auto w-full min-w-0 overflow-x-hidden">{children}</main>
    </div>
  );
}
