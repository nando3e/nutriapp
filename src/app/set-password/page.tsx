"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Falta el enlace de activación.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setError("Mínimo 8 caracteres.");
      return;
    }
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/set-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error");
      return;
    }
    setMessage("Contraseña establecida. Redirigiendo al login…");
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  };

  if (!token) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-accent-red">Enlace no válido.</p>
        <Link href="/login" className="mt-4 text-accent-green hover:underline">
          Ir al login
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Establecer contraseña</h1>
        {message && (
          <p className="mb-4 p-3 rounded-lg bg-accent-green/20 text-accent-green text-sm">{message}</p>
        )}
        {error && (
          <p className="mb-4 p-3 rounded-lg bg-accent-red/20 text-accent-red text-sm">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm text-dark-muted mb-1">
              Nueva contraseña (mín. 8 caracteres)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-white"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm text-dark-muted mb-1">
              Repetir contraseña
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg bg-dark-card border border-dark-border text-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent-green text-dark-bg font-medium"
          >
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </form>
        <p className="mt-6 text-center">
          <Link href="/login" className="text-dark-muted text-sm hover:underline">
            Volver al login
          </Link>
        </p>
      </div>
    </main>
  );
}
