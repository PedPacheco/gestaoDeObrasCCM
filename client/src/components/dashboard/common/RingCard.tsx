export function RingCard({
  label,
  value,
  color,
  sub,
}: {
  label: string;
  value: number;
  color: string;
  sub?: string;
}) {
  const pct = Math.max(value, 0);
  const visualPct = Math.min(pct, 100);
  const radius = 36;
  const stroke = 6;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (visualPct / 100) * circ;
  return (
    <div className="flex items-center gap-4 bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 h-28 border border-white/5 shadow-xl hover:border-white/10 transition-all">
      <div className="relative shrink-0" style={{ width: 88 }}>
        <svg width={88} height={88} viewBox="0 0 88 88">
          <circle
            cx={44}
            cy={44}
            r={radius}
            fill="none"
            stroke="#ffffff08"
            strokeWidth={stroke}
          />
          <circle
            cx={44}
            cy={44}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 44 44)"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black leading-none" style={{ color }}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-white font-bold text-lg leading-tight">
          {label}
        </span>
        {sub && <span className="text-zinc-300 text-sm">{sub}</span>}
        <div className="w-full h-1 bg-white/5 rounded-full mt-1">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${visualPct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}
