"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { useFeasibilityNavigation } from "@/hooks/feasibility/useFeasibilityNavigation";
import { useFeasibilityFileUpload } from "@/hooks/feasibility/useFeasibilityUpload";
import { useFeasibilityWorkflowActions } from "@/hooks/feasibility/useFeasibilityWorkflowActions";
import { FeasibilityDataInterface } from "@/types/feasibility";
import { FeasibilityWorkflowStatus } from "@/utils/feasibilityWorkflow";
import {
  ArchiveBoxIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";

import { AddServiceAccordion } from "../addServiceAccordion/addServiceAccordion";
import ModalComponent from "../common/Modal";
import { CardSection } from "./cardSection";
import { FeasibilityActionsFooter } from "./feasibilityActionsFooter";
import { FeasibilityFileUploadStep } from "./feasibilityFileUploadStep";
import { FeasibilityHeader } from "./feasibilityHeader";
import { FeasibilityRejectionsHistory } from "./feasibilityRejectionsHistory";
import { RejectFeasibilityModal } from "./feasibilityRejectModal";
import {
  FeasibilityServiceItem,
  FeasibilityServicesReviewStep,
} from "./feasibilityServicesViewStep";

export interface FeasibilityRejection {
  motivo: string;
  descricao: string;
  criado_em: Date;
  usuario: string;
}

interface UploadViabilidadeProps {
  idWork: string;
  servicesData: FeasibilityServiceItem[];
  feasibilityData: FeasibilityDataInterface;
  feasibilityRejectionsHistoryData: FeasibilityRejection[];
  contracts?: any[] | null;
  materials?: any[] | null;
  options: {
    operation_description: string[];
    operation_number: string[];
    points: string[];
  };
  isApprover?: boolean;
  workflowStatus: FeasibilityWorkflowStatus;
  pointByPoint: boolean;
}

export type SectionStatus = "complete" | "pending" | "attention";
type FeasibilityModalKind = "reject" | "approve" | "submit" | null;

export function FeasibiltyUpload({
  idWork,
  servicesData,
  contracts,
  materials,
  options,
  workflowStatus,
  pointByPoint,
  isApprover = false,
  feasibilityRejectionsHistoryData,
  feasibilityData,
}: UploadViabilidadeProps) {
  const router = useRouter();

  const [reviewData, setReviewData] = useState<FeasibilityServiceItem[]>(
    servicesData ?? [],
  );

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [openModal, setOpenModal] = useState<FeasibilityModalKind>(null);

  const {
    displayFiles,
    uploading,
    dragActive,
    handleFiles,
    handleDrag,
    handleDrop,
    removeFile,
    handleUpload,
  } = useFeasibilityFileUpload({
    idWork,
    existingFiles: feasibilityData?.caminhos_arquivos ?? [],
  });

  const isEditable = workflowStatus === "adicao";

  const pendingCount = useMemo(
    () => reviewData.filter((item) => item.viabilizado === null).length,
    [reviewData],
  );

  const uploadStatus: SectionStatus =
    displayFiles.length > 0 ? "complete" : "pending";

  const reviewStatus: SectionStatus | undefined = pointByPoint
    ? reviewData.length === 0
      ? "pending"
      : pendingCount > 0
        ? "attention"
        : "complete"
    : undefined;

  const { navSections, completedCount, statusById, stepSections } =
    useFeasibilityNavigation({
      isEditable,
      pointByPoint,
      hasRejections: feasibilityRejectionsHistoryData.length > 0,
      reviewStatus,
      uploadStatus,
      workflowStatus,
    });

  const { isPending, handleApprove, handleReject, handleSubmitForApproval } =
    useFeasibilityWorkflowActions({
      idWork,
      feasibilityReportId: Number(feasibilityData.id),
      hasFiles: displayFiles.length > 0,
      pointByPoint,
      reviewData,
      termsAccepted,
      handleUpload,
      onRejectSettled: () => setOpenModal(null),
    });

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-zinc-50">
      {/* Header */}
      <FeasibilityHeader
        workflowStatus={workflowStatus}
        navSections={navSections}
        statusById={statusById}
        completedCount={completedCount}
        stepCount={stepSections.length}
        onBack={() => router.back()}
      />

      {/* Body row: rail + scrollable content share the remaining height */}
      <div className="flex min-h-0 flex-1">
        {/* Progress rail (desktop only) */}
        <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-zinc-200 bg-zinc-50/60 px-4 py-6 lg:block">
          <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Progresso
          </p>

          <nav className="space-y-1">
            {navSections.map((section) => {
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
                termsAccepted={termsAccepted}
                dragActive={dragActive}
                readOnly={!isEditable}
                onTermsAccepted={setTermsAccepted}
                onFilesSelected={handleFiles}
                onDrag={handleDrag}
                onDrop={handleDrop}
                idWork={Number(idWork)}
                onRemoveFile={removeFile}
              />
            </CardSection>

            {isEditable && pointByPoint && contracts && materials && (
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
                    options={options}
                    type="serviço"
                  />

                  <AddServiceAccordion
                    idWork={Number(idWork)}
                    title="Adicionar novo material"
                    contracts={materials}
                    options={options}
                    type="material"
                  />
                </div>
              </CardSection>
            )}

            {pointByPoint && (
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
            )}

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

      <FeasibilityActionsFooter
        workflowStatus={workflowStatus}
        isApprover={isApprover}
        isPending={isPending}
        onOpenSubmit={() => setOpenModal("submit")}
        onOpenReject={() => setOpenModal("reject")}
        onOpenApprove={() => setOpenModal("approve")}
        idWork={idWork}
      />

      <RejectFeasibilityModal
        open={openModal === "reject"}
        onClose={() => setOpenModal(null)}
        onConfirm={handleReject}
        submitting={isPending}
      />

      <ModalComponent
        open={openModal === "submit"}
        onClose={() => setOpenModal(null)}
        title="Confirmar Viabilidade"
      >
        <p className="text-zinc-600 text-lg py-4">
          Deseja enviar viabilidade da obra para etapa de aprovação ?
        </p>

        <div className="flex items-center justify-center gap-3 mt-2">
          <ButtonComponent
            onClick={() => setOpenModal(null)}
            text="Cancelar"
            disabled={isPending}
          />
          <ButtonComponent
            onClick={handleSubmitForApproval}
            text={"Confirmar"}
            disabled={isPending}
          />
        </div>
      </ModalComponent>

      <ModalComponent
        open={openModal == "approve"}
        onClose={() => setOpenModal(null)}
        title="Aprovar Viabilidade"
      >
        <p className="text-zinc-600 text-lg py-4">
          Deseja finalizar a etapa de viabilidade da obra ?
        </p>

        <div className="flex items-center justify-center gap-3 mt-2">
          <ButtonComponent
            onClick={() => setOpenModal(null)}
            text="Cancelar"
            disabled={isPending}
          />
          <ButtonComponent
            onClick={handleApprove}
            text={"Confirmar"}
            disabled={isPending}
          />
        </div>
      </ModalComponent>
    </div>
  );
}
