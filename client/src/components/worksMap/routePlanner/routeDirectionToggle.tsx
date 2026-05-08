import { RouteDirection } from "@/hooks/routePlanner/useRouteNavigation";

interface Props {
  value: RouteDirection;
  onChange: (direction: RouteDirection) => void;
}

const OPTIONS: Array<{
  value: RouteDirection;
  label: string;
  description: string;
}> = [
  {
    value: "outbound",
    label: "Ida",
    description: "Partida → obra mais distante",
  },
  {
    value: "return",
    label: "Volta",
    description: "Obra mais distante → partida",
  },
];

export function RouteDirectionToggle({ value, onChange }: Props) {
  return (
    <div className="px-4 py-3 border-b border-zinc-200 bg-zinc-50">
      <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-2">
        Sentido da rota
      </div>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={`flex-1 text-xs py-1.5 px-2 rounded-lg font-medium transition-colors text-left leading-tight ${
                active
                  ? "bg-[#212E3E] text-white"
                  : "bg-zinc-200 text-zinc-600 hover:bg-zinc-300"
              }`}
            >
              <div>{opt.label}</div>
              <div
                className={`font-normal mt-0.5 ${active ? "text-zinc-300" : "text-zinc-400"}`}
              >
                {opt.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
