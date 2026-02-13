"use client";

import { useState, useEffect } from "react";

type UserRow = {
  id: string;
  email: string | null;
  role: string;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error");
      return;
    }
    setMessage(data.message || "Usuario creado.");
    setEmail("");
    setPassword("");
    fetch("/api/admin/users").then((r) => r.json()).then(setUsers);
  };

  return (
    <div className="space-y-6">
      <section className="p-4 rounded-xl border border-dark-border">
        <h2 className="font-medium text-white mb-3">Crear usuario</h2>
        {message && <p className="mb-2 text-sm text-accent-green">{message}</p>}
        {error && <p className="mb-2 text-sm text-accent-red">{error}</p>}
        <form onSubmit={handleCreate} className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-dark-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white w-48"
            />
          </div>
          <div>
            <label className="block text-xs text-dark-muted mb-1">Contraseña temporal</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white w-40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-accent-green text-dark-bg font-medium text-sm"
          >
            Crear y enviar email
          </button>
        </form>
        <p className="mt-2 text-xs text-dark-muted">
          Se enviará un email al usuario para que establezca su contraseña y active la cuenta.
        </p>
      </section>

      <section>
        <h2 className="font-medium text-white mb-2">Usuarios</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-dark-muted border-b border-dark-border">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Rol</th>
                <th className="py-2 pr-4">Verificado</th>
                <th className="py-2">Creado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-dark-border/50">
                  <td className="py-2 pr-4 text-white">{u.email}</td>
                  <td className="py-2 pr-4">{u.role}</td>
                  <td className="py-2 pr-4">{u.emailVerifiedAt ? "Sí" : "No"}</td>
                  <td className="py-2 text-dark-muted">
                    {new Date(u.createdAt).toLocaleDateString("es")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
