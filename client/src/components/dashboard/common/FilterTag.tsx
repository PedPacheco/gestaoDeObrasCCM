export function FilterTag({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "blue" | "default";
}) {
  const cls =
    variant === "blue"
      ? "bg-[#3b82f6]/15 border-[#3b82f6]/30 text-[#60a5fa]"
      : "bg-white/5 border-white/10 text-zinc-400";
  return (
    <span className={`text-[10px] border rounded-full px-2 py-0.5 ${cls}`}>
      {label}
    </span>
  );
}
