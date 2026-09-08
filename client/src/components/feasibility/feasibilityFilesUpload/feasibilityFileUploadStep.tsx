import { useRouter } from "next/navigation";
import { DragEvent, useEffect, useRef, useState, useTransition } from "react";

import { DisplayFile } from "@/types/feasibility";
import {
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

import { ButtonComponent } from "../../common/Button";
import ModalComponent from "../../common/Modal";
import { useUser } from "@/contexts/userContext";
import { DropzoneOfTechnicalFiles } from "./dropzoneOfTechnicalFiles";
import { DropzoneOfComplementaryFiles } from "./dropzoneOfComplementaryFiles";
import { UseTechnicalFilesUploadResult } from "@/hooks/feasibility/useTechnicalFilesUpload";
import { UseComplementaryFilesUploadResult } from "@/hooks/feasibility/useComplementaryFilesUpload";

interface FeasibilityFileUploadStepProps {
  technicalFilesUpload: UseTechnicalFilesUploadResult;
  complementaryFilesUpload: UseComplementaryFilesUploadResult;
  termsAccepted: boolean;
  workflowStatus: string;
  onTermsAccepted: React.Dispatch<boolean>;
}

export function FeasibilityFileUploadStep({
  termsAccepted,
  workflowStatus,
  onTermsAccepted,
  technicalFilesUpload,
  complementaryFilesUpload,
}: FeasibilityFileUploadStepProps) {
  const router = useRouter();

  const { permissions } = useUser();

  const [isPending] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState<DisplayFile | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const [selectedFileType, setSelectedFileType] = useState<
    "technical" | "complementary" | null
  >(null);

  useEffect(() => {
    if (technicalFilesUpload.displayFiles.length === 0) {
      onTermsAccepted(false);
    }
  }, [technicalFilesUpload.displayFiles, onTermsAccepted]);

  const handleDelete = () => {
    if (!selectedFile || selectedIndex === null || !selectedFileType) {
      return;
    }

    if (selectedFileType === "technical") {
      technicalFilesUpload.removeFile(selectedIndex);
    }

    if (selectedFileType === "complementary") {
      complementaryFilesUpload.removeFile(selectedIndex);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setOpenConfirmModal(false);
    setSelectedFile(null);
    setSelectedIndex(null);
    setSelectedFileType(null);

    router.refresh();
  };

  const canEditTechnicalFiles = workflowStatus === "adicao";

  const canEditComplementaryFiles =
    workflowStatus === "aprovado" && permissions?.tipo_usuario === "INTERNO";

  return (
    <>
      <DropzoneOfTechnicalFiles
        canEditTechnicalFiles={canEditTechnicalFiles}
        dragActive={technicalFilesUpload.dragActive}
        files={technicalFilesUpload.displayFiles}
        onDrag={technicalFilesUpload.handleDrag}
        onDrop={technicalFilesUpload.handleDrop}
        onTermsAccepted={onTermsAccepted}
        onFilesSelected={technicalFilesUpload.handleFiles}
        termsAccepted={termsAccepted}
        uploading={technicalFilesUpload.uploading}
        fileInputRef={fileInputRef}
        setOpenConfirmModal={setOpenConfirmModal}
        setSelectedFile={setSelectedFile}
        setSelectedIndex={setSelectedIndex}
        setSelectedFileType={setSelectedFileType}
      />

      <DropzoneOfComplementaryFiles
        canEditComplementaryFiles={canEditComplementaryFiles}
        dragActive={complementaryFilesUpload.dragActive}
        files={complementaryFilesUpload.displayFiles}
        onDrag={complementaryFilesUpload.handleDrag}
        onDrop={complementaryFilesUpload.handleDrop}
        onFilesSelected={complementaryFilesUpload.handleFiles}
        onUploadComplementaryFiles={complementaryFilesUpload.handleUpload}
        uploading={complementaryFilesUpload.uploading}
        fileInputRef={fileInputRef}
        setOpenConfirmModal={setOpenConfirmModal}
        setSelectedFile={setSelectedFile}
        setSelectedIndex={setSelectedIndex}
        setSelectedFileType={setSelectedFileType}
      />

      <ModalComponent
        title="Confirmar exclusão"
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
      >
        <div className="flex flex-col items-center gap-6">
          <ExclamationCircleIcon
            width={48}
            height={48}
            className="text-red-500"
          />

          <span className="text-center text-lg text-gray-700 dark:text-gray-200">
            Tem certeza que deseja excluir esta viabilidade?
            <br />
            <strong>Essa ação não poderá ser desfeita.</strong>
          </span>

          <div className="flex gap-4">
            <ButtonComponent
              text="Confirmar Exclusão"
              styled="min-w-32"
              onClick={() => handleDelete()}
              disabled={isPending}
            />
          </div>
        </div>
      </ModalComponent>
    </>
  );
}
