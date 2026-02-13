"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error en el registro");
        return;
      }
      setMessage("Cuenta creada. Revisa tu email para verificar el correo antes de iniciar sesión.");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-white mb-6 text-center tracking-tight">Registrarse</h1>

        {message && (
          <p className="mb-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm">{message}</p>
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
              Contraseña (mínimo 8 caracteres)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full px-4 py-3.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/35 focus:border-emerald-500/40 focus:outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full bg-emerald-500/90 text-white font-medium hover:bg-emerald-400 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-white/50 text-sm">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Iniciar sesión
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
