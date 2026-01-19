"use client";

import { useState, DragEvent, SetStateAction, Dispatch } from "react";
import ErrorModal from "@/components/common/ErrorModal";
import {
  ExclamationCircleIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  PhotoIcon,
} from "@heroicons/react/20/solid";
import { Box, Typography } from "@mui/material";

interface ExecutionReportUploadPanelProps {
  setFiles: Dispatch<SetStateAction<File[]>>;
  files: File[];
}

export function AsBuildImport({
  files,
  setFiles,
}: ExecutionReportUploadPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/tiff",
    "image/png",
    "image/heic",
    "image/heif",
  ];
  const maxSize = 5 * 1024 * 1024;

  const validateFiles = (incoming: FileList | null): boolean => {
    if (!incoming) return false;

    if (incoming.length + files.length > 3) {
      setError("Máximo de 3 arquivos permitidos.");
      return false;
    }

    for (const file of Array.from(incoming)) {
      if (!allowedTypes.includes(file.type)) {
        setError(`O formato do arquivo "${file.name}" não é aceito.`);
        return false;
      }

      if (file.size > maxSize) {
        setError(`Arquivo "${file.name}" excede 5MB.`);
        return false;
      }
    }

    return true;
  };

  const handleFiles = (incoming: FileList | null) => {
    setError(null);
    if (validateFiles(incoming)) {
      setFiles((prev) => [...prev, ...Array.from(incoming!)]);
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type !== "dragleave");
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

  return (
    <Box>
      <div className="flex items-center gap-2 mb-6">
        <DocumentArrowUpIcon className="w-7 h-7 text-blue-400" />
        <h3 className="text-2xl font-bold text-zinc-700">
          Importar Arquivos As Build
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

        <PhotoIcon className="w-14 h-14 text-gray-700" />

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
        />
      )}

      {/* REGRAS */}
      <div className="flex justify-between">
        <div className="mt-4 text-sm text-zinc-700 space-y-1">
          <p>✔ Máximo de 3 arquivos</p>
          <p>✔ Formatos: PDF ou JPEG</p>
          <p>✔ Tamanho máximo dos arquivos: 5MB</p>
        </div>
      </div>

      {files.length > 0 && (
        <Box mt={2}>
          {files.map((file, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Typography variant="body2">{file.name}</Typography>
              <button onClick={() => removeFile(index)}>
                <XMarkIcon width={18} className="text-red-500" />
              </button>
            </Box>
          ))}
        </Box>
      )}

      {error && (
        <ErrorModal
          open
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </Box>
  );
}
