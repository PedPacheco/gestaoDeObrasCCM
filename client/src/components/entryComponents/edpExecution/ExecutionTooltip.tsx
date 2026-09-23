interface TooltipEntry {
  name: string;
  value: number;
  color?: string;
  fill?: string;
}

interface ExecutionTooltipProps {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
  formatter?: (value: number) => string;
}

export function ExecutionTooltip({
  active,
  label,
  payload,
  formatter,
}: ExecutionTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 shadow-2xl backdrop-blur-sm min-w-[180px]">
      {label && (
        <div className="font-bold text-white mb-2 text-sm">{label}</div>
      )}

      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: entry.color ?? entry.fill }}
          />
          <span className="text-zinc-400">{entry.name}:</span>
          <span className="font-bold text-white">
            {formatter ? formatter(entry.value) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
