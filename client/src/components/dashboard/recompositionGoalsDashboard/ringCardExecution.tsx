export function RingCardExecution({
  label,
  subLabel,
  value,
  color,
  sub,
}: {
  label: string;
  subLabel?: string;
  value: number;
  color: string;
  sub?: string;
}) {
  const pct = Math.max(value, 0);
  const visualPct = Math.min(pct, 100);

  const radius = 42;
  const stroke = 8;

  const circ = 2 * Math.PI * radius;
  const offset = circ - (visualPct / 100) * circ;

  return (
    <div className="flex items-center gap-3 bg-transparent rounded-xl p-3 h-[84px]">
      <div className="relative shrink-0 flex items-center justify-center w-[120] h-[120px]">
        <svg width={120} height={120} viewBox="0 0 140 140">
          <circle
            cx={70}
            cy={70}
            r={radius}
            fill="none"
            stroke="#ffffff08"
            strokeWidth={stroke}
          />

          <circle
            cx={70}
            cy={70}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-black leading-none" style={{ color }}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-white font-semibold text-sm leading-tight">
          {label}
        </span>

        {subLabel && <span className="text-zinc-300 text-xs">{subLabel}</span>}

        {sub && <span className="text-zinc-300 text-xs truncate">{sub}</span>}

        <div className="w-full h-1 bg-white/5 rounded-full mt-1">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${visualPct}%`,
              background: color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
