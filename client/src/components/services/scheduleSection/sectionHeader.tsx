import { ChevronDownIcon } from "@heroicons/react/20/solid";

export function SectionHeader({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between px-5 py-4 text-left bg-zinc-100 hover:bg-zinc-200 transition-colors rounded mb-3 shadow-md"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {title}
        </span>
        {children}
      </div>
      <ChevronDownIcon
        height={10}
        width={10}
        className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
}
