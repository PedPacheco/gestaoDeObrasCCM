import { ReactNode } from "react";
import { RingCard } from "./RingCard";

interface SubItens {
  subLabel: string;
  subValue: string;
}

export function KpiCard({
  label,
  sub,
  value,
  gradient,
  accent,
  onClick,
  ringCard,
}: {
  label: string;
  sub?: SubItens[];
  value: string | number;
  gradient: string;
  accent: string;
  onClick?: () => void;
  ringCard?: ReactNode;
}) {
  const isClickable = !!onClick;

  const hasSubItems = !!sub?.length;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl p-4 flex flex-col gap-2 overflow-hidden shadow-lg h-[120px]
        ${gradient}
        transition-all duration-200
        ${isClickable ? "cursor-pointer hover:scale-[1.02] hover:shadow-2xl active:scale-[0.99]" : ""}
      `}
    >
      {/* Accent bar */}
      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
        style={{ background: accent }}
      />

      <div className="pl-3 flex items-start justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-white/60 text-xs uppercase tracking-widest font-medium">
            {label}
          </span>

          <span className="font-black text-3xl text-white leading-none pt-2">
            {value}
          </span>
        </div>

        {ringCard}
      </div>

      {hasSubItems && (
        <div className="pl-3 grid grid-cols-2 gap-x-3">
          {sub.map((item, index) => (
            <div key={index} className="flex items-center gap-1 min-w-0">
              <span className="text-sm text-white/60 truncate w-28">
                {item.subLabel}
              </span>

              <span className="text-sm text-zinc-200 font-medium truncate">
                {item.subValue}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
