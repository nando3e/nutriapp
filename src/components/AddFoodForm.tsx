"use client";

import { useState, useEffect } from "react";

type Food = {
  id: string;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  fatPer100g: number;
  carbsPer100g: number;
  unitType: "grams" | "units";
  category: string | null;
};

function groupByCategory(foods: Food[]) {
  const groups: Record<string, Food[]> = {};
  for (const f of foods) {
    const key = f.category?.trim() || "Sin categoría";
    if (!groups[key]) groups[key] = [];
    groups[key].push(f);
  }
  const order = Object.keys(groups).sort((a, b) =>
    a === "Sin categoría" ? 1 : b === "Sin categoría" ? -1 : a.localeCompare(b)
  );
  return order.map((cat) => ({ cat, items: groups[cat] }));
}

const MEALS: { id: string; label: string }[] = [
  { id: "desayuno", label: "Desayuno" },
  { id: "media_manana", label: "Mañana" },
  { id: "comida", label: "Comida" },
  { id: "merienda", label: "Merienda" },
  { id: "cena", label: "Cena" },
  { id: "extra", label: "Extra" },
];

export function AddFoodForm({ dateStr }: { dateStr: string; userId: string }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [mode, setMode] = useState<"list" | "quick">("list");
  const [selectedId, setSelectedId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(100);
  const [loading, setLoading] = useState(false);

  const [quickName, setQuickName] = useState("");
  const [quickKcal, setQuickKcal] = useState("");
  const [quickProtein, setQuickProtein] = useState("");
  const [quickFat, setQuickFat] = useState("");
  const [quickCarbs, setQuickCarbs] = useState("");

  useEffect(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then(setFoods);
  }, []);

  const selected = foods.find((f) => f.id === selectedId);
  const isUnits = selected?.unitType === "units";
  const [meal, setMeal] = useState("comida");
  // Cargar último meal desde localStorage tras la hidratación (evita mismatch SSR)
  useEffect(() => {
    const stored = localStorage.getItem("nutriapp_last_meal");
    if (stored) setMeal(stored);
  }, []);
  const step = isUnits ? 1 : 5;
  const bigStep = isUnits ? 1 : 100;

  const handleAddFromList = async () => {
    if (!selectedId || !selected) return;
    setLoading(true);
    await fetch("/api/food-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateStr,
        foodId: selected.id,
        quantityGrams: isUnits ? null : quantity,
        quantityUnits: isUnits ? quantity : null,
        meal,
      }),
    });
    setLoading(false);
    window.location.reload();
  };

  const handleAddQuick = async () => {
    const name = quickName.trim();
    const kcal = Number(quickKcal);
    if (!name || Number.isNaN(kcal) || kcal < 0) return;
    setLoading(true);
    await fetch("/api/food-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateStr,
        meal,
        custom: {
          name,
          kcal,
          protein: quickProtein ? Number(quickProtein) : undefined,
          fat: quickFat ? Number(quickFat) : undefined,
          carbs: quickCarbs ? Number(quickCarbs) : undefined,
        },
      }),
    });
    setLoading(false);
    window.location.reload();
  };

  const quickKcalNum = Number(quickKcal);
  const canAddQuick = quickName.trim() !== "" && !Number.isNaN(quickKcalNum) && quickKcalNum >= 0;

  return (
    <section className="mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4 sm:p-6 min-w-0">
      <h2 className="text-[11px] font-medium text-white/45 uppercase tracking-widest mb-1">Añadir comida</h2>
      <p className="text-white/40 text-xs mb-4">
        Añade <strong>una</strong> comida y se guarda <strong>al momento</strong> en el día (no hay borrador).
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("list")}
          className={`px-3 py-2 rounded-full text-xs font-medium no-min-touch ${
            mode === "list" ? "bg-white/15 text-white" : "bg-white/[0.06] text-white/60 hover:text-white/80"
          }`}
        >
          Desde lista
        </button>
        <button
          type="button"
          onClick={() => setMode("quick")}
          className={`px-3 py-2 rounded-full text-xs font-medium no-min-touch ${
            mode === "quick" ? "bg-amber-500/20 text-amber-300" : "bg-white/[0.06] text-white/60 hover:text-white/80"
          }`}
        >
          Comida rápida
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {MEALS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => { setMeal(m.id); localStorage.setItem("nutriapp_last_meal", m.id); }}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors no-min-touch ${
              meal === m.id ? "bg-emerald-500/90 text-white" : "bg-white/[0.08] text-white/60 hover:bg-white/[0.12] hover:text-white/80"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "quick" ? (
        <div className="space-y-3">
          <p className="text-white/50 text-xs">
            Para comidas que no tengas en la lista: nombre y kcal (proteína/grasas/hidratos opcionales).
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <input
              type="text"
              placeholder="Nombre (ej. Sushi)"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              className="flex-1 min-w-[140px] px-3 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm placeholder:text-white/35 focus:border-white/20 focus:outline-none"
            />
            <input
              type="number"
              min={0}
              placeholder="kcal"
              value={quickKcal}
              onChange={(e) => setQuickKcal(e.target.value)}
              className="w-20 px-3 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm tabular-nums focus:border-white/20 focus:outline-none"
            />
            <input
              type="number"
              min={0}
              placeholder="P (g)"
              value={quickProtein}
              onChange={(e) => setQuickProtein(e.target.value)}
              className="w-16 px-2 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm tabular-nums placeholder:text-white/35 focus:border-white/20 focus:outline-none"
            />
            <input
              type="number"
              min={0}
              placeholder="G (g)"
              value={quickFat}
              onChange={(e) => setQuickFat(e.target.value)}
              className="w-16 px-2 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm tabular-nums placeholder:text-white/35 focus:border-white/20 focus:outline-none"
            />
            <input
              type="number"
              min={0}
              placeholder="H (g)"
              value={quickCarbs}
              onChange={(e) => setQuickCarbs(e.target.value)}
              className="w-16 px-2 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm tabular-nums placeholder:text-white/35 focus:border-white/20 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddQuick}
              disabled={loading || !canAddQuick}
              className="px-5 py-2.5 rounded-full bg-amber-500/90 text-white font-medium text-sm hover:bg-amber-400 disabled:opacity-50"
            >
              {loading ? "…" : "Añadir"}
            </button>
          </div>
        </div>
      ) : foods.length === 0 ? (
        <p className="text-sm text-white/50">
          <a href="/dashboard/foods" className="text-emerald-400 hover:underline">
            Añade alimentos
          </a>{" "}
          para poder registrar desde la lista, o usa <strong className="text-white/70">Comida rápida</strong> arriba.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <select
            value={selectedId}
            onChange={(e) => {
              setSelectedId(e.target.value);
              setQuantity(
                foods.find((f) => f.id === e.target.value)?.unitType === "units" ? 1 : 100
              );
            }}
            className="flex-1 min-w-0 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm min-w-[120px] sm:min-w-[140px] focus:border-white/20 focus:outline-none [&_option]:text-gray-900 [&_option]:bg-white"
          >
            <option value="">Seleccionar</option>
            {groupByCategory(foods).map(({ cat, items }) => (
              <optgroup key={cat} label={cat} className="text-gray-500 bg-white font-semibold">
                {items.map((f) => (
                  <option key={f.id} value={f.id} className="text-gray-900 bg-white font-normal">
                    {f.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {selected && (
            <>
              <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-2xl border border-white/[0.08] p-1">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(0, q - bigStep))}
                  className="w-10 h-10 rounded-xl text-lg font-semibold text-white/50 hover:text-white no-min-touch"
                >
                  −
                </button>
                <span className="w-14 text-center text-sm font-medium text-white tabular-nums">
                  {quantity}
                  {isUnits ? " ud" : " g"}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + bigStep)}
                  className="w-10 h-10 rounded-xl text-lg font-semibold text-white/50 hover:text-white no-min-touch"
                >
                  +
                </button>
              </div>
              {!isUnits && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(0, q - step))}
                    className="w-9 h-9 rounded-full text-xs text-white/50 hover:text-white border border-white/[0.1] no-min-touch"
                  >
                    −5
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + step)}
                    className="w-9 h-9 rounded-full text-xs text-white/50 hover:text-white border border-white/[0.1] no-min-touch"
                  >
                    +5
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={handleAddFromList}
                disabled={loading}
                className="px-5 py-2.5 rounded-full bg-emerald-500/90 text-white font-medium text-sm hover:bg-emerald-400 disabled:opacity-50"
              >
                Añadir
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
