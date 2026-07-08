// hooks/useFeasibilityFileUpload.ts

import { DragEvent, useCallback, useState } from "react";
import { useFeedback } from "@/hooks/useFeedback";
import { useRouter } from "next/navigation";
import { DisplayFile, ExistingFile } from "@/types/feasibility";
import { existingToDisplay, fileToDisplay } from "@/utils/feasibilityWorkflow";

const MAX_FILES = 3;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg"];

interface UseFeasibilityFileUploadParams {
  idWork: string;
  existingFiles: ExistingFile[];
}

interface UseFeasibilityFileUploadResult {
  /** Lista unificada para exibição */
  displayFiles: DisplayFile[];
  /** Apenas os File() novos (para envio no FormData) */
  newFiles: File[];
  uploading: boolean;
  dragActive: boolean;
  /** True se existem apenas arquivos do backend (nenhum novo selecionado) */
  handleFiles: (arquivosSelecionados: FileList | null) => void;
  handleDrag: (e: DragEvent) => void;
  handleDrop: (e: DragEvent) => void;
  removeFile: (index: number) => void;
  handleUpload: (data: any) => Promise<any>;
  resetUploadState: () => void;
}

export function useFeasibilityFileUpload({
  idWork,
  existingFiles,
}: UseFeasibilityFileUploadParams): UseFeasibilityFileUploadResult {
  const [displayFiles, setDisplayFiles] = useState<DisplayFile[]>(
    existingFiles.map(existingToDisplay),
  );
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const { showError, showSuccess } = useFeedback();
  const router = useRouter();

  // Derivados
  const newFiles = displayFiles
    .filter((f) => f.raw !== undefined)
    .map((f) => f.raw!);

  const validarArquivos = useCallback(
    (arquivosSelecionados: FileList | null): boolean => {
      if (!arquivosSelecionados) return false;

      if (arquivosSelecionados.length + displayFiles.length > MAX_FILES) {
        showError(`Máximo de ${MAX_FILES} arquivos permitidos.`);
        return false;
      }

      for (let i = 0; i < arquivosSelecionados.length; i++) {
        const arquivo = arquivosSelecionados[i];

        if (!ALLOWED_MIME_TYPES.includes(arquivo.type)) {
          showError(`Arquivo "${arquivo.name}" não é PDF ou JPEG.`);
          return false;
        }

        if (arquivo.size > MAX_FILE_SIZE_BYTES) {
          showError(`Arquivo "${arquivo.name}" excede 5MB.`);
          return false;
        }
      }

      return true;
    },
    [displayFiles.length, showError],
  );

  const handleFiles = useCallback(
    (arquivosSelecionados: FileList | null) => {
      if (validarArquivos(arquivosSelecionados)) {
        const novos = Array.from(arquivosSelecionados!).map(fileToDisplay);
        setDisplayFiles((prev) => [...prev, ...novos]);
      }
    },
    [validarArquivos],
  );

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = useCallback((index: number) => {
    setDisplayFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const resetUploadState = useCallback(() => {
    setDisplayFiles(existingFiles.map(existingToDisplay));
    setUploading(false);
    setDragActive(false);
  }, [existingFiles]);

  const handleUpload = useCallback(
    async (data: any) => {
      setUploading(true);

      const formData = new FormData();
      newFiles.forEach((file) => formData.append("files", file));
      formData.append("idObra", idWork);
      formData.append("items", JSON.stringify(data));

      try {
        const result = await fetch("/api/viabilidade", {
          method: "POST",
          body: formData,
        });

        if (!result.ok) {
          const errorData = await result.json();
          throw new Error(errorData.message);
        }

        showSuccess("Arquivos enviados com sucesso!", () => {
          router.push(`/detalhes/${idWork}`);
        });
      } catch (err) {
        showError(
          err instanceof Error
            ? err.message
            : "Erro ao fazer upload dos arquivos",
        );
      } finally {
        setUploading(false);
      }
    },
    [newFiles, idWork, showError, showSuccess, router],
  );

  return {
    displayFiles,
    newFiles,
    uploading,
    dragActive,
    handleFiles,
    handleDrag,
    handleDrop,
    removeFile,
    handleUpload,
    resetUploadState,
  };
}
