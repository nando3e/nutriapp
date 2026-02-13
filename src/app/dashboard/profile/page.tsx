"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { formatDecimal } from "@/lib/format";
import { mifflinStJeor, ageFromBirthDate } from "@/lib/tmb";

type Profile = {
  name: string | null;
  sex: string | null;
  birthDate: string | null;
  heightCm: number | null;
  targetWeightKg: number | null;
  targetDate: string | null;
  calorieGoal: number | null;
  proteinGoal: number | null;
  fatGoal: number | null;
  carbGoal: number | null;
  neatFactor?: number | null;
  latestWeightKg?: number | null;
  latestWeightDate?: string | null;
};

function toStr(v: number | null | undefined, def: number): string {
  if (v == null || Number.isNaN(v)) return "";
  return String(v);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [sex, setSex] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [targetWeightKg, setTargetWeightKg] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [calorieGoal, setCalorieGoal] = useState("");
  const [proteinGoal, setProteinGoal] = useState("");
  const [fatGoal, setFatGoal] = useState("");
  const [carbGoal, setCarbGoal] = useState("");
  const [neatFactor, setNeatFactor] = useState<1.1 | 1.15 | 1.2>(1.15);

  const [weightForTmbKg, setWeightForTmbKg] = useState<number | null>(null);

  const { tmb, neatKcal, totalKcal, canComputeTmb, weightUsedKg, weightUsedSource } = useMemo(() => {
    const height = heightCm === "" ? null : Number(heightCm);
    const age = ageFromBirthDate(birthDate || null);
    const sexOk = sex === "male" || sex === "female";
    const targetW = targetWeightKg === "" ? null : Number(targetWeightKg);
    const targetValid = targetW != null && !Number.isNaN(targetW) && targetW > 0;
    const weight = weightForTmbKg ?? (targetValid ? targetW : null);
    const can = weight != null && weight > 0 && height != null && !Number.isNaN(height) && height > 0 && age != null && sexOk;
    if (!can) {
      return { tmb: null, neatKcal: null, totalKcal: null, canComputeTmb: false, weightUsedKg: null, weightUsedSource: null as "registro" | "objetivo" | null };
    }
    const tmbVal = mifflinStJeor(weight, height, age, sex);
    const neat = tmbVal * (neatFactor - 1);
    return {
      tmb: Math.round(tmbVal),
      neatKcal: Math.round(neat),
      totalKcal: Math.round(tmbVal * neatFactor),
      canComputeTmb: true,
      weightUsedKg: weight,
      weightUsedSource: weightForTmbKg != null ? "registro" : "objetivo",
    };
  }, [birthDate, sex, heightCm, targetWeightKg, weightForTmbKg, neatFactor]);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p) {
          setProfile(p);
          setName(p.name ?? "");
          setSex(p.sex ?? "");
          setBirthDate(p.birthDate ?? "");
          setHeightCm(toStr(p.heightCm, 0));
          setTargetWeightKg(toStr(p.targetWeightKg, 0));
          setTargetDate(p.targetDate ?? "");
          setCalorieGoal(toStr(p.calorieGoal, 1700));
          setProteinGoal(toStr(p.proteinGoal, 180));
          setFatGoal(toStr(p.fatGoal, 0));
          setCarbGoal(toStr(p.carbGoal, 0));
          if (p.latestWeightKg != null && p.latestWeightKg > 0) {
            setWeightForTmbKg(p.latestWeightKg);
          } else {
            setWeightForTmbKg(null);
          }
          const nf = p.neatFactor != null ? Number(p.neatFactor) : 1.15;
          setNeatFactor(nf === 1.1 ? 1.1 : nf === 1.2 ? 1.2 : 1.15);
        } else {
          setCalorieGoal("1700");
          setProteinGoal("180");
          setWeightForTmbKg(null);
        }
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const body = {
      name: name.trim() || null,
      sex: sex || null,
      birthDate: birthDate || null,
      heightCm: heightCm === "" ? null : Number(heightCm),
      targetWeightKg: targetWeightKg === "" ? null : Number(targetWeightKg),
      targetDate: targetDate || null,
      calorieGoal: calorieGoal === "" ? 1700 : Number(calorieGoal),
      proteinGoal: proteinGoal === "" ? 180 : Number(proteinGoal),
      fatGoal: fatGoal === "" ? null : Number(fatGoal),
      carbGoal: carbGoal === "" ? null : Number(carbGoal),
      neatFactor,
    };
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Error al guardar" });
        return;
      }
      setMessage({ type: "ok", text: "Perfil guardado correctamente." });
    } catch {
      setMessage({ type: "error", text: "Error de conexión" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-white/50">Cargando…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-white tracking-tight">Mi perfil</h1>
      {message && (
        <p
          className={`p-4 rounded-2xl text-sm ${
            message.type === "ok" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
          }`}
        >
          {message.text}
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm text-white/50 mb-1">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white focus:border-white/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Sexo (para TMB)</label>
          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white focus:border-white/20 focus:outline-none"
          >
            <option value="">—</option>
            <option value="male">Hombre</option>
            <option value="female">Mujer</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Fecha de nacimiento</label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white focus:border-white/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Altura (cm)</label>
          <input
            type="text"
            inputMode="numeric"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="Ej. 175"
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Peso objetivo (kg)</label>
          <input
            type="text"
            inputMode="decimal"
            value={targetWeightKg}
            onChange={(e) => setTargetWeightKg(e.target.value.replace(/[^0-9.,]/g, ""))}
            placeholder="Ej. 82"
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Fecha objetivo</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white focus:border-white/20 focus:outline-none"
          />
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
          <h2 className="text-sm font-medium text-white/80">Gasto energético de referencia</h2>
          <p className="text-[11px] text-white/50 uppercase tracking-wider">TMB (Mifflin-St Jeor) según edad, altura, peso y sexo</p>
          {canComputeTmb ? (
            <>
              {weightUsedKg != null && (
                <p className="text-xs text-white/60">
                  Calculado con <strong className="text-white/90 tabular-nums">{formatDecimal(weightUsedKg)} kg</strong>
                  {weightUsedSource === "registro" && " (último registro de Mediciones)"}
                  {weightUsedSource === "objetivo" && " (peso objetivo, sin registros)"}
                </p>
              )}
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
                <span className="text-white/60">TMB</span>
                <span className="text-white font-medium tabular-nums">{tmb} kcal/día</span>
              </div>
              <div>
                <label className="block text-[11px] text-white/50 uppercase tracking-wider mb-1.5">Actividad mínima (NEAT)</label>
                <div className="flex gap-2 flex-wrap">
                  {([1.1, 1.15, 1.2] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setNeatFactor(f)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium no-min-touch ${
                        neatFactor === f ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-white/[0.06] text-white/60 hover:bg-white/[0.1] border border-white/[0.06]"
                      }`}
                    >
                      {f === 1.1 ? "10%" : f === 1.15 ? "15%" : "20%"}
                    </button>
                  ))}
                </div>
                <p className="text-white/50 text-xs mt-1.5 tabular-nums">
                  NEAT = {neatKcal} kcal/día · Total = <strong className="text-white/90">{totalKcal} kcal/día</strong>
                </p>
              </div>
              <p className="text-white/40 text-xs border-t border-white/[0.06] pt-2 mt-2">
                NEAT (actividad no deportiva) suele ser un 10–20% del TMB (factor 1,10 a 1,20). El total es TMB + NEAT, sin incluir ejercicio.
              </p>
            </>
          ) : (
            <p className="text-white/40 text-sm">Completa sexo, fecha de nacimiento, altura y peso objetivo para ver el TMB.</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-white/50 mb-1">Meta calorías/día</label>
          <input
            type="text"
            inputMode="numeric"
            value={calorieGoal}
            onChange={(e) => setCalorieGoal(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="1700"
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Meta proteína (g/día)</label>
          <input
            type="text"
            inputMode="numeric"
            value={proteinGoal}
            onChange={(e) => setProteinGoal(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="180"
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Meta grasas (g/día, opcional)</label>
          <input
            type="text"
            inputMode="numeric"
            value={fatGoal}
            onChange={(e) => setFatGoal(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Opcional"
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-1">Meta hidratos (g/día, opcional)</label>
          <input
            type="text"
            inputMode="numeric"
            value={carbGoal}
            onChange={(e) => setCarbGoal(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Opcional"
            className="w-full px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white placeholder-white/30 focus:border-white/20 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-full bg-emerald-500/90 text-white font-medium hover:bg-emerald-400 disabled:opacity-50 transition-colors"
        >
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </form>
      <p className="text-sm text-white/50">
        <Link href="/dashboard" className="text-emerald-400 hover:underline">
          ← Volver
        </Link>
      </p>
    </div>
  );
}
