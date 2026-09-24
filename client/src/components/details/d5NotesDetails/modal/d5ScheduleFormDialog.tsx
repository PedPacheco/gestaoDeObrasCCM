// components/d5Notes/details/d5ScheduleFormDialog.tsx
"use client";

import { useState, useTransition } from "react";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { XMarkIcon } from "@heroicons/react/24/outline";

import { ButtonComponent } from "@/components/common/Button";
import { AccordionPanel } from "@/components/executionReport/accordionPanel";
import { useD5ScheduleForm } from "@/hooks/d5Notes/useD5ScheduleForm";
import { D5ScheduleSchema } from "@/validations/d5NoteScheduleValidation";
import { upsertD5ScheduleAction } from "@/actions/d5Notes";

import { BasicInfoPanelD5 } from "./basicInfoPanelD5";
import { ServiceEquipmentPanelD5 } from "./serviceEquipmentPanelD5";
import { TeamsPanelD5 } from "./teamsPanelD5";
import { AdditionalInfoPanelD5 } from "./additionalInfoPanelD5";
import { ExecutionInfoPanelD5 } from "./executionInfoPanelD5";

const MAX_FILES = 5;

interface Props {
  open: boolean;
  onClose: () => void;
  d5NoteId: number;
  schedule?: any;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{
      id: number;
      restricao: string;
      tipo_restricao: string;
      responsabilidade: string;
    }>;
  };
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const PANEL_BY_FIELD: Record<string, string> = {
  scheduledDate: "panel1",
  prog: "panel1",
  startTime: "panel1",
  endTime: "panel1",
  exec: "panel2",
  numDp: "panel2",
  serviceType: "panel2",
  chi: "panel2",
  lmTeam: "panel3",
  lvTeam: "panel3",
  regulTeam: "panel3",
  technicalId: "panel4",
  restrictionId: "panel4",
  restrictionResponsible: "panel4",
  observation: "panel4",
  executionObservation: "panel5",
  files: "panel5",
};

export default function D5ScheduleFormDialog({
  open,
  onClose,
  d5NoteId,
  schedule,
  options,
  onError,
  onSuccess,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const isInsert = !schedule?.id;

  const {
    expanded,
    formData,
    formErrors,
    setFormErrors,
    handleAccordionChange,
    handleInputChange,
    handleExecChange,
    keptFiles,
    newFiles,
    setKeptFiles,
    setNewFiles,
    buildFormData,
  } = useD5ScheduleForm({ schedule, options });

  /* ---------------- Validação ---------------- */

  const validate = (): boolean => {
    const result = D5ScheduleSchema.safeParse({ ...formData, d5NoteId });

    const errors: Record<string, string> = {};

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path.join(".");
        if (!errors[field]) errors[field] = issue.message;
      }
    }

    // regras de anexos — dependem de estado fora do formData
    const totalFiles = keptFiles.length + newFiles.length;
    const hasExecution = formData.exec !== "" && Number(formData.exec) > 0;

    if (!hasExecution && totalFiles > 0) {
      errors.files = "Anexos só são permitidos após informar a execução";
    }

    if (!hasExecution && formData.executionObservation) {
      errors.executionObservation =
        "Preencha a execução antes de descrever as atividades";
    }

    if (totalFiles > MAX_FILES) {
      errors.files = `Máximo de ${MAX_FILES} arquivos por programação`;
    }

    setFormErrors(errors);

    const firstField = Object.keys(errors)[0];

    if (firstField) {
      const panel = PANEL_BY_FIELD[firstField] ?? "panel1";
      handleAccordionChange(panel)(null, true);
      onError("Verifique os campos destacados antes de salvar.");
      return false;
    }

    return true;
  };

  /* ---------------- Submissão ---------------- */

  const handleSave = () => {
    if (!validate()) return;

    const payload = buildFormData();

    if (isInsert) {
      payload.append("d5NoteId", String(d5NoteId));
    }

    startTransition(async () => {
      const response = await upsertD5ScheduleAction(schedule?.id, payload);

      if (response.success) {
        onSuccess(
          isInsert
            ? "Programação criada com sucesso"
            : "Programação atualizada com sucesso",
        );
        onClose();
      } else {
        onError(response.message ?? "Erro ao salvar programação");
      }
    });
  };

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  /* ---------------- Render ---------------- */

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ style: { minHeight: "520px", maxHeight: "90vh" } }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {isInsert ? "Nova Programação D5" : "Editar Programação D5"}
          </Typography>

          <IconButton onClick={handleClose} disabled={isPending}>
            <XMarkIcon width={22} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <AccordionPanel
            id="panel1"
            title="Informações Básicas"
            expanded={expanded}
            onChange={handleAccordionChange}
          >
            <BasicInfoPanelD5
              formData={formData}
              formErrors={formErrors}
              isInsert={isInsert}
              onInputChange={handleInputChange}
              onExecChange={handleExecChange}
            />
          </AccordionPanel>

          <AccordionPanel
            id="panel2"
            title="Serviço"
            expanded={expanded}
            onChange={handleAccordionChange}
          >
            <ServiceEquipmentPanelD5
              formData={formData}
              formErrors={formErrors}
              onInputChange={handleInputChange}
            />
          </AccordionPanel>

          <AccordionPanel
            id="panel3"
            title="Equipes"
            expanded={expanded}
            onChange={handleAccordionChange}
          >
            <TeamsPanelD5
              formData={formData}
              formErrors={formErrors}
              onInputChange={handleInputChange}
            />
          </AccordionPanel>

          <AccordionPanel
            id="panel4"
            title="Informações Adicionais"
            expanded={expanded}
            onChange={handleAccordionChange}
          >
            <AdditionalInfoPanelD5
              formData={formData}
              formErrors={formErrors}
              options={options}
              onInputChange={handleInputChange}
            />
          </AccordionPanel>

          <AccordionPanel
            id="panel5"
            title="Informações da Execução"
            expanded={expanded}
            onChange={handleAccordionChange}
          >
            <ExecutionInfoPanelD5
              formData={formData}
              formErrors={formErrors}
              onInputChange={handleInputChange}
              keptFiles={keptFiles}
              newFiles={newFiles}
              onKeptFilesChange={setKeptFiles}
              onNewFilesChange={setNewFiles}
            />
          </AccordionPanel>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions>
        <ButtonComponent
          text="Cancelar"
          onClick={handleClose}
          disabled={isPending}
        />

        <ButtonComponent
          styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-60"
          onClick={handleSave}
          disabled={isPending}
          text={isPending ? "Salvando..." : "Salvar Programação"}
        />
      </DialogActions>
    </Dialog>
  );
}
