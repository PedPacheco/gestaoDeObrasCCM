import { CountItem } from "@/app/(dashboard)/restricoes/recursos-contingencia/page";
import { NUM } from "@/utils/formatValue";
import { memo } from "react";

interface BarListCardProps {
  title: string;
  items: CountItem[];
  maxValue?: number;
  barColor?: string;
}

export const BarListCard = memo(function BarListCard({
  title,
  items,
  barColor = "#3b82f6",
}: BarListCardProps) {
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="bg-gradient-to-br from-[#1a2d42] to-[#182333] rounded-2xl p-5 border border-white/8 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white font-bold text-sm uppercase tracking-wide">
          {title}
        </span>
      </div>

      <div className="h-60 flex flex-col">
        <div className="flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-2.5">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-zinc-300 text-sm w-40 shrink-0">
                  {item.name}
                </span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.value / maxValue) * 100}%`,
                      background: barColor,
                    }}
                  />
                </div>
                <span className="text-white font-bold text-sm whitespace-nowrap w-5 text-right shrink-0 mr-2">
                  {NUM(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
