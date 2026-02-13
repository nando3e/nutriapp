type MacroBarProps = {
  label: string;
  value: number;
  goal: number;
  unit: string;
  showNumeric: boolean;
  variant?: "default" | "goal" | "over";
};

export function MacroBar({
  label,
  value,
  goal,
  unit,
  showNumeric,
  variant = "default",
}: MacroBarProps) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 120) : 0;
  const barColor =
    variant === "over"
      ? "bg-red-500/80"
      : variant === "goal"
        ? "bg-emerald-500/80"
        : "bg-amber-500/80";

  return (
    <div>
      <div className="flex justify-between text-sm mb-0.5">
        <span className="text-white/50">{label}</span>
        {showNumeric && (
          <span>
            {value} / {goal} {unit}
          </span>
        )}
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
