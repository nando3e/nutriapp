"use client";

import { useState } from "react";
import Link from "next/link";

type Food = {
  id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  unitType: "grams" | "units";
};

export function FoodsManager({
  initialFoods,
  userId,
}: {
  initialFoods: Food[];
  userId: string;
}) {
  const [foods, setFoods] = useState(initialFoods);
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState(false);

  const refresh = () =>
    fetch("/api/foods")
      .then((r) => r.json())
      .then(setFoods);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este alimento?")) return;
    await fetch(`/api/foods/${id}`, { method: "DELETE" });
    setFoods((prev) => prev.filter((f) => f.id !== id));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = (ev.target?.result as string) || "";
      const lines = text.split(/\r?\n/).filter(Boolean);
      const header = lines[0].toLowerCase();
      const nameIdx = header.indexOf("nombre") !== -1 ? header.indexOf("nombre") : header.indexOf("name");
      const kcalIdx = header.indexOf("kcal") !== -1 ? header.indexOf("kcal") : header.indexOf("calorias");
      const pIdx = header.indexOf("prote") !== -1 ? header.indexOf("prote") : header.indexOf("protein");
      const fIdx = header.indexOf("grasa") !== -1 ? header.indexOf("grasa") : header.indexOf("fat");
      const cIdx = header.indexOf("hidrato") !== -1 ? header.indexOf("hidrato") : header.indexOf("carb");
      const typeIdx = header.indexOf("tipo") !== -1 ? header.indexOf("tipo") : header.indexOf("unidad");
      if (nameIdx === -1 || kcalIdx === -1) {
        alert("CSV debe tener al menos columnas: nombre (o name), kcal (o calorias). Opcional: protein/proteina, grasas/grasa, hidratos/carb, tipo/unidad.");
        return;
      }
      setImporting(true);
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map((c) => c.trim());
        const name = cols[nameIdx] || "";
        const kcal = parseFloat(cols[kcalIdx]) || 0;
        const protein = pIdx >= 0 ? parseFloat(cols[pIdx]) || 0 : 0;
        const fat = fIdx >= 0 ? parseFloat(cols[fIdx]) || 0 : 0;
        const carbs = cIdx >= 0 ? parseFloat(cols[cIdx]) || 0 : 0;
        const typeRaw = typeIdx >= 0 ? cols[typeIdx]?.toLowerCase() : "";
        const type = (typeRaw === "units" || typeRaw === "unidades" || typeRaw === "unit") ? "units" : "grams";
        if (!name) continue;
        await fetch("/api/foods", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            kcalPer100g: kcal,
            proteinPer100g: protein,
            fatPer100g: fat,
            carbsPer100g: carbs,
            unitType: type,
          }),
        });
      }
      setImporting(false);
      await refresh();
      e.target.value = "";
    };
    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm"
        >
          + Nuevo alimento
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
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-white/70 space-y-2">
        <p className="font-medium text-white/90">Formato CSV alimentos</p>
        <p className="text-xs">
          Primera fila = cabecera. Columnas: <strong>nombre</strong> (o name), <strong>kcal</strong> (o calorias), opcional: protein/proteina, grasas/grasa, hidratos/carb, <strong>tipo</strong> (o unidad).
        </p>
        <p className="text-xs">
          <strong>Tipo:</strong> <code className="bg-white/10 px-1 rounded">gramos</code> = los números son por 100 g (ej. 100 g de claras → 50 kcal, 11 g proteína). <strong>Tipo</strong> <code className="bg-white/10 px-1 rounded">units</code> (o unidades) = los números son por 1 unidad (ej. 1 huevo → 70 kcal, 6 g proteína; 1 rebanada pan → 120 kcal).
        </p>
        <p className="text-xs text-white/50">
          Ejemplo: <code className="bg-white/10 px-1 rounded">nombre,kcal,protein,grasas,hidratos,tipo</code> y filas: <code className="bg-white/10 px-1 rounded">Claras,50,11,0,0,gramos</code> — <code className="bg-white/10 px-1 rounded">Huevo entero,70,6,5,0,units</code>
        </p>
      </div>

      {showAdd && (
        <AddFoodFormInline
          onSaved={() => {
            setShowAdd(false);
            refresh();
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      <ul className="divide-y divide-white/10">
        {foods.map((f) => (
          <li key={f.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium text-white">{f.name}</span>
              <span className="ml-2 text-white/50 text-sm">
                {f.kcalPer100g} kcal — P: {f.proteinPer100g} G: {f.fatPer100g} H: {f.carbsPer100g} — {f.unitType === "units" ? "por unidad" : "por 100 g"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(f.id)}
              className="text-red-400/90 text-sm hover:underline"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
      {foods.length === 0 && (
        <p className="text-white/50 text-sm">
          Añade alimentos o importa un CSV para usarlos en el dashboard.
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

function AddFoodFormInline({
  onSaved,
  onCancel,
}: {
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [kcalPer100g, setKcalPer100g] = useState(100);
  const [proteinPer100g, setProteinPer100g] = useState(0);
  const [fatPer100g, setFatPer100g] = useState(0);
  const [carbsPer100g, setCarbsPer100g] = useState(0);
  const [unitType, setUnitType] = useState<"grams" | "units">("grams");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await fetch("/api/foods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        kcalPer100g,
        proteinPer100g,
        fatPer100g,
        carbsPer100g,
        unitType,
      }),
    });
    setLoading(false);
    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-dark-border space-y-3">
      <h3 className="font-medium text-white">Nuevo alimento</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre"
        required
        className="w-full px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          step={0.5}
          value={kcalPer100g}
          onChange={(e) => setKcalPer100g(Number(e.target.value) || 0)}
          placeholder="Kcal/100g"
          className="px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white"
        />
        <input
          type="number"
          step={0.5}
          value={proteinPer100g}
          onChange={(e) => setProteinPer100g(Number(e.target.value) || 0)}
          placeholder="Proteína/100g"
          className="px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white"
        />
        <input
          type="number"
          step={0.5}
          value={fatPer100g}
          onChange={(e) => setFatPer100g(Number(e.target.value) || 0)}
          placeholder="Grasas/100g"
          className="px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white"
        />
        <input
          type="number"
          step={0.5}
          value={carbsPer100g}
          onChange={(e) => setCarbsPer100g(Number(e.target.value) || 0)}
          placeholder="Hidratos/100g"
          className="px-3 py-2 rounded-lg bg-dark-bg border border-dark-border text-white"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-dark-muted">Unidad:</label>
        <button
          type="button"
          onClick={() => setUnitType("grams")}
          className={`px-3 py-1 rounded text-sm ${unitType === "grams" ? "bg-accent-green text-dark-bg" : "bg-dark-bg border border-dark-border"}`}
        >
          Gramos
        </button>
        <button
          type="button"
          onClick={() => setUnitType("units")}
          className={`px-3 py-1 rounded text-sm ${unitType === "units" ? "bg-accent-green text-dark-bg" : "bg-dark-bg border border-dark-border"}`}
        >
          Unidades
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-accent-green text-dark-bg font-medium text-sm"
        >
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-dark-border text-sm">
          Cancelar
        </button>
      </div>
    </form>
  );
}
