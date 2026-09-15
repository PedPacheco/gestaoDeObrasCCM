"use client";

import { useRef, useState } from "react";

import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/solid";

interface ReclamacoesUploadProps {
  onFile: (file: File) => void;
  isPending: boolean;
  compact: boolean;
}

export function ReclamacoesUpload({
  onFile,
  isPending,
  compact,
}: ReclamacoesUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const emit = (list: FileList | null) => {
    const file = [...(list ?? [])].find((item) =>
      item.name.toLowerCase().endsWith(".xlsx"),
    );

    if (file) onFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx"
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
                ? "Lendo planilha…"
                : "Arraste uma nova planilha ou clique para substituir os dados"}
            </span>
          </div>
        ) : (
          <>
            <DocumentArrowUpIcon className="w-12 h-12 text-[#53FF75]" />

            <span className="text-white font-bold text-lg">
              Arraste a planilha &quot;Reclam_Ouvidoria CIP&quot; aqui
            </span>

            <span className="text-zinc-400 text-sm text-center max-w-md">
              Aceita o arquivo .xlsx exportado do SharePoint, lendo a aba
              &quot;Reclamação_MT|BT&quot;. Os dados ficam apenas nesta
              tela — nada é enviado ao servidor.
            </span>
          </>
        )}
      </div>
    </>
  );
}
