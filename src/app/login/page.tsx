"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verified = searchParams.get("verified");
  const errorParam = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      if (res.error === "CredentialsSignin") {
        setError("Email o contraseña incorrectos. Si acabas de registrarte, verifica tu email primero.");
      } else {
        setError(res.error);
      }
      return;
    }
    window.location.href = "/dashboard";
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-6 text-center tracking-tight">Iniciar sesión</h1>

        {verified === "1" && (
          <p className="mb-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm text-center">
            Email verificado. Ya puedes iniciar sesión.
          </p>
        )}
        {errorParam === "TokenExpired" && (
          <p className="mb-4 p-3 rounded-xl bg-red-500/20 text-red-400 text-sm text-center">
            El enlace ha caducado. Solicita uno nuevo desde el registro.
          </p>
        )}
        {error && (
          <p className="mb-4 p-3 rounded-xl bg-red-500/20 text-red-400 text-sm">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-white/50 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/35 focus:border-emerald-500/40 focus:outline-none transition-colors"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm text-white/50 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/35 focus:border-emerald-500/40 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-emerald-500/90 text-white font-medium hover:bg-emerald-400 disabled:opacity-50 transition-colors"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-white/50 text-sm">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline">
            Registrarse
          </Link>
        </p>
        <p className="mt-2 text-center">
          <Link href="/" className="text-white/40 text-sm hover:underline">
            ← Volver
          </Link>
        </p>
      </div>
    </main>
  );
}
