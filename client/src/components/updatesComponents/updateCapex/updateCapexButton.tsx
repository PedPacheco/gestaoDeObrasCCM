"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { useCapexSocket } from "@/hooks/updateCapex/useCapexSocket";

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { ArrowUpTrayIcon } from "@heroicons/react/24/solid";
import { Box, LinearProgress, Typography } from "@mui/material";

/**
 * Botão unificado para importação + atualização do CAPEX.
 *
 * Fluxo:
 *  1. Usuário seleciona o arquivo .xlsx
 *  2. POST /api/import/capex  →  proxy Next.js  →  /base-auxiliar/capex/pipeline
 *  3. Backend retorna { jobId }
 *  4. useCapexSocket entra na sala via jobId e recebe progresso em tempo real
 *  5. phase "done" → finaliza com sucesso | phase "error" → exibe mensagem
 *
 * Componente ImportCapexButton (polling) e a rota [jobId]/progress foram removidos.
 */

const phaseMessages: Record<string, string> = {
  reading: "Lendo arquivo",
  processing: "Processando dados",
  loading: "Carregando dados",
  calculando: "Calculando valores",
  updating: "Atualizando valores",
  done: "Finalizado",
};

export function CapexPipelineButton({ token }: { token?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  const { progress, message, phase, socketError, disconnect } = useCapexSocket(
    jobId,
    token,
  );

  // ─── Reage às fases terminais do socket ──────────────────────────────────
  useEffect(() => {
    if (!phase) return;

    if (phase === "done") {
      setIsDone(true);
      router.refresh();

      // Aguarda o usuário ver "Concluído!" antes de desconectar
      const timer = setTimeout(() => disconnect(), 1500);
      return () => clearTimeout(timer);
    }

    if (phase === "error") {
      setOpenModal(false);
      setError("Erro durante o pipeline de CAPEX. Tente novamente.");
      const timer = setTimeout(() => disconnect(), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Propaga erros de conexão do socket ──────────────────────────────────
  useEffect(() => {
    if (socketError) {
      setOpenModal(false);
      setError(`Falha na conexão: ${socketError}`);
    }
  }, [socketError]);

  // ─── Upload do arquivo ────────────────────────────────────────────────────
  const handleFileChange = (file?: File) => {
    if (!file) return;

    // Reset de estado anterior
    setIsDone(false);
    setError(null);
    setJobId(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Chamada passa pelo proxy Next.js — token não trafega no cliente
        const res = await fetch("/api/import/capex", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Erro ao iniciar pipeline");
        }

        if (!data.jobId) {
          throw new Error("jobId não retornado pelo servidor");
        }

        setJobId(data.jobId);
        setOpenModal(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        // Limpa o input para permitir reenvio do mesmo arquivo
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  };

  const isProcessing =
    isPending || (phase !== null && phase !== "done" && phase !== "error");

  return (
    <>
      <Box>
        <ButtonComponent
          onClick={() => fileInputRef.current?.click()}
          startIcon={<ArrowUpTrayIcon width={22} height={22} />}
          text="Importar + Atualizar CAPEX"
          disabled={isProcessing}
          styled="w-full"
        />

        <input
          type="file"
          accept=".xlsx"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0])}
        />
      </Box>

      {/* Modal de progresso */}
      <ModalComponent
        title="Atualização dos valores CAPEX/MO"
        onClose={() => {
          if (!isProcessing) setOpenModal(false);
        }}
        open={openModal}
      >
        <Box className="flex flex-col gap-3 min-w-[300px]">
          <Typography variant="body2" color="text.secondary">
            {message || "Conectando ao servidor..."}
          </Typography>

          <LinearProgress
            variant={progress !== null ? "determinate" : "indeterminate"}
            value={progress ?? 0}
            sx={{ borderRadius: 1, height: 6 }}
          />

          <Box className="flex justify-between items-center">
            <Typography variant="caption" color="text.secondary">
              {phase ? phaseMessages[phase] : "aguardando"}
            </Typography>
            {progress !== null && (
              <Typography variant="caption" color="text.secondary">
                {progress}%
              </Typography>
            )}
          </Box>

          {isDone && (
            <Typography
              variant="body2"
              color="success.main"
              fontWeight={600}
              className="text-center"
            >
              ✓ Concluído com sucesso!
            </Typography>
          )}
        </Box>
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
