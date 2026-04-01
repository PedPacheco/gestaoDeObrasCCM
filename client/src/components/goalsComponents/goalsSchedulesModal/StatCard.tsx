interface StatCardProps {
  label: string;
  value: string | null;
  valueClass?: string;
}

export default function StatCard({
  label,
  value,
  valueClass = "text-gray-900",
}: StatCardProps) {
  return (
    <div className="flex-1 flex flex-col gap-0.5 px-4 py-3 border-r border-gray-200 last:border-r-0 hover:bg-green-50/40 transition-colors duration-150">
      <span className="text-lg tracking-widest font-semibold text-gray-400">
        {label}
      </span>
      <span
        className={`font-mono text-base font-medium leading-tight ${valueClass}`}
      >
        {value}
      </span>
    </div>
  );
}
