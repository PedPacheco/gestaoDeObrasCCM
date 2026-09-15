import { FeasibilityWorkflowStatus } from "@/utils/feasibilityWorkflow";
import { ButtonComponent } from "../common/Button";
import { useRouter } from "next/navigation";

interface FeasibilityActionsFooterProps {
  workflowStatus: FeasibilityWorkflowStatus;
  isPending: boolean;
  onOpenSubmit: () => void;
  onOpenReject: () => void;
  onOpenApprove: () => void;
  idWork: string;
  isApprover?: boolean;
}

export function FeasibilityActionsFooter({
  workflowStatus,
  isApprover,
  isPending,
  onOpenApprove,
  onOpenReject,
  onOpenSubmit,
  idWork,
}: FeasibilityActionsFooterProps) {
  const router = useRouter();

  return (
    <footer className="z-20 shrink-0 border-t border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        {/* Texto de status */}
        <p className="hidden text-sm text-zinc-500 sm:block">
          {workflowStatus === "adicao" &&
            "Complete o upload e a revisão para enviar para aprovação."}
          {workflowStatus === "aprovacao" &&
            "Esta viabilidade está aguardando aprovação."}
          {workflowStatus === "aprovado" &&
            "Viabilidade aprovada e viabilizada. Somente visualização."}
        </p>

        {/* Botões */}
        <div className="flex items-center justify-end gap-3">
          {/* Cancelar — sempre visível */}
          <ButtonComponent
            text="Cancelar"
            onClick={() => router.push(`/detalhes/${idWork}`)}
            disabled={isPending}
            styled="min-w-56"
          />

          {/* ── Status: Adição ── */}
          {workflowStatus === "adicao" && (
            <ButtonComponent
              text={"Enviar para aprovação"}
              onClick={() => onOpenSubmit()}
              styled="min-w-56"
            />
          )}

          {/* ── Status: Aprovação (apenas para aprovador) ── */}
          {workflowStatus === "aprovacao" && (
            <>
              <ButtonComponent
                text="Reprovar viabilidade"
                onClick={() => onOpenReject()}
                disabled={!isApprover || isPending}
                styled="min-w-56"
              />

              <ButtonComponent
                text={isPending ? "Aprovando..." : "Aprovar viabilidade"}
                onClick={() => onOpenApprove()}
                disabled={!isApprover || isPending}
                styled="min-w-56"
              />
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
