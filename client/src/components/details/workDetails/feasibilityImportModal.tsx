"use client";

import { useState, DragEvent } from "react";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import {
  ExclamationCircleIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  PhotoIcon,
} from "@heroicons/react/20/solid";
import { Dialog, DialogContent } from "@mui/material";
import { useFeedback } from "@/hooks/useFeedback";

interface UploadViabilidadeProps {
  idWork: string;
  onUploadSuccess: () => void;
  open: boolean;
  onClose: () => void;
}

export function FeasibiltyUpload({
  open,
  onClose,
  idWork,
  onUploadSuccess,
}: UploadViabilidadeProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const { showError } = useFeedback();
  const [dragActive, setDragActive] = useState(false);

  const validarArquivos = (arquivosSelecionados: FileList | null): boolean => {
    if (!arquivosSelecionados) return false;

    if (arquivosSelecionados.length + files.length > 3) {
      showError("Máximo de 3 arquivos permitidos.");
      return false;
    }

    const formatosPermitidos = ["application/pdf", "image/jpeg", "image/jpg"];
    const tamanhoMaximo = 5 * 1024 * 1024;

    for (let i = 0; i < arquivosSelecionados.length; i++) {
      const arquivo = arquivosSelecionados[i];

      if (!formatosPermitidos.includes(arquivo.type)) {
        showError(`Arquivo "${arquivo.name}" não é PDF ou JPEG.`);
        return false;
      }

      if (arquivo.size > tamanhoMaximo) {
        showError(`Arquivo "${arquivo.name}" excede 5MB.`);
        return false;
      }
    }

    return true;
  };

  const handleFiles = (arquivos: FileList | null) => {
    if (validarArquivos(arquivos)) {
      setFiles((prev) => [...prev, ...Array.from(arquivos!)]);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      showError("Selecione pelo menos um arquivo.");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("idObra", idWork);

    try {
      const response = await fetch("/api/viabilidade", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      console.log(response);

      setFiles([]);
      setTimeout(() => onUploadSuccess(), 1000);
    } catch (err) {
      showError(
        err instanceof Error
          ? err.message
          : "Erro ao fazer upload dos arquivos",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        className: "bg-white rounded-xl",
      }}
    >
      <DialogContent>
        <div className="w-full border border-zinc-700 rounded-xl p-6 bg-zinc-500 shadow-lg">
          {/* Título */}
          <div className="flex items-center gap-2 mb-6">
            <DocumentArrowUpIcon className="w-7 h-7 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">
              Importar Arquivos de Viabilidade
            </h3>
          </div>

          {/* ÁREA DE UPLOAD */}
          <div
            onDragEnter={handleDrag}
            className={`relative w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition ${
              dragActive
                ? "border-blue-400 bg-blue-900/20"
                : "border-gray-500 hover:bg-white/5"
            }`}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg"
              onChange={(e) => handleFiles(e.target.files)}
              className="absolute w-full h-full opacity-0 cursor-pointer"
            />

            <PhotoIcon className="w-14 h-14 text-gray-400" />

            <p className="text-blue-400 text-sm mt-2">
              Clique para selecionar arquivos ou arraste e solte
            </p>
          </div>

          {/* Drop ativo */}
          {dragActive && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className="absolute top-0 left-0 w-full h-full z-50"
            ></div>
          )}

          {/* REGRAS */}
          <div className="flex justify-between">
            <div className="mt-4 text-sm text-gray-300 space-y-1">
              <p>✔ Máximo de 3 arquivos</p>
              <p>✔ Formatos: PDF ou JPEG</p>
              <p>✔ Tamanho máximo dos arquivos: 5MB</p>
            </div>

            <ButtonComponent
              text={uploading ? "Enviando..." : "Importar Arquivos"}
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              styled="w-34 mt-6 bg-green-600 hover:bg-green-700"
            />
          </div>

          {/* LISTA DE ARQUIVOS */}
          {files.length > 0 && (
            <div className="mt-6">
              <p className="font-semibold text-gray-200 mb-2">
                Arquivos selecionados:
              </p>

              <ul className="space-y-2">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between bg-gray-700 p-2 rounded-lg"
                  >
                    <span className="text-sm text-gray-100 truncate flex-1">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>

                    <button
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                      className="ml-3 text-red-400 hover:text-red-600"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* BOTÃO */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
