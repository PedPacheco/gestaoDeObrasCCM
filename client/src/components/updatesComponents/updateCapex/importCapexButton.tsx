"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { Box, LinearProgress, Typography } from "@mui/material";

const POLLING_INTERVAL = 1500;
const STORAGE_KEY = "capexJobId";

interface ImportCapexButtonProps {
  token?: string;
}

export function ImportCapexButton({ token }: ImportCapexButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [progress, setProgress] = useState<number | null>(null);
  const [progressLabel, setProgressLabel] = useState<string>("");

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = (jobId: string) => {
    // 🛑 evita múltiplos intervals
    if (pollingRef.current) return;

    setProgress(0);
    setProgressLabel("Iniciando processamento...");

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/capex/progress/${jobId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const progressData = await res.json();

        if (!res.ok) {
          throw new Error(progressData?.message || "Erro ao buscar progresso");
        }

        const currentProgress = progressData.data.percentage ?? 0;
        // const processed = progressData.data.processed ?? 0;
        const status = progressData.data.status ?? "";

        setProgress(currentProgress);
        setProgressLabel(progressData.data.message);

        // ✅ FINALIZAÇÃO
        if (currentProgress >= 100 || status === "done") {
          stopPolling();
          localStorage.removeItem(STORAGE_KEY);

          setProgress(100);
          setProgressLabel("Concluído!");
          setSuccess("Arquivo enviado e processado com sucesso");
          setOpenModal(true);

          router.refresh();
        }

        if (status === "failed") {
          stopPolling();
          localStorage.removeItem(STORAGE_KEY);

          setProgress(null);
          throw new Error(progressData?.message || "Processamento falhou");
        }
      } catch (err: any) {
        stopPolling();
        setProgress(null);
        setProgressLabel("");
        setError(err.message);
      }
    }, POLLING_INTERVAL);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/import/capex", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Erro ao importar arquivo");
        }

        const { jobId } = data;

        if (!jobId) {
          throw new Error("jobId não encontrado na resposta");
        }

        // ✅ SALVA NO LOCALSTORAGE
        localStorage.setItem(STORAGE_KEY, jobId);

        resetFileInput();
        startPolling(jobId);
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  // ✅ RECUPERA JOB AO RECARREGAR A PÁGINA
  useEffect(() => {
    const savedJobId = localStorage.getItem(STORAGE_KEY);

    if (savedJobId) {
      startPolling(savedJobId);
    }

    return () => stopPolling();
  }, []);

  const isProcessing = isPending || (progress !== null && progress < 100);

  return (
    <>
      <input
        type="file"
        accept=".xlsx"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <Box className="flex flex-col gap-2 w-72">
        <ButtonComponent
          onClick={handleClick}
          startIcon={<DocumentArrowDownIcon width={25} height={25} />}
          text="Importar Arquivo CN52N"
          disabled={isProcessing}
          styled="w-72"
        />

        {progress !== null && (
          <Box className="w-full">
            <Box className="flex justify-between items-center mb-1">
              <Typography variant="caption" color="text.secondary">
                {progressLabel}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ borderRadius: 1, height: 6 }}
            />
          </Box>
        )}
      </Box>

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className="font-semibold text-xl">{success}</span>
      </ModalComponent>

      {error && (
        <ErrorModal
          open={true}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </>
  );
}
