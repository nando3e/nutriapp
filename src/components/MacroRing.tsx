type MacroRingProps = {
  label: string;
  value: number;
  goal: number;
  unit: string;
  showNumeric: boolean;
  variant?: "default" | "goal" | "over";
};

const SIZE = 72;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function MacroRing({
  label,
  value,
  goal,
  unit,
  showNumeric,
  variant = "default",
}: MacroRingProps) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  const strokeDash = (pct / 100) * CIRCUMFERENCE;
  const ringColor =
    variant === "over"
      ? "stroke-red-400/90"
      : variant === "goal"
        ? "stroke-emerald-400/90"
        : "stroke-amber-400/80";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-white/[0.08]"
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            className={ringColor}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE - strokeDash}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showNumeric ? (
            <>
              <span className="text-base font-semibold tabular-nums text-white leading-none">
                {value}
              </span>
              <span className="text-[10px] text-white/40 leading-none">{unit}</span>
            </>
          ) : (
            <span className="text-lg font-semibold text-white/70">{Math.round(pct)}%</span>
          )}
        </div>
      </div>
      <p className="text-[11px] font-medium text-white/50 uppercase tracking-wider text-center">
        {label}
      </p>
      {showNumeric && (
        <p className="text-[10px] text-white/40">
          {goal} {unit} meta
        </p>
      )}
    </div>
  );
}
