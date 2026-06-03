import { FormatCurrency, formatPercentage, NUM } from "@/utils/formatValue";

export function ChartTooltip({
  active,
  payload,
  label,
  metricConfig,
  percentageFields,
}: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0]?.payload; // 🔥 fonte de verdade
  const turma = data?.turma as string | undefined;

  return (
    <div className="bg-[#0f1e2e]/95 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-100 shadow-2xl backdrop-blur-sm min-w-[220px]">
      {turma && <div className="text-zinc-400 text-xs mb-0.5">{turma}</div>}

      {label && (
        <div className="font-bold text-white mb-2 text-sm">{label}</div>
      )}

      {/* 🔹 dados do gráfico */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: p.color ?? p.fill }}
          />
          <span className="text-zinc-400">{p.name}:</span>
          <span className="font-bold text-white">
            {percentageFields?.includes(p.dataKey)
              ? formatPercentage(p.value)
              : metricConfig === "number"
                ? NUM(p.value)
                : FormatCurrency(p.value)}
          </span>
        </div>
      ))}

      {/* 🔥 SEPARADOR */}
      <div className="border-t border-white/10 my-2" />

      {/* 🔥 ITEM EXTRA (não precisa existir no gráfico) */}
      {data?.["Diferença Acum."] != null && (
        <div className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#a78bfa" }} // violet
          />
          <span className="text-zinc-400">Diferença Acum.:</span>
          <span
            className={`font-bold ${data["Diferença Acum."] > 0 ? "text-green-400" : "text-red-500"}`}
          >
            {data["Diferença Acum."] > 0
              ? `+${data["Diferença Acum."]}`
              : data["Diferença Acum."]}
          </span>
        </div>
      )}

      {data?.["count"] && (
        <div className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#a78bfa" }} // violet
          />
          <span className="text-zinc-400">Quantidade</span>
          <span className="text-zinc-400">{data["count"]}</span>
        </div>
      )}

      {data?.["moNaoExecutada"] && (
        <div className="flex items-center gap-2 py-0.5">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: "#a78bfa" }} // violet
          />
          <span className="text-zinc-400">MO não executada</span>
          <span className="text-zinc-400">
            {FormatCurrency(data["moNaoExecutada"])}
          </span>
        </div>
      )}
    </div>
  );
}
