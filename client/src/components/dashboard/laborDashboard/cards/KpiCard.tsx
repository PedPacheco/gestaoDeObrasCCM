interface KpiCardProps {
  title: string;
  value: string;
}

export function KpiCard({ title, value }: KpiCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-3">
          {/* <Icon className="h-6 w-6" /> */}
          ícone
        </div>
      </div>
    </div>
  );
}
