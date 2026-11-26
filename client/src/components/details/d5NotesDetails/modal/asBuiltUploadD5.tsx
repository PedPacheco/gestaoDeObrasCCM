"use client";

import { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  DocumentArrowUpIcon,
  PhotoIcon,
  XMarkIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

const MAX_FILES = 5;
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = [".pdf", ".jpg", ".jpeg", ".png"];

interface AsBuiltUploadProps {
  /** nomes já gravados que permanecem */
  keptFiles: string[];
  /** novos ficheiros selecionados */
  newFiles: File[];
  onKeptFilesChange: (files: string[]) => void;
  onNewFilesChange: (files: File[]) => void;
  disabled?: boolean;
  error?: string;
}

export function AsBuiltUpload({
  keptFiles,
  newFiles,
  onKeptFilesChange,
  onNewFilesChange,
  disabled = false,
  error,
}: AsBuiltUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const total = keptFiles.length + newFiles.length;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;

    setLocalError(null);
    const incoming = Array.from(fileList);
    const accepted: File[] = [];

    for (const file of incoming) {
      const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;

      if (!ACCEPTED.includes(ext)) {
        setLocalError(`Tipo não permitido: ${file.name}`);
        continue;
      }

      if (file.size > MAX_SIZE) {
        setLocalError(`${file.name} excede 5MB`);
        continue;
      }

      const duplicated =
        newFiles.some((f) => f.name === file.name && f.size === file.size) ||
        accepted.some((f) => f.name === file.name && f.size === file.size);

      if (duplicated) {
        setLocalError(`${file.name} já foi selecionado`);
        continue;
      }

      accepted.push(file);
    }

    if (total + accepted.length > MAX_FILES) {
      setLocalError(`Máximo de ${MAX_FILES} arquivos por programação`);
      return;
    }

    if (accepted.length) {
      onNewFilesChange([...newFiles, ...accepted]);
    }
  };

  const removeKept = (name: string) => {
    onKeptFilesChange(keptFiles.filter((f) => f !== name));
  };

  const removeNew = (index: number) => {
    onNewFilesChange(newFiles.filter((_, i) => i !== index));
  };

  /** remove o sufixo -<timestamp>-<random> gerado pelo Multer */
  const displayName = (stored: string) => {
    const match = stored.match(/^(.*)-\d{13}-\d+(\.[^.]+)$/);
    return match ? `${match[1]}${match[2]}` : stored;
  };

  return (
    <Box>
      <div className="flex items-center gap-2 mb-4">
        <DocumentArrowUpIcon className="w-6 h-6 text-blue-500" />
        <h3 className="text-lg font-bold text-zinc-700">Arquivos As Built</h3>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full h-28 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition
          ${disabled ? "opacity-50 cursor-not-allowed border-gray-300" : "cursor-pointer"}
          ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-400 hover:bg-zinc-50"}`}
      >
        <input
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          disabled={disabled || total >= MAX_FILES}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="absolute w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        <PhotoIcon className="w-10 h-10 text-gray-400" />
        <p className="text-blue-500 text-sm mt-1">
          Clique para selecionar arquivos ou arraste e solte
        </p>
      </div>

      <div className="mt-3 flex justify-between items-start text-sm">
        <div className="text-zinc-600 space-y-0.5">
          <p>✔ Máximo de {MAX_FILES} arquivos</p>
          <p>✔ Tamanho máximo: 5MB por arquivo</p>
          <p>✔ Formatos: PDF, JPG, JPEG, PNG</p>
        </div>
        <span className="text-zinc-500 font-semibold whitespace-nowrap">
          {total} / {MAX_FILES}
        </span>
      </div>

      {(localError || error) && (
        <p className="mt-2 text-sm text-red-600">{localError ?? error}</p>
      )}

      {keptFiles.length > 0 && (
        <Box mt={3}>
          <Typography variant="caption" className="text-zinc-500 font-semibold">
            Arquivos já anexados
          </Typography>

          {keptFiles.map((name) => (
            <Box
              key={name}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              className="bg-zinc-50 rounded px-2 py-1 mt-1"
            >
              <div className="flex items-center gap-2 min-w-0">
                <PaperClipIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                <Typography variant="body2" className="truncate">
                  {displayName(name)}
                </Typography>
              </div>

              {!disabled && (
                <button type="button" onClick={() => removeKept(name)}>
                  <XMarkIcon width={18} className="text-red-500" />
                </button>
              )}
            </Box>
          ))}
        </Box>
      )}

      {newFiles.length > 0 && (
        <Box mt={2}>
          <Typography
            variant="caption"
            className="text-green-600 font-semibold"
          >
            Novos arquivos
          </Typography>

          {newFiles.map((file, index) => (
            <Box
              key={`${file.name}-${index}`}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              className="bg-green-50 rounded px-2 py-1 mt-1"
            >
              <div className="flex items-center gap-2 min-w-0">
                <PaperClipIcon className="w-4 h-4 text-green-500 shrink-0" />
                <Typography variant="body2" className="truncate">
                  {file.name}
                </Typography>
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>

              <button type="button" onClick={() => removeNew(index)}>
                <XMarkIcon width={18} className="text-red-500" />
              </button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
