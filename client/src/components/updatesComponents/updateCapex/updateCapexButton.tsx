"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import { Box, LinearProgress, Typography } from "@mui/material";

import { useCapexSocket } from "@/hooks/updateCapex/useCapexSocket";

// const phaseLabels: Record<string, string> = {
//   reading: "Lendo arquivo",
//   processing: "Processando dados",
//   loading: "Carregando dados",
//   calculating: "Calculando CAPEX",
//   updating: "Atualizando obras",
//   done: "Concluído",
// };

export function CapexPipelineButton({ token }: { token?: string }) {
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const { progress, message, phase, disconnect } = useCapexSocket(jobId, token);

  // 🚀 dispara seleção de arquivo
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // 🚀 upload + pipeline
  const handleFileChange = (file?: File) => {
    if (!file) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/capex/pipeline`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Erro ao iniciar pipeline");
        }

        if (!data.jobId) {
          throw new Error("jobId não retornado");
        }

        setJobId(data.jobId);
        setOpenModal(true);
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  // 🎯 finalização automática
  useEffect(() => {
    if (!phase) return;

    if (phase === "done") {
      setTimeout(() => {
        disconnect();
      }, 1000);
    }

    if (phase === "error") {
      setError("Erro durante o pipeline de CAPEX");
      setTimeout(() => {
        disconnect();
      }, 1000);
    }
  }, [phase, disconnect]);

  const isProcessing = isPending || (phase !== null && phase !== "done");

  return (
    <>
      <Box>
        <ButtonComponent
          onClick={handleClick}
          startIcon={<ArrowUpTrayIcon width={22} height={22} />}
          text="Importar + Atualizar CAPEX"
          disabled={isProcessing}
          styled="w-full"
        />

        {/* input escondido */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
      </Box>

      {/* modal */}
      <ModalComponent
        title="Atualização dos valores CAPEX/MO"
        onClose={() => setOpenModal(false)}
        open={openModal}
      >
        {progress !== null ? (
          <div className="flex flex-col gap-3">
            <span className="text-sm text-zinc-600">{message}</span>

            <LinearProgress variant="determinate" value={progress} />

            {phase === "done" && (
              <span className="text-green-600 font-semibold">Concluído!</span>
            )}
          </div>
        ) : (
          <span>Conectando ao servidor...</span>
        )}
      </ModalComponent>

      {error && (
        <ErrorModal
          open
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </>
  );
}
