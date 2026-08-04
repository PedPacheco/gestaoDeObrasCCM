import { SECTOR_COLORS } from "@/constants/gapAnalysis/gapAnalysis";

export function PartnerAuditCardHeader({
  title,
  sector,
}: {
  title: string;
  sector: string;
}) {
  const dot = SECTOR_COLORS[sector] ?? "bg-slate-400";
  return (
    <th
      className="px-3 py-3 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[175px]"
      style={{ background: "#071220" }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-2 leading-tight">{title}</span>
        <span className="flex items-center gap-1 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className="text-[11px] text-slate-500 uppercase font-black tracking-tight">
            {sector}
          </span>
        </span>
      </div>
    </th>
  );
}
