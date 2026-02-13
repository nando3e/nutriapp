"use client";

import Link from "next/link";

type HoyTabsProps = {
  dateStr: string;
  view: "comidas" | "actividad" | "mediciones";
};

export function HoyTabs({ dateStr, view }: HoyTabsProps) {
  const base = `/dashboard?date=${dateStr}`;
  return (
    <div className="grid grid-cols-3 sm:flex rounded-2xl bg-white/[0.04] border border-white/[0.06] p-1 w-full sm:w-fit min-w-0">
      <Link
        href={`${base}&view=comidas`}
        className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-center no-min-touch transition-colors ${
          view === "comidas"
            ? "bg-white/[0.1] text-white"
            : "text-white/60 hover:text-white/80"
        }`}
      >
        Comidas
      </Link>
      <Link
        href={`${base}&view=actividad`}
        className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-center no-min-touch transition-colors ${
          view === "actividad"
            ? "bg-white/[0.1] text-white"
            : "text-white/60 hover:text-white/80"
        }`}
      >
        Actividad
      </Link>
      <Link
        href={`${base}&view=mediciones`}
        className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium text-center no-min-touch transition-colors ${
          view === "mediciones"
            ? "bg-white/[0.1] text-white"
            : "text-white/60 hover:text-white/80"
        }`}
      >
        Mediciones
      </Link>
    </div>
  );
}
