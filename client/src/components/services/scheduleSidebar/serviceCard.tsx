import { FormatCurrency } from "@/utils/formatValue";
import { TrashIcon, UserGroupIcon } from "@heroicons/react/20/solid";
import { Chip, Tooltip } from "@mui/material";
import { ScheduledService } from "./scheduleSidebar";
import { resolveEquipeLabel } from "@/hooks/useScheduleSidebar";

interface ServiceCardProps {
  service: ScheduledService;
  onDelete: () => void;
}

export function ServiceCard({ service, onDelete }: ServiceCardProps) {
  const equipeLabel = resolveEquipeLabel(service.equipe);

  return (
    <div className="rounded-lg border border-gray-200 bg-white w-fit min-w-full p-2 shadow-sm transition-shadow hover:shadow-md">
      {/* Linha 1 — Operação · Ponto · Valor */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Operação:
          </span>
          <span className="text-sm font-medium text-zinc-800">
            {service.operacao}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-500 ">Ponto:</span>
          <span className="text-sm font-medium text-zinc-800">
            {service.ponto}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-500  tracking-wide">
            Valor:
          </span>
          <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 px-2 rounded">
            {FormatCurrency(service.valorUnit)}
          </span>
        </div>
      </div>

      {/* Linha 2 — Serviço · Plan */}
      <div className="mt-1.5 flex items-start justify-between gap-4">
        <Tooltip title={service.textoBreve} arrow>
          <p className="flex-1 text-sm text-zinc-700 leading-snug line-clamp-2 m-0">
            <span className="text-xs font-semibold text-zinc-500  tracking-wide mr-1.5">
              Serviço:
            </span>
            {service.textoBreve}
          </p>
        </Tooltip>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-zinc-500 tracking-wide">
            Plan:
          </span>
          <span className="text-sm font-medium text-zinc-800">420</span>
        </div>
      </div>

      {/* Linha 3 — Equipe · Ação */}
      <div className="mt-1 flex items-center justify-between border-t border-gray-100 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
            Equipe:
          </span>
          <Chip
            icon={<UserGroupIcon className="h-3.5 w-3.5" />}
            label={equipeLabel}
            size="small"
            sx={{
              backgroundColor: "#E6F1FB",
              color: "#185FA5",
              fontSize: 11,
              fontWeight: 600,
              "& .MuiChip-icon": { color: "#185FA5" },
            }}
          />
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1 cursor-pointer rounded border-none
                    px-2 py-1 text-sm font-semibold text-red-500
                    transition-colors bg-red-100 hover:text-red-700"
          onClick={onDelete}
        >
          <TrashIcon className="h-3.5 w-3.5" />
          Excluir
        </button>
      </div>
    </div>
  );
}
