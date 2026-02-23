"use client";

import { useState } from "react";
import { formatDecimal } from "@/lib/format";
import { AddFoodForm } from "./AddFoodForm";
import { AddActivityForm } from "./AddActivityForm";
import { AddWeightForm } from "./AddWeightForm";
import { RestoDelDia } from "./RestoDelDia";
import { MacroRing } from "./MacroRing";

type FoodLog = {
  id: string;
  name: string | null;
  quantityGrams: number | null;
  quantityUnits: number | null;
  unitType: string | null;
  meal: string | null;
  kcalPer100g: number | null;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
  customName?: string | null;
  customKcal?: number | null;
  customProtein?: number | null;
  customFat?: number | null;
  customCarbs?: number | null;
};

const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  media_manana: "Media mañana",
  comida: "Comida",
  merienda: "Merienda",
  cena: "Cena",
  extra: "Extra",
};
const MEAL_ORDER = ["desayuno", "media_manana", "comida", "merienda", "cena", "extra"];

type ActivityLog = {
  id: string;
  name: string | null;
  durationMinutes: number | null;
  manualKcal: number | null;
  wahooCorrection: boolean | null;
  met: number | null;
};

type DayViewProps = {
  dateStr: string;
  isClosed: boolean;
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  calorieGoal: number;
  proteinGoal: number;
  fatGoal?: number;
  carbGoal?: number;
  activityKcal: number;
  /** Gastado del día = TMB×NEAT + actividad; si se pasa, el balance es ingerido − esto */
  dailyExpenditure?: number;
  weightKg?: number | null;
  waistCm?: number | null;
  weightMoment?: string | null;
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
  targetWeightKg?: number | null;
  targetDate?: string | null;
  userId: string;
  /** "comidas" | "actividad" | "mediciones" (peso/cintura) */
  mode?: "comidas" | "actividad" | "mediciones";
};

export function DayView({
  dateStr,
  isClosed,
  totalKcal,
  totalProtein,
  totalFat,
  totalCarbs,
  calorieGoal,
  proteinGoal,
  fatGoal,
  carbGoal,
  activityKcal,
  dailyExpenditure,
  weightKg,
  waistCm,
  weightMoment,
  foodLogs,
  activityLogs,
  userId,
  mode = "comidas",
}: DayViewProps) {
  const [showNumerics, setShowNumerics] = useState(true);
  const [editing, setEditing] = useState(false);

  const displayKcal = totalKcal;
  const gastado = dailyExpenditure ?? activityKcal;
  const balance = displayKcal - gastado;

  const isComidas = mode === "comidas";
  const isActividad = mode === "actividad";
  const isMediciones = mode === "mediciones";

  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border border-white/[0.06] p-4 sm:p-6 ${
        isClosed && !editing
          ? "bg-white/[0.02]"
          : "bg-white/[0.04]"
      }`}
    >
      {isClosed && !editing && (
        <div className="flex items-center justify-between mb-5">
          <span className="text-white/40 text-sm">Día cerrado</span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-emerald-400/90 hover:text-emerald-300 rounded-full px-3 py-1.5 bg-emerald-500/10"
          >
            Editar
          </button>
        </div>
      )}

      {/* Vista Comidas: gráficos → comidas registradas → simulación → añadir comida */}
      {isComidas && (
        <>
          <div className="flex items-center justify-end mb-4">
            <label className="text-white/45 text-sm flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showNumerics}
                onChange={(e) => setShowNumerics(e.target.checked)}
                className="rounded-full border-white/30 text-emerald-500 focus:ring-emerald-500/30"
              />
              Ver números
            </label>
          </div>

          <section className="mb-6 sm:mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 justify-items-center">
              <MacroRing
                label="Calorías"
                value={displayKcal}
                goal={calorieGoal}
                unit="kcal"
                showNumeric={showNumerics}
                variant={displayKcal > calorieGoal ? "over" : "default"}
              />
              <MacroRing
                label="Proteína"
                value={totalProtein}
                goal={proteinGoal}
                unit="g"
                showNumeric={showNumerics}
                variant={totalProtein >= proteinGoal ? "goal" : "default"}
              />
              <MacroRing
                label="Grasas"
                value={totalFat}
                goal={fatGoal ?? 65}
                unit="g"
                showNumeric={showNumerics}
              />
              <MacroRing
                label="Hidratos"
                value={totalCarbs}
                goal={carbGoal ?? 200}
                unit="g"
                showNumeric={showNumerics}
              />
            </div>
            <div className="mt-4 sm:mt-5 flex flex-col items-center gap-1.5">
              {dailyExpenditure != null && (
                <p className="text-white/45 text-xs">
                  Gastado: <span className="tabular-nums text-white/60">{dailyExpenditure} kcal</span> (TMB + NEAT + actividad)
                </p>
              )}
              <span
                title={dailyExpenditure != null ? "Ingerido − (TMB + NEAT + actividad). Los días pasados quedan fijados y no cambian con el peso o NEAT actual." : "Ingerido − actividad registrada"}
                className={`inline-flex flex-wrap justify-center text-center rounded-full px-3 py-2 sm:px-4 text-xs sm:text-sm font-medium max-w-full ${
                  balance < 0
                    ? "bg-emerald-500/15 text-emerald-400/90"
                    : "bg-amber-500/15 text-amber-400/90"
                }`}
              >
                <span className="sm:inline">Balance: </span>
                <span className="tabular-nums">{balance} kcal</span>
              </span>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="text-[11px] font-medium text-white/45 uppercase tracking-widest mb-4">Comidas</h2>
        {foodLogs.length === 0 ? (
          <p className="text-white/40 text-sm">Sin registros</p>
        ) : (
          <div className="space-y-4">
            {MEAL_ORDER.map((mealKey) => {
              const items = foodLogs.filter((log) => (log.meal || "comida") === mealKey);
              if (items.length === 0) return null;
              const label = MEAL_LABELS[mealKey] ?? mealKey;
              return (
                <div key={mealKey}>
                  <p className="text-white/40 text-[11px] font-medium uppercase tracking-widest mb-2">
                    {label}
                  </p>
                  <ul className="space-y-1">
                    {items.map((log) => {
                      const isCustom = log.customKcal != null;
                      const displayName = isCustom ? (log.customName ?? "Comida") : (log.name ?? "");
                      const q = isCustom
                        ? "1 ración"
                        : log.unitType === "grams"
                          ? `${log.quantityGrams ?? 0} g`
                          : `${log.quantityUnits ?? 0} ud`;
                      const kcal = isCustom
                        ? Math.round(log.customKcal ?? 0)
                        : log.unitType === "grams"
                          ? Math.round(
                              ((log.kcalPer100g ?? 0) * (log.quantityGrams ?? 0)) / 100
                            )
                          : Math.round((log.kcalPer100g ?? 0) * (log.quantityUnits ?? 0));
                      return (
                        <li
                          key={log.id}
                          className="grid items-center gap-x-3 text-sm py-2.5 border-b border-white/[0.04] min-w-0"
                          style={{ gridTemplateColumns: "1fr 5.5rem auto" }}
                        >
                          <span className="min-w-0 truncate">
                            {displayName} ({q})
                          </span>
                          <span className="text-white/70 tabular-nums text-right">{kcal} kcal</span>
                          <span className="w-16 text-right">
                            {(!isClosed || editing) && (
                              <DeleteFoodLogButton logId={log.id} />
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
          </section>

          {(!isClosed || editing) && (
            <>
              {/* Tarjetas: cuánto queda por cumplir */}
              <section className="mb-6 sm:mb-8">
                <h2 className="text-[11px] font-medium text-white/45 uppercase tracking-widest mb-3">Resto del día</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="rounded-2xl bg-white/[0.05] border border-white/[0.04] p-3 text-center">
                    <p className="text-white/40 text-[11px] uppercase tracking-wider">Quedan</p>
                    <p className="text-base font-semibold text-white tabular-nums mt-0.5">{Math.max(0, calorieGoal - totalKcal)}</p>
                    <p className="text-white/35 text-xs">kcal</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.05] border border-white/[0.04] p-3 text-center">
                    <p className="text-white/40 text-[11px] uppercase tracking-wider">Proteína</p>
                    <p className="text-base font-semibold text-emerald-400/90 tabular-nums mt-0.5">{Math.max(0, proteinGoal - totalProtein)}g</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.05] border border-white/[0.04] p-3 text-center">
                    <p className="text-white/40 text-[11px] uppercase tracking-wider">Grasas</p>
                    <p className="text-base font-semibold text-white/90 tabular-nums mt-0.5">{Math.max(0, (fatGoal ?? 65) - totalFat)}g</p>
                  </div>
                  <div className="rounded-2xl bg-white/[0.05] border border-white/[0.04] p-3 text-center">
                    <p className="text-white/40 text-[11px] uppercase tracking-wider">Hidratos</p>
                    <p className="text-base font-semibold text-white/90 tabular-nums mt-0.5">{Math.max(0, (carbGoal ?? 200) - totalCarbs)}g</p>
                  </div>
                </div>
              </section>

              {/* Añadir comida */}
              <AddFoodForm dateStr={dateStr} userId={userId} />

              {/* Simulador */}
              <RestoDelDia
                dateStr={dateStr}
                currentKcal={totalKcal}
                currentProtein={totalProtein}
                currentFat={totalFat}
                currentCarbs={totalCarbs}
                calorieGoal={calorieGoal}
                proteinGoal={proteinGoal}
                fatGoal={fatGoal ?? 65}
                carbGoal={carbGoal ?? 200}
              />
            </>
          )}

          {(!isClosed || editing) && (
            <div className="mt-6 flex gap-2">
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-full border border-white/15 text-sm text-white/70 hover:bg-white/5"
                >
                  Dejar de editar
                </button>
              )}
              <CloseDayButton dateStr={dateStr} isClosed={isClosed} />
            </div>
          )}
        </>
      )}

      {/* Vista Actividad: solo actividad */}
      {isActividad && (
        <>
          <section className="mt-0">
            <h2 className="text-[11px] font-medium text-white/45 uppercase tracking-widest mb-4">Actividad</h2>
            {activityLogs.length === 0 ? (
              <p className="text-white/40 text-sm">Sin registros</p>
            ) : (
              <ul className="space-y-1">
                {activityLogs.map((log) => {
                  const weightForMet = weightKg ?? 70;
                  const displayKcal =
                    log.manualKcal != null
                      ? log.wahooCorrection
                        ? Math.round(log.manualKcal * 0.8)
                        : Math.round(log.manualKcal)
                      : log.durationMinutes != null && log.met != null
                        ? Math.round(
                            log.met * weightForMet * (log.durationMinutes / 60)
                          )
                        : 0;
                  const label =
                    log.name ||
                    (log.manualKcal != null
                      ? `Manual ${log.wahooCorrection ? "(Wahoo -20%)" : ""}`
                      : "Actividad");
                  return (
                    <li
                      key={log.id}
                      className="flex justify-between items-center gap-2 text-sm py-2.5 border-b border-white/[0.04] min-w-0"
                    >
                      <span className="min-w-0 truncate">
                        {label}
                        {log.durationMinutes != null &&
                          ` ${log.durationMinutes} min`}
                      </span>
                      <span className="shrink-0 tabular-nums">{displayKcal} kcal</span>
                      {(!isClosed || editing) && (
                        <DeleteActivityLogButton logId={log.id} />
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {(!isClosed || editing) && (
            <AddActivityForm dateStr={dateStr} userId={userId} />
          )}
        </>
      )}

      {/* Vista Mediciones: peso y cintura */}
      {isMediciones && (
        <>
          {(weightKg != null || waistCm != null) && (
            <section className="mb-6">
              <h2 className="text-[11px] font-medium text-white/45 uppercase tracking-widest mb-2">Registrado hoy</h2>
              <p className="text-sm">
                {weightKg != null && <span>{formatDecimal(weightKg)} kg</span>}
                {waistCm != null && (
                  <span className={weightKg != null ? "ml-3" : ""}>Cintura: {formatDecimal(waistCm)} cm</span>
                )}
                {weightMoment && (
                  <span className="ml-2 text-white/40 text-xs">
                    ({weightMoment === "start" ? "inicio día" : "fin día"})
                  </span>
                )}
              </p>
            </section>
          )}

          {(!isClosed || editing) && (
            <AddWeightForm
              dateStr={dateStr}
              userId={userId}
              currentWeight={weightKg}
              currentWaist={waistCm}
              currentMoment={weightMoment}
            />
          )}
        </>
      )}
    </div>
  );
}

function DeleteFoodLogButton({ logId }: { logId: string }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    if (!confirm("¿Eliminar?")) return;
    setLoading(true);
    await fetch(`/api/food-logs/${logId}`, { method: "DELETE" });
    window.location.reload();
  };
  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400/80 text-xs ml-2 hover:underline no-min-touch rounded-full px-2 py-0.5 hover:bg-red-500/10"
    >
      Eliminar
    </button>
  );
}

function DeleteActivityLogButton({ logId }: { logId: string }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    if (!confirm("¿Eliminar?")) return;
    setLoading(true);
    await fetch(`/api/activity-logs/${logId}`, { method: "DELETE" });
    window.location.reload();
  };
  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="text-red-400/80 text-xs ml-2 hover:underline no-min-touch rounded-full px-2 py-0.5 hover:bg-red-500/10"
    >
      Eliminar
    </button>
  );
}

function CloseDayButton({ dateStr, isClosed }: { dateStr: string; isClosed: boolean }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await fetch("/api/days/close", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, close: !isClosed }),
    });
    window.location.reload();
  };
  return (
    <button
      type="button"
      onClick={handle}
      disabled={loading}
      className="px-5 py-2.5 rounded-full bg-white/[0.08] text-sm hover:bg-white/[0.12] border border-white/[0.06]"
    >
      {isClosed ? "Reabrir día" : "Cerrar día"}
    </button>
  );
}
