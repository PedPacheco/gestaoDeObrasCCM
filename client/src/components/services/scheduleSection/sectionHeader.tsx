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
      className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-gray-50"
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
          {title}
        </span>
        {children}
      </div>
      <ChevronDownIcon
        height={10}
        width={10}
        className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      />
    </button>
  );
}
