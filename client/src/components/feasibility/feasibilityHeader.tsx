import { FeasibilityWorkflowStatus } from "@/utils/feasibilityWorkflow";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import { SectionStatus } from "./feasibilityImport";
import { ArrowLeftIcon, ClockIcon } from "@mui/x-date-pickers";
import { NavSection } from "@/hooks/feasibility/useFeasibilityNavigation";

const WORKFLOW_LABELS: Record<
  FeasibilityWorkflowStatus,
  { label: string; className: string }
> = {
  adicao: {
    label: "Em edição",
    className: "bg-zinc-100 text-zinc-600",
  },
  aprovacao: {
    label: "Aguardando aprovação",
    className: "bg-amber-50 text-amber-600",
  },
  aprovado: {
    label: "Aprovado e viabilizado",
    className: "bg-[#A4D65E]/20 text-[#3f7a17]",
  },
};

interface FeasibilityHeaderProps {
  workflowStatus: FeasibilityWorkflowStatus;
  navSections: NavSection[];
  statusById: Record<string, SectionStatus | undefined>;
  completedCount: number;
  stepCount: number;
  onBack: () => void;
}

export function FeasibilityHeader({
  completedCount,
  navSections,
  onBack,
  statusById,
  stepCount,
  workflowStatus,
}: FeasibilityHeaderProps) {
  const workflowBadge = WORKFLOW_LABELS[workflowStatus];

  return (
    <header className="z-20 shrink-0 border-b border-zinc-200 bg-white">
      <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
        <button
          onClick={() => onBack()}
          aria-label="Voltar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-lg font-bold text-zinc-900 sm:text-xl">
              Viabilidade da Obra
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${workflowBadge.className}`}
            >
              {workflowStatus === "aprovacao" && (
                <ClockIcon className="h-3.5 w-3.5" />
              )}
              {workflowBadge.label}
            </span>
          </div>
        </div>

        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-600 sm:flex">
          {completedCount}/{stepCount} etapas concluídas
        </span>
      </div>

      {/* Mobile / tablet progress chips — replaces the side rail below lg */}
      <nav className="flex gap-2 overflow-x-auto border-t border-zinc-100 px-4 py-2.5 sm:px-6 lg:hidden">
        {navSections.map((section) => {
          const status = statusById[section.id];
          const Icon = section.icon;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors active:bg-zinc-100"
            >
              <Icon className="h-3.5 w-3.5 text-zinc-400" />
              {section.label}
              {status === "complete" && (
                <CheckCircleIcon className="h-3.5 w-3.5 text-[#3f7a17]" />
              )}
              {status === "attention" && (
                <ExclamationTriangleIcon className="h-3.5 w-3.5 text-amber-500" />
              )}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
