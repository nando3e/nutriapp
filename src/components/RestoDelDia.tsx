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
};

type DraftItem = {
  foodId: string;
  name: string;
  quantityGrams: number | null;
  quantityUnits: number | null;
  unitType: "grams" | "units";
};

const MEALS: { id: string; label: string }[] = [
  { id: "desayuno", label: "Desayuno" },
  { id: "media_manana", label: "Media mañana" },
  { id: "comida", label: "Comida" },
  { id: "merienda", label: "Merienda" },
  { id: "cena", label: "Cena" },
  { id: "extra", label: "Extra" },
];

type RestoDelDiaProps = {
  dateStr: string;
  currentKcal: number;
  currentProtein: number;
  currentFat: number;
  currentCarbs: number;
  calorieGoal: number;
  proteinGoal: number;
  fatGoal: number;
  carbGoal: number;
};

export function RestoDelDia({
  dateStr,
  currentKcal,
  currentProtein,
  currentFat,
  currentCarbs,
  calorieGoal,
  proteinGoal,
  fatGoal,
  carbGoal,
}: RestoDelDiaProps) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [draftMeal, setDraftMeal] = useState("comida");
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(100);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch("/api/foods")
      .then((r) => r.json())
      .then(setFoods);
  }, []);

  const remainingKcal = Math.max(0, calorieGoal - currentKcal);
  const remainingP = Math.max(0, proteinGoal - currentProtein);
  const remainingF = Math.max(0, fatGoal - currentFat);
  const remainingC = Math.max(0, carbGoal - currentCarbs);

  const selected = foods.find((f) => f.id === selectedId);
  const isUnits = selected?.unitType === "units";
  const step = isUnits ? 1 : 5;
  const bigStep = isUnits ? 1 : 100;

  const addToDraft = () => {
    if (!selected) return;
    setDraft((prev) => [
      ...prev,
      {
        foodId: selected.id,
        name: selected.name,
        quantityGrams: isUnits ? null : quantity,
        quantityUnits: isUnits ? quantity : null,
        unitType: selected.unitType,
      },
    ]);
    setSelectedId("");
    setQuantity(isUnits ? 1 : 100);
  };

  const removeFromDraft = (index: number) => {
    setDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const draftTotals = draft.reduce(
    (acc, item) => {
      const q =
        item.unitType === "grams"
          ? (item.quantityGrams ?? 0) / 100
          : (item.quantityUnits ?? 0);
      const food = foods.find((f) => f.id === item.foodId);
      if (!food) return acc;
      return {
        kcal: acc.kcal + food.kcalPer100g * q,
        p: acc.p + food.proteinPer100g * q,
        f: acc.f + food.fatPer100g * q,
        c: acc.c + food.carbsPer100g * q,
      };
    },
    { kcal: 0, p: 0, f: 0, c: 0 }
  );

  const addAllToDay = async () => {
    if (draft.length === 0) return;
    setAdding(true);
    for (const item of draft) {
      await fetch("/api/food-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          foodId: item.foodId,
          quantityGrams: item.quantityGrams,
          quantityUnits: item.quantityUnits,
          meal: draftMeal,
        }),
      });
    }
    setAdding(false);
    setDraft([]);
    window.location.reload();
  };

  const projectedKcal = currentKcal + draftTotals.kcal;
  const projectedP = currentProtein + draftTotals.p;
  const overKcal = projectedKcal > calorieGoal;

  return (
    <section className="mb-6 sm:mb-8 rounded-2xl sm:rounded-3xl border border-white/[0.06] bg-white/[0.03] p-4 sm:p-6">
      <h2 className="text-[11px] font-medium text-white/45 uppercase tracking-widest mb-1">
        Resto del día
      </h2>
      <p className="text-white/40 text-xs mb-4">
        Cuánto te queda por cumplir. Abajo puedes <strong>simular</strong> varias comidas en un borrador (no se guardan) y ver cómo quedaría el día; cuando quieras, &quot;Añadir todo al día&quot; guarda todo de una vez.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
        <div className="rounded-2xl bg-white/[0.05] border border-white/[0.04] p-3 text-center">
          <p className="text-white/40 text-[11px] uppercase tracking-wider">Quedan</p>
          <p className="text-base font-semibold text-white tabular-nums mt-0.5">{remainingKcal}</p>
          <p className="text-white/35 text-xs">kcal</p>
        </div>
        <div className="rounded-2xl bg-white/[0.05] border border-white/[0.04] p-3 text-center">
          <p className="text-white/40 text-[11px] uppercase tracking-wider">Proteína</p>
          <p className="text-base font-semibold text-emerald-400/90 tabular-nums mt-0.5">{remainingP}g</p>
        </div>
        <div className="rounded-2xl bg-white/[0.05] border border-white/[0.04] p-3 text-center">
          <p className="text-white/40 text-[11px] uppercase tracking-wider">Grasas</p>
          <p className="text-base font-semibold text-white/90 tabular-nums mt-0.5">{remainingF}g</p>
        </div>
        <div className="rounded-2xl bg-white/[0.05] border border-white/[0.04] p-3 text-center">
          <p className="text-white/40 text-[11px] uppercase tracking-wider">Hidratos</p>
          <p className="text-base font-semibold text-white/90 tabular-nums mt-0.5">{remainingC}g</p>
        </div>
      </div>

      <div className="border-t border-white/[0.06] pt-5">
        <p className="text-[11px] font-medium text-white/45 uppercase tracking-widest mb-1">
          Simular próximas comidas
        </p>
        <p className="text-white/40 text-xs mb-4">
          Elige comida, cantidad y momento. &quot;Añadir al borrador&quot; solo lo añade a la lista de abajo (no guarda). Cuando tengas la lista lista, &quot;Añadir todo al día&quot; guarda todo en el día.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {MEALS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setDraftMeal(m.id)}
              className={`px-3 py-2 rounded-full text-xs font-medium no-min-touch transition-colors ${
                draftMeal === m.id ? "bg-amber-500/20 text-amber-400/90 border border-amber-500/30" : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1] border border-white/[0.06]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {foods.length === 0 ? (
          <p className="text-sm text-white/50 mb-4">
            No tienes alimentos en tu lista.{" "}
            <a href="/dashboard/foods" className="text-emerald-400 hover:underline">
              Añade alimentos
            </a>{" "}
            para poder simular comidas aquí, o usa la sección &quot;Añadir comida&quot; de abajo para registrar una por una.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 min-w-0">
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                const f = foods.find((x) => x.id === e.target.value);
                setQuantity(f?.unitType === "units" ? 1 : 100);
              }}
              className="flex-1 min-w-0 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm min-w-[100px] sm:min-w-[120px] focus:border-white/20 focus:outline-none [&_option]:text-gray-900 [&_option]:bg-white"
            >
              <option value="">Alimento</option>
              {foods.map((f) => (
                <option key={f.id} value={f.id} className="text-gray-900 bg-white">{f.name}</option>
              ))}
            </select>
            {selected && (
              <>
                <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-2xl border border-white/[0.08] p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(0, q - bigStep))}
                    className="w-8 h-8 rounded-xl text-white/50 hover:text-white no-min-touch"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-sm text-white tabular-nums">
                    {quantity}
                    {isUnits ? " ud" : " g"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + bigStep)}
                    className="w-8 h-8 rounded-xl text-white/50 hover:text-white no-min-touch"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={addToDraft}
                  className="px-4 py-2 rounded-full bg-white/[0.1] text-white/90 text-sm font-medium hover:bg-white/[0.15]"
                >
                  Añadir al borrador
                </button>
              </>
            )}
          </div>
        )}
        {draft.length > 0 && (
          <div className="rounded-2xl bg-white/[0.05] border border-white/[0.06] p-4 mb-4">
            <p className="text-white/50 text-xs mb-3">Borrador · {MEALS.find((m) => m.id === draftMeal)?.label}</p>
            <ul className="space-y-1 mb-2">
              {draft.map((item, i) => {
                const food = foods.find((f) => f.id === item.foodId);
                const q = item.unitType === "grams" ? `${item.quantityGrams} g` : `${item.quantityUnits} ud`;
                const kcal = food
                  ? item.unitType === "grams"
                    ? Math.round((food.kcalPer100g * (item.quantityGrams ?? 0)) / 100)
                    : Math.round(food.kcalPer100g * (item.quantityUnits ?? 0))
                  : 0;
                return (
                  <li key={i} className="flex justify-between items-center text-sm py-1">
                    <span className="text-white/90">
                      {item.name} ({q})
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-white/50">{kcal} kcal</span>
                      <button
                        type="button"
                        onClick={() => removeFromDraft(i)}
                        className="text-red-400/80 hover:text-red-400 text-xs no-min-touch"
                      >
                        Quitar
                      </button>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-white/50 text-xs mb-2">
              +{Math.round(draftTotals.kcal)} kcal, +{Math.round(draftTotals.p)} g P
              {projectedKcal > calorieGoal && (
                <span className="text-amber-400 ml-1">(te pasas {Math.round(projectedKcal - calorieGoal)} kcal)</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addAllToDay}
                disabled={adding}
                className="px-5 py-2.5 rounded-full bg-emerald-500/90 text-white text-sm font-medium hover:bg-emerald-400 disabled:opacity-50"
              >
                {adding ? "Guardando…" : "Añadir todo al día"}
              </button>
              <button
                type="button"
                onClick={() => setDraft([])}
                className="px-4 py-2 rounded-full border border-white/[0.1] text-white/60 text-sm hover:bg-white/[0.06]"
              >
                Limpiar borrador
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
