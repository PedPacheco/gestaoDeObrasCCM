// feasibilityImport.tsx
"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { useFeasibilityFileUpload } from "@/hooks/feasibility/useFeasibilityUpload";
import { useFeedback } from "@/hooks/useFeedback";
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

import { AddServiceAccordion } from "./addServiceAccordion";
import { CardSection } from "./cardSection";
// import { approveFeasibility, rejectFeasibility } from "./feasibilityActions";
// import { FeasibilityApprovalStep } from "./feasibilityApprovalStep";
// import { FeasibilityFileUploadStep } from "./feasibilityFileUploadStep";
// import { FeasibilityRejectionsHistory } from "./feasibilityRejectionsHistory";
import {
  FeasibilityServiceItem,
  FeasibilityServicesReviewStep,
  hasInvalidAdditionalQuantities,
} from "./feasibilityServicesViewStep";
import { FeasibilityFileUploadStep } from "./feasibilityFileUploadStep";
import { RejectFeasibilityModal } from "./feasibilityRejectModal";
import { approveFeasibility, rejectFeasibility } from "@/actions/feasibility";
import { FeasibilityRejectionsHistory } from "./feasibilityRejectionsHistory";
import { useUser } from "@/contexts/userContext";

// '45' = status de adição | '46' = status de aprovação | qualquer outro = aprovado
type StatusWork = string;

/**
 * Status do fluxo de viabilidade:
 * - adicao:    usuário está montando a viabilidade (upload + itens + revisão)
 * - aprovacao: viabilidade enviada, aguardando decisão de um aprovador
 * - aprovado:  viabilidade aprovada e viabilizada, somente leitura
 */
export type FeasibilityWorkflowStatus = "adicao" | "aprovacao" | "aprovado";

const STATUS_WORK_ADICAO = "45";
const STATUS_WORK_APROVACAO = "46";

function getWorkflowStatusFromStatusWork(
  statusWork: StatusWork,
): FeasibilityWorkflowStatus {
  if (statusWork === STATUS_WORK_ADICAO) return "adicao";
  if (statusWork === STATUS_WORK_APROVACAO) return "aprovacao";
  return "aprovado";
}

export interface FeasibilityRejection {
  motivo: string;
  descricao: string;
  criado_em: Date;
  usuario: string;
}

interface UploadViabilidadeProps {
  idWork: string;
  servicesData: FeasibilityServiceItem[];
  existingFiles: any[];
  feasibilityRejectionsHistoryData: any[];
  contracts: any[];
  materials: any[];
  filters: { operations: any[]; points: any[] };
  statusWork: StatusWork;
  isApprover?: boolean;
  rejections?: FeasibilityRejection[];
  token?: string;
}

type SectionStatus = "complete" | "pending" | "attention";

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

export function FeasibiltyUpload({
  idWork,
  servicesData,
  filters,
  contracts,
  materials,
  statusWork,
  isApprover = false,
  feasibilityRejectionsHistoryData,
  existingFiles,
}: UploadViabilidadeProps) {
  const { showError, showSuccess } = useFeedback();

  const { user } = useUser();

  const router = useRouter();

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const workflowStatus = useMemo(
    () => getWorkflowStatusFromStatusWork(statusWork),
    [statusWork],
  );

  const [reviewData, setReviewData] =
    useState<FeasibilityServiceItem[]>(servicesData);

  const {
    displayFiles,
    newFiles,
    uploading,
    dragActive,
    handleFiles,
    handleDrag,
    handleDrop,
    removeFile,
    handleUpload,
  } = useFeasibilityFileUpload({ idWork, existingFiles: existingFiles ?? [] });

  // Só é possível editar arquivos/itens/quantidades enquanto a viabilidade
  // estiver no status de adição. Em aprovação e aprovado, tudo é somente leitura.
  const isEditable = workflowStatus === "adicao";

  const workflowBadge = WORKFLOW_LABELS[workflowStatus];

  const pendingCount = useMemo(
    () => reviewData.filter((item) => item.viabilizado === null).length,
    [reviewData],
  );

  const uploadStatus: SectionStatus =
    displayFiles.length > 0 ? "complete" : "pending";

  const reviewStatus: SectionStatus =
    reviewData.length === 0
      ? "pending"
      : pendingCount > 0
        ? "attention"
        : "complete";

  const NAV_SECTIONS = useMemo(
    () => [
      { id: "upload", label: "Arquivos", icon: DocumentArrowUpIcon },
      ...(isEditable
        ? [
            {
              id: "itens-adicionais",
              label: "Itens adicionais",
              icon: PlusCircleIcon,
            },
          ]
        : []),
      { id: "revisao", label: "Revisão", icon: ClipboardDocumentCheckIcon },
      ...(workflowStatus === "aprovacao"
        ? [{ id: "aprovacao", label: "Aprovação", icon: CheckBadgeIcon }]
        : []),
      { id: "reprovacoes", label: "Reprovações", icon: ArchiveBoxIcon },
    ],
    [isEditable, workflowStatus],
  );

  const statusById: Record<string, SectionStatus | undefined> = {
    upload: uploadStatus,
    "itens-adicionais": "pending",
    revisao: reviewStatus,
    aprovacao: workflowStatus === "aprovacao" ? "attention" : undefined,
    reprovacoes:
      feasibilityRejectionsHistoryData.length > 0 ? "attention" : undefined,
  };

  // "Reprovações" é um histórico de consulta, não uma etapa do fluxo,
  // então não entra na contagem de progresso.
  const stepSections = NAV_SECTIONS.filter(
    (section) => section.id !== "reprovacoes",
  );
  const completedCount = stepSections.filter(
    (section) => statusById[section.id] === "complete",
  ).length;

  const handleSubmitForApproval = async () => {
    if (newFiles.length === 0) {
      showError("Selecione pelo menos um arquivo.");
      return;
    }

    if (hasInvalidAdditionalQuantities(reviewData)) {
      showError("Preencha uma quantidade válida para todos os itens.");
      return;
    }

    try {
      const data = reviewData.map((item) => ({
        id: item.id,
        viabilizado: item.viabilizado,
      }));

      await handleUpload(data);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Erro ao enviar viabilidade para aprovação",
      );
    }
  };

  const handleApprove = async () => {
    try {
      const response = await approveFeasibility(Number(idWork));

      if (!response.success) {
        showError(response.message);
      }

      showSuccess(response.message);

      router.push(`/detalhes/${idWork}`);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Erro ao aprovar viabilidade",
      );
    }
  };

  const handleReject = async (data: {
    reason: string;
    description: string;
  }) => {
    try {
      if (!user?.id) {
        showError("Usuário não identificado. Faça login novamente.");
        return;
      }

      const formattedData = {
        ...data,
        idWork: Number(idWork),
        idUser: user.id,
      };

      const response = await rejectFeasibility({ idWork, data: formattedData });

      if (!response.success) {
        showError(response.message);
      }

      showSuccess(response.message);

      router.push(`/detalhes/${idWork}`);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Erro ao reprovar viabilidade",
      );
    } finally {
      setIsRejectModalOpen(false);
    }
  };

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-zinc-50">
      {/* Header */}
      <header className="z-20 shrink-0 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
          <button
            onClick={() => router.back()}
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
            {completedCount}/{stepSections.length} etapas concluídas
          </span>
        </div>

        {/* Mobile / tablet progress chips — replaces the side rail below lg */}
        <nav className="flex gap-2 overflow-x-auto border-t border-zinc-100 px-4 py-2.5 sm:px-6 lg:hidden">
          {NAV_SECTIONS.map((section) => {
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

      {/* Body row: rail + scrollable content share the remaining height */}
      <div className="flex min-h-0 flex-1">
        {/* Progress rail (desktop only) */}
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50/60 px-4 py-6 lg:block">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Progresso
          </p>

          <nav className="space-y-1">
            {NAV_SECTIONS.map((section) => {
              const status = statusById[section.id];
              const Icon = section.icon;

              return (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-white hover:text-zinc-900"
                >
                  <Icon className="h-4 w-4 shrink-0 text-zinc-400 group-hover:text-zinc-600" />
                  <span className="flex-1">{section.label}</span>
                  {status === "complete" && (
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-[#53FF75]" />
                  )}
                  {status === "attention" && (
                    <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
                  )}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Scrollable content — the ONLY element that owns a scrollbar */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto space-y-6 px-4 py-6 sm:px-6 sm:py-8">
            <CardSection
              id="upload"
              title="Upload de Arquivos"
              description={
                isEditable
                  ? "Envie os documentos que comprovam a viabilidade da obra."
                  : "Documentos enviados como comprovação da viabilidade da obra."
              }
              icon={<DocumentArrowUpIcon className="h-5 w-5" />}
              status={uploadStatus}
            >
              <FeasibilityFileUploadStep
                files={displayFiles}
                uploading={uploading}
                dragActive={dragActive}
                readOnly={!isEditable}
                onFilesSelected={handleFiles}
                onDrag={handleDrag}
                onDrop={handleDrop}
                idWork={Number(idWork)}
                onRemoveFile={removeFile}
              />
            </CardSection>

            {isEditable && (
              <CardSection
                id="itens-adicionais"
                title="Itens Adicionais"
                description="Inclua serviços ou materiais que não constam na base original."
                icon={<PlusCircleIcon className="h-5 w-5" />}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <AddServiceAccordion
                    idWork={Number(idWork)}
                    title="Adicionar novo serviço"
                    contracts={contracts}
                    operations={filters.operations}
                    points={filters.points}
                    type="serviço"
                  />

                  <AddServiceAccordion
                    idWork={Number(idWork)}
                    title="Adicionar novo material"
                    contracts={materials}
                    operations={filters.operations}
                    points={filters.points}
                    type="material"
                  />
                </div>
              </CardSection>
            )}

            <CardSection
              id="revisao"
              title="Revisão da Viabilidade"
              description={
                isEditable
                  ? "Confirme a quantidade viabilizada para cada item."
                  : "Quantidade viabilizada para cada item."
              }
              icon={<ClipboardDocumentCheckIcon className="h-5 w-5" />}
              status={reviewStatus}
            >
              <FeasibilityServicesReviewStep
                reviewData={reviewData}
                onChangeReviewData={setReviewData}
                readOnly={!isEditable}
              />
            </CardSection>

            <CardSection
              id="reprovacoes"
              title="Reprovações"
              description="Histórico de reprovações desta viabilidade."
              icon={<ArchiveBoxIcon className="h-5 w-5" />}
            >
              <FeasibilityRejectionsHistory
                rejections={feasibilityRejectionsHistoryData}
              />
            </CardSection>

            <div className="h-2" />
          </div>
        </main>
      </div>

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
              onClick={() => router.back()}
              styled="min-w-56"
            />

            {/* ── Status: Adição ── */}
            {workflowStatus === "adicao" && (
              <ButtonComponent
                text={"Enviar para aprovação"}
                onClick={handleSubmitForApproval}
                // disabled={submittingApproval}
                styled="min-w-56"
              />
            )}

            {/* ── Status: Aprovação (apenas para aprovador) ── */}
            {workflowStatus === "aprovacao" && (
              <>
                <ButtonComponent
                  text="Reprovar viabilidade"
                  onClick={() => setIsRejectModalOpen(true)}
                  styled="min-w-56"
                />

                <ButtonComponent
                  text={false ? "Aprovando..." : "Aprovar viabilidade"}
                  onClick={handleApprove}
                  // disabled={submittingApproval}
                  styled="min-w-56"
                />
              </>
            )}
          </div>
        </div>
      </footer>

      <RejectFeasibilityModal
        open={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleReject}
        // submitting={submittingRejection}
      />
    </div>
  );
}
