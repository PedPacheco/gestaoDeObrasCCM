export function KpiCard({
  label,
  value,
  gradient,
  accent,
}: {
  label: string;
  value: string | number;
  gradient: string;
  accent: string;
}) {
  return (
    <>
      <div
        className={`relative rounded-2xl p-5 flex flex-col gap-2 overflow-hidden shadow-lg ${gradient} h-28`}
      >
        <div
          className="absolute top-0 left-0 w-1 h-full rounded-l-2xl"
          style={{ background: accent }}
        />
        <span className="text-white/60 text-xs uppercase tracking-widest font-medium pl-2">
          {label}
        </span>
        <span className="text-4xl font-black text-white pl-2 leading-none">
          {value}
        </span>
      </div>
    </>
  );
}
