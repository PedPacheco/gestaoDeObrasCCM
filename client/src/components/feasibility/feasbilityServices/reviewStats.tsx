import {
  ExclamationCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";

interface ReviewStatsProps {
  pendingCount: number;
  changedCount: number;
  readOnly?: boolean;
}

export function ReviewStats({
  pendingCount,
  changedCount,
  readOnly = false,
}: ReviewStatsProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-zinc-500">
        {readOnly
          ? "Quantidade viabilizada de cada item da obra."
          : "Informe a quantidade viabilizada de cada item da obra."}
      </p>

      <div className="flex items-center gap-2">
        {!readOnly && pendingCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
            <ExclamationCircleIcon className="h-3.5 w-3.5" />
            {pendingCount} pendente
            {pendingCount > 1 ? "s" : ""}
          </span>
        )}

        {!readOnly && changedCount > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-600">
            <PencilSquareIcon className="h-3.5 w-3.5" />
            {changedCount} alterado
            {changedCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
