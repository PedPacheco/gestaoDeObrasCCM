"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ExecutionTooltip } from "@/components/entryComponents/edpExecution/ExecutionTooltip";
import { CenarioAtualItem, MotivosPorEmpreiteira } from "@/utils/reclamacoesOuvidoria/metrics";
import { NUM } from "@/utils/formatValue";

const DARK_BLUE = "#1d3a5f";
const CYAN = "#38bdf8";
const AXIS_TICK = { fill: "#94a3b8", fontSize: 11 };

export function ReclamacoesCenarioAtualChart({ items }: { items: CenarioAtualItem[] }) {
  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col gap-4">
      <h3 className="text-white font-bold text-sm tracking-wide uppercase">Cenário atual — pendentes por empreiteira</h3>

      {items.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-zinc-500 text-sm">
          Nenhuma reclamação pendente no momento.
        </div>
      ) : (
        <>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={items} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="empreiteira" tick={AXIS_TICK} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={AXIS_TICK} width={30} allowDecimals={false} />
                <Tooltip cursor={{ fill: "#ffffff08" }} content={<ExecutionTooltip formatter={(v) => NUM(v)} />} />
                <Legend formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>} />
                <Bar dataKey="dentroPrazo" name="Dentro do Prazo" stackId="prazo" fill={DARK_BLUE} radius={[0, 0, 0, 0]} />
                <Bar dataKey="foraPrazo" name="Fora do Prazo" stackId="prazo" fill={CYAN} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <tbody>
                <tr>
                  <td className="py-1.5 pr-3 text-zinc-400 font-semibold whitespace-nowrap">Fora do Prazo</td>
                  {items.map((item) => (
                    <td key={item.empreiteira} className="py-1.5 px-2 text-white font-bold text-center">
                      {NUM(item.foraPrazo)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-white/5">
                  <td className="py-1.5 pr-3 text-zinc-400 font-semibold whitespace-nowrap">Dentro do Prazo</td>
                  {items.map((item) => (
                    <td key={item.empreiteira} className="py-1.5 px-2 text-white font-bold text-center">
                      {NUM(item.dentroPrazo)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-white/10">
                  <td className="py-1.5 pr-3 text-zinc-500 whitespace-nowrap">Empreiteira</td>
                  {items.map((item) => (
                    <td key={item.empreiteira} className="py-1.5 px-2 text-zinc-400 text-center truncate max-w-[90px]">
                      {item.empreiteira}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export function ReclamacoesMotivosTable({ grupos }: { grupos: MotivosPorEmpreiteira[] }) {
  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl overflow-hidden flex flex-col">
      <div className="grid grid-cols-[1fr_2fr] bg-[#0d1b30] px-5 py-3">
        <span className="text-white font-bold text-xs uppercase tracking-wide">Parceira</span>
        <span className="text-white font-bold text-xs uppercase tracking-wide">Motivos das reclamações</span>
      </div>

      {grupos.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-zinc-500 text-sm">
          Nenhuma reclamação pendente no momento.
        </div>
      ) : (
        <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
          {grupos.map((grupo) => (
            <div key={grupo.empreiteira} className="grid grid-cols-[1fr_2fr] px-5 py-3 gap-3">
              <span className="text-slate-200 text-xs font-semibold">{grupo.empreiteira}</span>
              <div className="flex flex-col gap-1">
                {grupo.itens.map((item, index) => (
                  <span key={index} className="text-zinc-400 text-xs">
                    {String(item.count).padStart(2, "0")} – {item.motivo}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
