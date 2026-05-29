export function ChartCard({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl ${className}`}
    >
      <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}
