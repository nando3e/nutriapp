import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">NutriApp</h1>
      <p className="text-white/45 mb-10 text-sm">Tracking nutricional y entrenamiento</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/login"
          className="px-8 py-3.5 rounded-full bg-white/[0.08] border border-white/[0.08] hover:bg-white/[0.12] text-center font-medium text-white transition-colors"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          className="px-8 py-3.5 rounded-full bg-emerald-500/90 text-white font-medium text-center hover:bg-emerald-400 transition-colors"
        >
          Registrarse
        </Link>
      </div>
    </main>
  );
}
