"use client";

import { useState } from "react";
import { formatDecimal, parseDecimalInput } from "@/lib/format";

export function AddWeightForm({
  dateStr,
  userId,
  currentWeight,
  currentWaist,
  currentMoment,
}: {
  dateStr: string;
  userId: string;
  currentWeight?: number | null;
  currentWaist?: number | null;
  currentMoment?: string | null;
}) {
  const [weight, setWeight] = useState(
    currentWeight != null ? formatDecimal(currentWeight) : ""
  );
  const [waist, setWaist] = useState(
    currentWaist != null ? formatDecimal(currentWaist) : ""
  );
  const [moment, setMoment] = useState<"start" | "end">(
    (currentMoment as "start" | "end") ?? "start"
  );
  const [loading, setLoading] = useState(false);

  const weightNum = parseDecimalInput(weight);
  const weightValid = weightNum != null && weightNum > 0;
  const waistNum = parseDecimalInput(waist);
  const waistValid = waistNum == null || waistNum >= 0;
  const canSave = weightValid && waistValid;

  const handleSave = async () => {
    if (!weightValid || weightNum == null) return;
    setLoading(true);
    await fetch("/api/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: dateStr,
        weightKg: weightNum,
        waistCm: waist.trim() === "" ? null : waistNum ?? undefined,
        moment,
      }),
    });
    setLoading(false);
    window.location.reload();
  };

  const currentForStep = weightNum ?? currentWeight ?? 70;
  const handleWeightMinus = () =>
    setWeight(formatDecimal(Math.max(20, currentForStep - 0.5)));
  const handleWeightPlus = () =>
    setWeight(formatDecimal(currentForStep + 0.5));

  return (
    <section className="mb-6">
      <h2 className="text-[11px] font-medium text-white/45 uppercase tracking-widest mb-4">Peso / cintura</h2>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-0.5 bg-white/[0.06] rounded-2xl border border-white/[0.08] p-1">
          <button
            type="button"
            onClick={handleWeightMinus}
            className="w-10 h-10 rounded-xl text-white/50 hover:text-white no-min-touch"
          >
            −
          </button>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Peso"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-16 px-2 py-2 rounded-xl bg-transparent border-0 text-white text-center text-sm tabular-nums focus:ring-0 placeholder:text-white/30"
          />
          <button
            type="button"
            onClick={handleWeightPlus}
            className="w-10 h-10 rounded-xl text-white/50 hover:text-white no-min-touch"
          >
            +
          </button>
        </div>
        <span className="text-white/40 text-sm">kg</span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="Cintura (cm)"
          value={waist}
          onChange={(e) => setWaist(e.target.value)}
          className="w-20 px-3 py-2 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-center text-sm tabular-nums placeholder:text-white/30 focus:border-white/20 focus:outline-none"
        />
        <span className="text-white/40 text-sm">cm</span>
        <div className="flex gap-1" title="Inicio o fin de día">
          <button
            type="button"
            onClick={() => setMoment("start")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium no-min-touch ${moment === "start" ? "bg-emerald-500/90 text-white" : "bg-white/[0.08] text-white/60 hover:bg-white/[0.12]"}`}
            title="Inicio del día"
          >
            ☀ Inicio
          </button>
          <button
            type="button"
            onClick={() => setMoment("end")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium no-min-touch ${moment === "end" ? "bg-emerald-500/90 text-white" : "bg-white/[0.08] text-white/60 hover:bg-white/[0.12]"}`}
            title="Fin del día"
          >
            🌙 Fin
          </button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !canSave}
          className="px-5 py-2.5 rounded-full bg-white/[0.08] border border-white/[0.08] text-sm text-white/80 hover:bg-white/[0.12] disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
    </section>
  );
}
