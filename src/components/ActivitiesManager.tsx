"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Activity = {
  id: string;
  name: string;
  met: number;
};

export function ActivitiesManager({
  initialActivities,
  userId,
}: {
  initialActivities: Activity[];
  userId: string;
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);

  const refresh = () =>
    fetch("/api/activities")
      .then((r) => r.json())
      .then(setActivities);

  useEffect(() => {
    refresh();
  }, []);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const buffer = ev.target?.result as ArrayBuffer | undefined;
      if (!buffer) return;
      // Intentar UTF-8; si hay carácter de reemplazo, probar Latin-1 (Excel en español)
      let text = new TextDecoder("utf-8").decode(buffer);
      if (/\uFFFD/.test(text)) {
        text = new TextDecoder("iso-8859-1").decode(buffer);
      }
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        alert("El CSV está vacío o no tiene filas de datos.");
        return;
      }
      // Detectar columnas por ÍNDICE DE COLUMNA, no por posición de carácter
      const headerCols = lines[0].split(/[,;\t]/).map((c) => c.trim().toLowerCase());
      const fi = (keywords: string[]) =>
        headerCols.findIndex((col) => keywords.some((kw) => col.includes(kw)));
      const nameIdx = fi(["nombre", "name"]);
      const metIdx  = fi(["met"]);
      if (nameIdx === -1 || metIdx === -1) {
        alert("CSV debe tener columnas: nombre (o name), met. Ejemplo: nombre,met");
        return;
      }
      const parseNum = (s: string | undefined) => {
        const n = parseFloat((s ?? "").trim().replace(",", "."));
        return Number.isNaN(n) ? 0 : n;
      };
      const dataRows = lines.slice(1).filter((l) => l.trim());
      setImporting(true);
      setImportProgress({ current: 0, total: dataRows.length });
      for (let i = 0; i < dataRows.length; i++) {
        const cols = dataRows[i].split(/[,;\t]/).map((c) => c.trim());
        const name = cols[nameIdx] || "";
        if (!name) { setImportProgress({ current: i + 1, total: dataRows.length }); continue; }
        const met = parseNum(cols[metIdx]);
        await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, met }),
        });
        setImportProgress({ current: i + 1, total: dataRows.length });
      }
      setImporting(false);
      setImportProgress(null);
      await refresh();
      e.target.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta actividad?")) return;
    await fetch(`/api/activities/${id}`, { method: "DELETE" });
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm"
        >
          + Nueva actividad
        </button>
        <label className="px-4 py-2 rounded-xl border border-white/20 text-sm cursor-pointer hover:bg-white/10 text-white">
          Importar CSV
          <input
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={handleImport}
            disabled={importing}
          />
        </label>
      </div>
      {importProgress && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-white/60">
            <span>Importando actividades…</span>
            <span className="tabular-nums">{importProgress.current} / {importProgress.total}</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-200"
              style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-white/70 space-y-1">
        <p className="font-medium text-white/90">Formato CSV actividades</p>
        <p className="text-xs">
          Primera fila = cabecera. Columnas: <strong>nombre</strong> (o name), <strong>met</strong>. MET = gasto energético (kcal/hora ≈ MET × peso en kg). Ejemplo: <code className="bg-white/10 px-1 rounded">nombre,met</code> — <code className="bg-white/10 px-1 rounded">Andar,2.5</code> — <code className="bg-white/10 px-1 rounded">Correr,8</code>
        </p>
      </div>

      {showAdd && (
        <AddActivityFormInline
          onSaved={() => {
            setShowAdd(false);
            refresh();
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <ul className="divide-y divide-white/10">
        {activities.map((a) => (
          <li key={a.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium text-white">{a.name}</span>
              <span className="ml-2 text-white/50 text-sm">MET: {a.met}</span>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(a.id)}
              className="text-red-400/90 text-sm hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
      {activities.length === 0 && (
        <p className="text-white/50 text-sm">
          Añade actividades (MET) o importa un CSV para calcular gasto por duración y peso.
        </p>
      )}

      <p className="text-sm text-white/50">
        <Link href="/dashboard" className="text-emerald-400 hover:underline">
          ← Volver al día
        </Link>
      </p>
    </div>
  );
}

function AddActivityFormInline({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [met, setMet] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), met }),
    });
    setLoading(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-white/10 space-y-3">
      <h3 className="font-medium text-white">Nueva actividad</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre (ej. Andar, Correr)"
        required
        className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMet((m) => Math.max(0.5, m - 0.5))}
          className="w-10 h-10 rounded-xl border border-white/20 text-white/60 hover:text-white"
        >
          −
        </button>
        <input
          type="number"
          step={0.5}
          value={met}
          onChange={(e) => setMet(Number(e.target.value) || 0)}
          className="w-20 px-2 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-center"
        />
        <button
          type="button"
          onClick={() => setMet((m) => m + 0.5)}
          className="w-10 h-10 rounded-xl border border-white/20 text-white/60 hover:text-white"
        >
          +
        </button>
        <span className="text-white/50 text-sm">MET (gasto por hora = MET × peso kg)</span>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm"
        >
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-white/20 text-sm text-white/80">
          Cancelar
        </button>
      </div>
    </form>
  );
}
