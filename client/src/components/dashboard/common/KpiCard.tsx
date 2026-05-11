export function KpiCard({
  label,
  value,
  gradient,
  accent,
  onClick,
}: {
  label: string;
  value: string | number;
  gradient: string;
  accent: string;
  onClick?: () => void;
}) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl p-5 flex flex-col gap-2 overflow-hidden shadow-lg h-28
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

      {/* Label */}
      <span className="text-white/60 text-xs uppercase tracking-widest font-medium pl-2">
        {label}
      </span>

      {/* Value */}
      <span className="text-4xl font-black text-white pl-2 leading-none">
        {value}
      </span>
    </div>
  );
}
