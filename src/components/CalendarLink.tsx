"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";

export function CalendarLink({ currentDate }: { currentDate: string }) {
  const [date, setDate] = useState(currentDate);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setDate(v);
    if (v) router.push(`/dashboard?date=${v}`);
  };

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
      <label className="text-white/45 text-xs uppercase tracking-widest shrink-0">Fecha</label>
      <input
        type="date"
        value={date}
        onChange={handleChange}
        className="flex-1 min-w-0 sm:flex-initial px-3 sm:px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/[0.08] text-white text-sm focus:border-white/20 focus:outline-none"
      />
      {currentDate !== format(new Date(), "yyyy-MM-dd") && (
        <Link
          href="/dashboard"
          className="text-sm font-medium text-emerald-400/90 hover:text-emerald-300 rounded-full px-3 py-1.5 bg-emerald-500/10"
        >
          Hoy
        </Link>
      )}
    </div>
  );
}
