export function RingCard({
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
  const radius = 36;
  const stroke = 6;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (visualPct / 100) * circ;

  return (
    <div
      className="
        flex items-center gap-3 sm:gap-4
        bg-gradient-to-br from-[#1e2f42] to-[#192535]
        rounded-xl sm:rounded-2xl
        p-3 sm:p-4 lg:p-5
        min-h-[100px] sm:h-[118px]
        border border-white/5 shadow-xl
        hover:border-white/10 transition-all
      "
    >
      {/* Ring */}
      <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-[88px] lg:h-[88px]">
        <svg className="w-full h-full" viewBox="0 0 88 88">
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
          <span
            className="text-base sm:text-lg lg:text-xl font-black leading-none"
            style={{ color }}
          >
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1">
        <span className="text-white font-bold text-sm sm:text-base lg:text-lg leading-tight truncate">
          {label}
        </span>

        {subLabel && (
          <span className="text-zinc-300 text-xs sm:text-sm truncate">
            {subLabel}
          </span>
        )}

        {sub && (
          <span className="text-zinc-300 text-xs sm:text-sm truncate">
            {sub}
          </span>
        )}

        <div className="w-full h-0.5 sm:h-1 bg-white/5 rounded-full mt-1">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${visualPct}%`, background: color }}
          />
        </div>
      </div>
    </div>
  );
}
