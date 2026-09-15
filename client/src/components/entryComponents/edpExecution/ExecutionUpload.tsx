"use client";

import { useRef, useState } from "react";

import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/solid";

interface ExecutionUploadProps {
  onFiles: (files: File[]) => void;
  isPending: boolean;
  compact: boolean;
}

export function ExecutionUpload({
  onFiles,
  isPending,
  compact,
}: ExecutionUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const emit = (list: FileList | null) => {
    const files = [...(list ?? [])].filter((file) =>
      file.name.toLowerCase().endsWith(".xlsx"),
    );

    if (files.length) onFiles(files);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx"
        multiple
        ref={inputRef}
        onChange={(event) => emit(event.target.files)}
        className="hidden"
      />

      <div
        onClick={() => !isPending && inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (!isPending) emit(event.dataTransfer.files);
        }}
        className={`
          flex flex-col items-center justify-center gap-2 rounded-2xl
          border-2 border-dashed cursor-pointer transition-all
          ${compact ? "py-5 px-6" : "py-16 px-6"}
          ${
            isDragging
              ? "border-[#53FF75] bg-[#53FF75]/5"
              : "border-white/10 bg-gradient-to-br from-[#1e2f42] to-[#192535] hover:border-white/25"
          }
          ${isPending ? "opacity-60 pointer-events-none" : ""}
        `}
      >
        {compact ? (
          <div className="flex items-center gap-3 text-zinc-300">
            <ArrowUpTrayIcon className="w-5 h-5 text-[#53FF75]" />
            <span className="text-sm font-medium">
              {isPending
                ? "Lendo planilhas…"
                : "Arraste mais relatórios ou clique para selecionar"}
            </span>
          </div>
        ) : (
          <>
            <DocumentArrowUpIcon className="w-12 h-12 text-[#53FF75]" />

            <span className="text-white font-bold text-lg">
              {isPending
                ? "Lendo planilhas…"
                : "Arraste os relatórios do app SIGO aqui"}
            </span>

            <span className="text-zinc-400 text-sm text-center max-w-md">
              Aceita vários arquivos .xlsx de uma vez. O tipo (Execução EDP ou
              Parceiro) é identificado automaticamente pelas abas da planilha.
            </span>
          </>
        )}
      </div>
    </>
  );
}
