import { useTransition } from "react";
import { useFeedback } from "../useFeedback";
import { useUser } from "@/contexts/userContext";
import { useRouter } from "next/navigation";
import {
  FeasibilityServiceItem,
  hasInvalidAdditionalQuantities,
} from "@/components/feasibility/feasibilityServicesViewStep";
import { approveFeasibility, rejectFeasibility } from "@/actions/feasibility";

interface useFeasibilityWorkflowActionsProps {
  idWork: string;
  feasibilityReportId: number;
  hasFiles: boolean;
  pointByPoint: boolean;
  reviewData: FeasibilityServiceItem[];
  termsAccepted: boolean;
  handleUpload: any;
  onRejectSettled: () => void;
}

export function useFeasibilityWorkflowActions({
  feasibilityReportId,
  handleUpload,
  hasFiles,
  idWork,
  onRejectSettled,
  pointByPoint,
  reviewData,
  termsAccepted,
}: useFeasibilityWorkflowActionsProps) {
  const [isPending, startTransition] = useTransition();

  const { showError, showSuccess } = useFeedback();

  const { user } = useUser();

  const router = useRouter();

  const handleSubmitForApproval = async () => {
    if (hasFiles) {
      showError("Selecione pelo menos um arquivo.");
      return;
    }

    if (pointByPoint && hasInvalidAdditionalQuantities(reviewData)) {
      showError("Preencha uma quantidade válida para todos os itens.");
      return;
    }

    if (!termsAccepted) {
      showError("A declaração da ficha de viabilidade não foi preenchido");
      return;
    }

    startTransition(async () => {
      try {
        const data =
          pointByPoint && reviewData.length > 0
            ? reviewData.map((item) => ({
                id: item.id,
                viabilizado: item.viabilizado,
              }))
            : undefined;

        await handleUpload(pointByPoint, data);
      } catch (err) {
        showError(
          err instanceof Error
            ? err.message
            : "Erro ao enviar viabilidade para aprovação",
        );
      }
    });
  };

  const handleApprove = () => {
    startTransition(async () => {
      try {
        const response = await approveFeasibility(Number(idWork));

        if (!response.success) {
          showError(response.message);
          return;
        }

        showSuccess(response.message);
        router.push(`/detalhes/${idWork}`);
      } catch (err) {
        showError(
          err instanceof Error ? err.message : "Erro ao aprovar viabilidade",
        );
      }
    });
  };

  const handleReject = (data: { reason: string; description: string }) => {
    startTransition(async () => {
      try {
        if (!user?.id) {
          showError("Usuário não identificado. Faça login novamente.");
          return;
        }

        const formattedData = {
          ...data,
          workId: Number(idWork),
          feasibilityReportId: feasibilityReportId,
          userId: user.id,
        };

        const response = await rejectFeasibility({
          idWork,
          data: formattedData,
        });

        if (!response.success) {
          showError(response.message);
          return;
        }

        showSuccess(response.message);
        router.push(`/detalhes/${idWork}`);
      } catch (err) {
        showError(
          err instanceof Error ? err.message : "Erro ao reprovar viabilidade",
        );
      } finally {
        onRejectSettled();
      }
    });
  };

  return { isPending, handleApprove, handleReject, handleSubmitForApproval };
}
