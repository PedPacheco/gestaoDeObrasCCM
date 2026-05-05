import { FormatCurrency } from "@/utils/formatValue";

export function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const turma = payload[0]?.payload?.turma as string | undefined;
  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 shadow-2xl backdrop-blur-sm min-w-[220px]">
      {turma && <div className="text-zinc-400 text-xs mb-0.5">{turma}</div>}
      {label && (
        <div className="font-bold text-white mb-2 text-sm">{label}</div>
      )}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.color ?? p.fill }}
          />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-bold text-white">
            {typeof p.value === "number"
              ? p.value >= 1000
                ? FormatCurrency(p.value)
                : `${p.value.toFixed(1)}`
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
