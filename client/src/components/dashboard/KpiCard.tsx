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
        className={`relative rounded-2xl p-5 flex flex-col gap-2 overflow-hidden shadow-lg ${gradient}`}
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

      {/* <div
        key={label}
        className={`relative rounded-2xl p-5 flex flex-col gap-2 overflow-hidden shadow-lg bg-gradient-to-br ${gradient} cursor-pointer transition-all duration-200 hover:scale-[1.02] select-none`}
      >
        <div
          className="absolute top-0 left-0 w-1 h-full rounded-l-2xl transition-all duration-300"
          style={{ background: accent, opacity: 0.7 }}
        />

        <div className="flex items-center justify-between pl-2">
          <span className="text-white/75 text-sm uppercase tracking-widest font-medium">
            {label}
          </span>
        </div>

        <span className="text-xl font-black text-white pl-2 leading-none">
          {value}
        </span>
      </div> */}
    </>
  );
}
