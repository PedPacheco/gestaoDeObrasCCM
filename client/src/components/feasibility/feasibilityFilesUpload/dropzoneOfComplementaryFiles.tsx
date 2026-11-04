import { ButtonComponent } from "@/components/common/Button";
import { DisplayFile } from "@/types/feasibility";
import { FeasibilityWorkflowStatus } from "@/utils/feasibilityWorkflow";
import {
  DocumentArrowUpIcon,
  DocumentCheckIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { DragEvent } from "react";

interface DropzoneOfComplementaryFilesProps {
  files: DisplayFile[];
  uploading: boolean;
  dragActive: boolean;
  canEditComplementaryFiles: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  workflowStatus: FeasibilityWorkflowStatus;
  onFilesSelected: (files: FileList | null) => void;
  onDrag: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onUploadComplementaryFiles: () => Promise<void>;
  setSelectedIndex: (index: number) => void;
  setSelectedFile: (file: DisplayFile) => void;
  setOpenConfirmModal: (confirm: boolean) => void;
  setSelectedFileType: React.Dispatch<
    React.SetStateAction<"technical" | "complementary" | null>
  >;
}

export function DropzoneOfComplementaryFiles({
  canEditComplementaryFiles,
  dragActive,
  fileInputRef,
  files,
  onDrag,
  onDrop,
  onUploadComplementaryFiles,
  onFilesSelected,
  setOpenConfirmModal,
  setSelectedFile,
  setSelectedIndex,
  uploading,
  setSelectedFileType,
  workflowStatus,
}: DropzoneOfComplementaryFilesProps) {
  return (
    <>
      {canEditComplementaryFiles && (
        <>
          <div className="mt-6">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-zinc-700">
                Arquivos Complementares
              </h3>

              <p className="text-xs text-zinc-500">
                Anexe documentos complementares para conclusão da análise.
              </p>
            </div>

            <div
              onDragEnter={onDrag}
              onDragOver={onDrag}
              onDragLeave={onDrag}
              onDrop={onDrop}
              className={`relative w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-14 transition-colors duration-200 cursor-pointer
            ${dragActive ? "border-[#A4D65E] bg-[#A4D65E]/10" : "border-zinc-300 bg-zinc-50/60 hover:border-[#53FF75]/60 hover:bg-[#A4D65E]/5"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg"
                onChange={(e) => onFilesSelected(e.target.files)}
                className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
              />

              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200">
                <PhotoIcon className="h-7 w-7 text-zinc-400" />
              </div>

              <p className="text-sm text-zinc-600">
                Arraste arquivos complementares ou{" "}
                <span className="font-semibold text-[#3f7a17] underline">
                  clique para selecionar
                </span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-zinc-400">
            <span>● Máximo de 5 arquivos</span>
            <span>● Formatos: PDF ou JPEG</span>
            <span>● Tamanho máximo: 5 MB</span>
          </div>
        </>
      )}
      {files.length > 0 ? (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-zinc-600 mb-1">
            {`Arquivos enviados (${files.length})`}
          </p>

          {files.map((file, index) => {
            const isExisting = file.raw !== undefined;

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
                  key={`new-${index}`}
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

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      setSelectedFile(file);
                      setSelectedIndex(index);
                      setSelectedFileType("complementary");

                      setOpenConfirmModal(true);
                    }}
                    disabled={uploading}
                    className="ml-3 rounded-full p-1 text-zinc-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </a>
            );
          })}
        </div>
      ) : canEditComplementaryFiles ? (
        <p className="py-6 text-center text-sm text-zinc-400">
          Nenhum arquivo enviado.
        </p>
      ) : null}
      {canEditComplementaryFiles && workflowStatus === "aprovado" && (
        <div className="mt-6 flex justify-end">
          <ButtonComponent
            type="button"
            text={uploading ? "Enviando..." : "Salvar Arquivos Complementares"}
            onClick={onUploadComplementaryFiles}
            disabled={uploading}
          />
        </div>
      )}
    </>
  );
}
