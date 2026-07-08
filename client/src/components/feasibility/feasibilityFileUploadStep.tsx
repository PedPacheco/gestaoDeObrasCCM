import { useRouter } from "next/navigation";
import { DragEvent, useRef, useState, useTransition } from "react";

import { deleteFeasibilityFiles } from "@/actions/feasibility";
import { useFeedback } from "@/hooks/useFeedback";
import { DisplayFile } from "@/types/feasibility";
import {
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

import { ButtonComponent } from "../common/Button";
import ModalComponent from "../common/Modal";

interface FeasibilityFileUploadStepProps {
  files: DisplayFile[];
  uploading: boolean;
  dragActive: boolean;
  idWork: number;
  readOnly?: boolean;
  onFilesSelected: (files: FileList | null) => void;
  onDrag: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onRemoveFile: (index: number) => void;
}

export function FeasibilityFileUploadStep({
  files,
  uploading,
  dragActive,
  readOnly = false,
  idWork,
  onFilesSelected,
  onDrag,
  onDrop,
  onRemoveFile,
}: FeasibilityFileUploadStepProps) {
  const router = useRouter();

  const { showSuccess, showError } = useFeedback();

  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const [selectedFile, setSelectedFile] = useState<DisplayFile | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleDelete = () => {
    if (!selectedFile) return;

    // Arquivo novo
    if (selectedFile.remoteId === undefined) {
      onRemoveFile(selectedIndex!);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setOpenConfirmModal(false);
      return;
    }

    // Arquivo salvo
    startTransition(async () => {
      try {
        const response = await deleteFeasibilityFiles(idWork);

        if (!response.success) {
          showError("Erro ao excluir viabilidade");
          return;
        }

        showSuccess(response.message);

        router.refresh();
      } catch (error: any) {
        showError(error.message);
      } finally {
        setOpenConfirmModal(false);
      }
    });
  };

  return (
    <>
      {/* Dropzone */}
      {!readOnly && (
        <div
          onDragEnter={onDrag}
          onDragOver={onDrag}
          onDragLeave={onDrag}
          onDrop={onDrop}
          className={`
            relative w-full rounded-xl border-2 border-dashed
            flex flex-col items-center justify-center py-14
            transition-colors duration-200 cursor-pointer
            ${
              dragActive
                ? "border-[#A4D65E] bg-[#A4D65E]/10"
                : "border-zinc-300 bg-zinc-50/60 hover:border-[#53FF75]/60 hover:bg-[#A4D65E]/5"
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg"
            onChange={(e) => onFilesSelected(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200">
            <PhotoIcon className="w-7 h-7 text-zinc-400" />
          </div>

          <p className="text-sm text-zinc-600">
            Arraste e solte os arquivos aqui ou{" "}
            <span className="text-[#3f7a17] font-semibold underline underline-offset-2">
              clique para selecionar
            </span>
          </p>
        </div>
      )}

      {/* Regras */}
      {!readOnly && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-400">
          <span>● Máximo de 3 arquivos</span>
          <span>● Formatos: PDF ou JPEG</span>
          <span>● Tamanho máximo: 5 MB</span>
        </div>
      )}

      {/* Lista de arquivos */}
      {files.length > 0 ? (
        <div className={readOnly ? "space-y-2" : "mt-6 space-y-2"}>
          <p className="text-sm font-semibold text-zinc-600 mb-1">
            {readOnly ? "Arquivos enviados" : "Arquivos selecionados"} (
            {files.length})
          </p>

          {files.map((file, index) => {
            const isExisting = file.remoteId !== undefined;

            const url = `${process.env.NEXT_PUBLIC_API_URL}/uploads/viabilidade/${file.name}`;

            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-2xl hover:scale-110 transition-transform "
              >
                <div
                  key={file.remoteId ?? `new-${index}`}
                  className={`
                  flex items-center justify-between rounded-lg border px-4 py-2.5 shadow-sm
                  ${
                    isExisting
                      ? "border-[#A4D65E]/30 bg-[#A4D65E]/5"
                      : "border-zinc-200 bg-white"
                  }
                `}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isExisting ? (
                      <DocumentCheckIcon className="w-5 h-5 text-[#A4D65E] shrink-0" />
                    ) : (
                      <DocumentArrowUpIcon className="w-5 h-5 text-[#53FF75] shrink-0" />
                    )}

                    <span className="text-sm text-zinc-700 truncate">
                      {file.name}
                    </span>

                    {file.size !== null && (
                      <span className="text-xs text-zinc-400 whitespace-nowrap">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}

                    {isExisting && (
                      <span className="ml-1 rounded-full bg-[#A4D65E]/15 px-2 py-0.5 text-[10px] font-medium text-[#3f7a17]">
                        Enviado
                      </span>
                    )}
                  </div>

                  {!readOnly && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        setSelectedFile(file);
                        setSelectedIndex(index);

                        setOpenConfirmModal(true);
                      }}
                      disabled={uploading}
                      className="ml-3 rounded-full p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      ) : readOnly ? (
        <p className="py-6 text-center text-sm text-zinc-400">
          Nenhum arquivo enviado.
        </p>
      ) : null}

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
              onClick={handleDelete}
              disabled={isPending}
            />
          </div>
        </div>
      </ModalComponent>
    </>
  );
}
