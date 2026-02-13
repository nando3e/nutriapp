"use client";

import { useState, useEffect } from "react";

type Activity = {
  id: string;
  name: string;
  met: number;
};

export function AddActivityForm({ dateStr, userId }: { dateStr: string; userId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [mode, setMode] = useState<"activity" | "manual">("activity");
  const [selectedId, setSelectedId] = useState<string>("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [manualKcal, setManualKcal] = useState(200);
  const [wahooCorrection, setWahooCorrection] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/activities")
      .then((r) => r.json())
      .then(setActivities);
  }, []);

  const handleAdd = async () => {
    setLoading(true);
    if (mode === "manual") {
      await fetch("/api/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          activityId: null,
          durationMinutes: null,
          manualKcal,
          wahooCorrection,
        }),
      });
    } else if (selectedId) {
      await fetch("/api/activity-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateStr,
          activityId: selectedId,
          durationMinutes,
          manualKcal: null,
          wahooCorrection: false,
        }),
      });
    }
    setLoading(false);
    window.location.reload();
  };

  return (
    <section className="mb-6">
      <h2 className="text-[11px] font-medium text-white/45 uppercase tracking-widest mb-4">Añadir actividad</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("activity")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${mode === "activity" ? "bg-emerald-500/90 text-white" : "bg-white/[0.08] text-white/60 hover:bg-white/[0.12]"}`}
        >
          Por actividad
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${mode === "manual" ? "bg-emerald-500/90 text-white" : "bg-white/[0.08] text-white/60 hover:bg-white/[0.12]"}`}
        >
          Calorías manual (Wahoo)
        </button>
      </div>
      {mode === "activity" ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm min-w-[140px] focus:border-white/20 focus:outline-none"
          >
            <option value="">Seleccionar</option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          {activities.length === 0 && (
            <a href="/dashboard/activities" className="text-emerald-400 text-sm hover:underline">
              Añadir actividades
            </a>
          )}
          {selectedId && (
            <>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDurationMinutes((d) => Math.max(5, d - 5))}
                  className="w-10 h-10 rounded-full border border-white/[0.1] text-white/50 hover:text-white no-min-touch"
                >
                  −
                </button>
                <span className="w-16 text-center text-white">{durationMinutes} min</span>
                <button
                  type="button"
                  onClick={() => setDurationMinutes((d) => d + 5)}
                  className="w-10 h-10 rounded-full border border-white/[0.1] text-white/50 hover:text-white no-min-touch"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={loading}
                className="px-5 py-2.5 rounded-full bg-emerald-500/90 text-white font-medium text-sm hover:bg-emerald-400"
              >
                Añadir
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setManualKcal((k) => Math.max(0, k - 50))}
              className="w-10 h-10 rounded-full border border-white/[0.1] text-white/50 hover:text-white no-min-touch"
            >
              −
            </button>
            <input
              type="number"
              value={manualKcal}
              onChange={(e) => setManualKcal(Number(e.target.value) || 0)}
              className="w-20 px-2 py-2 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-center"
            />
            <button
              type="button"
              onClick={() => setManualKcal((k) => k + 50)}
              className="w-10 h-10 rounded-full border border-white/[0.1] text-white/50 hover:text-white no-min-touch"
            >
              +
            </button>
          </div>
          <span className="text-white/50 text-sm">kcal (dispositivo)</span>
          <label className="flex items-center gap-1 text-sm">
            <input
              type="checkbox"
              checked={wahooCorrection}
              onChange={(e) => setWahooCorrection(e.target.checked)}
            />
            Aplicar −20% (Wahoo)
          </label>
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="px-5 py-2.5 rounded-full bg-emerald-500/90 text-white font-medium text-sm hover:bg-emerald-400"
          >
            Añadir
          </button>
        </div>
      )}
    </section>
  );
}
