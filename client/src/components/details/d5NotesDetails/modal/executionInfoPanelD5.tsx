"use client";

import { Box, TextField } from "@mui/material";
import { AsBuiltUpload } from "./asBuiltUploadD5";
import { D5FormData } from "@/hooks/d5Notes/useD5ScheduleForm";

interface ExecutionInfoPanelD5Props {
  formData: any;
  formErrors: any;
  keptFiles: string[];
  newFiles: File[];
  onInputChange: (field: keyof D5FormData) => (event: any) => void;
  onKeptFilesChange: (files: string[]) => void;
  onNewFilesChange: (files: File[]) => void;
}

export function ExecutionInfoPanelD5({
  formData,
  formErrors,
  keptFiles,
  newFiles,
  onInputChange,
  onKeptFilesChange,
  onNewFilesChange,
}: ExecutionInfoPanelD5Props) {
  // regra da entidade: anexos só após execução informada
  const hasExecution = formData.exec != null && formData.exec !== undefined;

  return (
    <Box className="flex flex-col gap-6">
      <TextField
        label="Atividades Realizadas"
        multiline
        rows={5}
        fullWidth
        value={formData.executionObservation ?? ""}
        onChange={onInputChange("executionObservation")}
        error={!!formErrors.executionObservation}
        helperText={
          formErrors.executionObservation ??
          (hasExecution
            ? "Descreva as atividades executadas em campo"
            : "Disponível após informar a execução")
        }
        disabled={!hasExecution}
        placeholder="Ex.: Substituição de 3 postes, instalação de chave fusível..."
      />

      <AsBuiltUpload
        keptFiles={keptFiles}
        newFiles={newFiles}
        onKeptFilesChange={onKeptFilesChange}
        onNewFilesChange={onNewFilesChange}
        disabled={!hasExecution}
        error={formErrors.files}
      />

      {!hasExecution && (
        <p className="text-sm text-amber-600 -mt-3">
          ⚠ Informe a quantidade executada no painel de Serviço para habilitar
          estes campos.
        </p>
      )}
    </Box>
  );
}
