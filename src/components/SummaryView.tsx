"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

type DayRow = {
  date: string;
  hasData: boolean;
  kcalIn?: number;
  kcalOut?: number;
  balance?: number;
  /** TMB×NEAT ese día (solo si se calculó, no desde snapshot) */
  tmbNeat?: number;
  activityKcal?: number;
};

type SummaryData = {
  from: string;
  to: string;
  daysCount: number;
  totalKcalIn: number;
  totalKcalOut: number;
  totalTmb: number;
  totalActivityKcal: number;
  balance: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  proportions: { protein: number; fat: number; carbs: number };
  tmbDaily: number;
  byDay?: DayRow[];
};

const today = new Date();

const presets: { id: string; label: string; from: Date; to: Date }[] = [
  {
    id: "this-week",
    label: "Esta semana",
    from: startOfWeek(today, { weekStartsOn: 1 }),
    to: endOfWeek(today, { weekStartsOn: 1 }),
  },
  {
    id: "last-week",
    label: "Semana pasada",
    from: startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
    to: endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }),
  },
  {
    id: "this-month",
    label: "Este mes",
    from: startOfMonth(today),
    to: endOfMonth(today),
  },
  {
    id: "last-month",
    label: "Mes pasado",
    from: startOfMonth(subMonths(today, 1)),
    to: endOfMonth(subMonths(today, 1)),
  },
];

export function SummaryView() {
  const [period, setPeriod] = useState(presets[0]);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fromStr = period.id === "custom" ? customFrom : format(period.from, "yyyy-MM-dd");
  const toStr = period.id === "custom" ? customTo : format(period.to, "yyyy-MM-dd");

  useEffect(() => {
    if (period.id === "custom" && (!customFrom || !customTo)) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/summary?from=${fromStr}&to=${toStr}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.error ? null : d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [fromStr, toStr, period.id, customFrom, customTo]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p)}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
              period.id === p.id
                ? "bg-white text-black"
                : "bg-white/[0.08] text-white/70 hover:bg-white/[0.12]"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setPeriod({ id: "custom", label: "Rango", from: today, to: today });
            if (!customFrom) setCustomFrom(format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
            if (!customTo) setCustomTo(format(today, "yyyy-MM-dd"));
          }}
          className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
            period.id === "custom"
              ? "bg-white text-black"
              : "bg-white/[0.08] text-white/70 hover:bg-white/[0.12]"
          }`}
        >
          Rango
        </button>
      </div>

      {period.id === "custom" && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm focus:border-white/20 focus:outline-none"
          />
          <span className="text-white/40 text-sm">a</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm focus:border-white/20 focus:outline-none"
          />
        </div>
      )}

      {loading && <p className="text-white/60 text-sm">Cargando…</p>}
      {!loading && data && (
        <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 min-w-0">
          <div className="rounded-2xl sm:rounded-3xl bg-white/[0.04] border border-white/[0.06] p-4 sm:p-6 min-w-0">
            <p className="text-white/40 text-[11px] uppercase tracking-widest mb-2">
              {format(new Date(data.from), "d MMM", { locale: es })} –{" "}
              {format(new Date(data.to), "d MMM yyyy", { locale: es })} · {data.daysCount} días
            </p>
            <h2 className="text-lg font-semibold text-white mb-1">Balance energético</h2>
            <p className="text-white/40 text-[10px] mb-4">
              TMB y gastado de la tarjeta usan el peso medio del periodo. En el detalle por día se usa el peso de cada día.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Ingerido</span>
                <span className="text-white">{Math.round(data.totalKcalIn)} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Gastado (TMB + NEAT + actividad)</span>
                <span className="text-white">{Math.round(data.totalKcalOut)} kcal</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-white/60">Balance</span>
                <span
                  className={
                    data.balance < 0 ? "text-emerald-400" : data.balance > 0 ? "text-amber-400" : "text-white"
                  }
                >
                  {data.balance > 0 ? "+" : ""}
                  {Math.round(data.balance)} kcal {data.balance < 0 ? "(déficit)" : data.balance > 0 ? "(superávit)" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl sm:rounded-3xl bg-white/[0.04] border border-white/[0.06] p-4 sm:p-6 min-w-0">
            <h2 className="text-lg font-semibold text-white mb-5">Proporciones (macros)</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-3 rounded-full bg-amber-500/80"
                  style={{ width: `${data.proportions.carbs}%`, minWidth: data.proportions.carbs ? "4px" : 0 }}
                />
                <span className="text-white/80 text-sm w-20">H: {data.proportions.carbs}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-3 rounded-full bg-rose-500/80"
                  style={{ width: `${data.proportions.protein}%`, minWidth: data.proportions.protein ? "4px" : 0 }}
                />
                <span className="text-white/80 text-sm w-20">P: {data.proportions.protein}%</span>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="h-3 rounded-full bg-sky-500/80"
                  style={{ width: `${data.proportions.fat}%`, minWidth: data.proportions.fat ? "4px" : 0 }}
                />
                <span className="text-white/80 text-sm w-20">G: {data.proportions.fat}%</span>
              </div>
            </div>
            <p className="mt-3 text-white/50 text-xs">
              Total: {data.totalProtein}g P · {data.totalFat}g G · {data.totalCarbs}g H
            </p>
          </div>
        </div>
      )}

      {!loading && data && data.byDay && data.byDay.length > 0 && (
        <div className="rounded-2xl sm:rounded-3xl bg-white/[0.04] border border-white/[0.06] p-4 sm:p-6 min-w-0 overflow-hidden">
          <h2 className="text-lg font-semibold text-white mb-4">Detalle por día</h2>
          <p className="text-white/50 text-xs mb-4">
            Ingerido y gastado por día. El gastado = TMB×NEAT (con el peso de ese día) + actividad. No usa el peso medio del periodo. Pulsa en un día para ver comidas y actividad.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[240px]">
              <thead>
                <tr className="text-white/45 text-left border-b border-white/[0.06]">
                  <th className="pb-2 pr-4 font-medium">Día</th>
                  <th className="pb-2 pr-4 font-medium text-right">Ingerido</th>
                  <th className="pb-2 pr-4 font-medium text-right">Gastado</th>
                  <th className="pb-2 font-medium text-right">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {data.byDay.map((row) => {
                  if (!row.hasData) {
                    return (
                      <tr key={row.date} className="border-b border-white/[0.04]">
                        <td className="py-2.5 pr-4">
                          <Link
                            href={`/dashboard?date=${row.date}`}
                            className="text-white/90 hover:text-white hover:underline"
                          >
                            {format(new Date(row.date), "EEE d MMM", { locale: es })}
                          </Link>
                        </td>
                        <td colSpan={3} className="py-2.5 text-right text-white/50 italic">
                          Sin datos guardados
                        </td>
                      </tr>
                    );
                  }
                  const diff = row.balance ?? Math.round((row.kcalIn ?? 0) - (row.kcalOut ?? 0));
                  return (
                    <tr key={row.date} className="border-b border-white/[0.04]">
                      <td className="py-2.5 pr-4">
                        <Link
                          href={`/dashboard?date=${row.date}`}
                          className="text-white/90 hover:text-white hover:underline"
                        >
                          {format(new Date(row.date), "EEE d MMM", { locale: es })}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-4 text-right text-white/80 tabular-nums">
                        {Math.round(row.kcalIn ?? 0)} kcal
                      </td>
                      <td className="py-2.5 pr-4 text-right text-white/80 tabular-nums">
                        <span title={row.tmbNeat != null && row.activityKcal != null ? `TMB·NEAT: ${row.tmbNeat} + actividad: ${Math.round(row.activityKcal)}` : undefined}>
                          {Math.round(row.kcalOut ?? 0)} kcal
                          {row.tmbNeat != null && row.activityKcal != null && (
                            <span className="block text-[10px] text-white/40 font-normal">
                              {row.tmbNeat} + {Math.round(row.activityKcal)}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <span
                          className={`inline-block min-w-[4.5rem] rounded-lg px-2 py-0.5 text-right tabular-nums font-medium ${
                            diff < 0
                              ? "bg-emerald-500/20 text-emerald-300"
                              : diff > 0
                                ? "bg-red-500/20 text-red-300"
                                : "text-white/50"
                          }`}
                        >
                          {diff > 0 ? "+" : ""}
                          {diff} kcal
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {!loading && !data && fromStr && toStr && period.id !== "custom" && (
        <p className="text-white/50 text-sm">Sin datos para este periodo.</p>
      )}
    </div>
  );
}
