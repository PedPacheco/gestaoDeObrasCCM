import { FormatCurrency } from "@/utils/formatValue";
import { UserGroupIcon } from "@heroicons/react/20/solid";
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
    <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <Tooltip title={service.textoBreve} arrow>
        <p className="mb-0.5 truncate text-[12.5px] font-medium text-gray-900">
          {service.textoBreve}
        </p>
      </Tooltip>

      <p className="text-[11px] text-gray-400">
        {service.operacao} · {service.ponto} ·{" "}
        {FormatCurrency(service.valorUnit)}
      </p>

      <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2">
        <Chip
          icon={<UserGroupIcon className="h-3 w-3" />}
          label={equipeLabel}
          size="small"
          sx={{ backgroundColor: "#E6F1FB", color: "#185FA5", fontSize: 11 }}
        />
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent text-[11px] text-blue-500 hover:underline"
          onClick={onDelete}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
