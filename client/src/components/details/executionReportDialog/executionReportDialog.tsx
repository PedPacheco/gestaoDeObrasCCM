import { Cookies } from "react-cookie";
import { z } from "zod";

import {
  INITIAL_EXECUTION_REPORT,
  useScheduleSubmit,
} from "@/hooks/useSchedule";
import { executionReportSchema } from "@/validations/validationSchedules";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";

import { ButtonComponent } from "../../common/Button";
import { ScheduleFormHookReturn } from "../scheduleDialog/dialog";
import { AdditionalExecutionInfoPanel } from "./additionalExecutionInfoPanel";
import { ExecutionEquipmentPanel } from "./EquipmentPanel";
import { ExecutionBasicPanel } from "./executionBasicPanel";
import { AccordionPanel } from "../accordionPanel";
import { useEffect } from "react";

export type ExecutionReportData = z.infer<typeof executionReportSchema>;

export interface ExecutionReportDialogProps {
  open: boolean;
  onClose: () => void;
  idWork: number;
  isInsert: boolean;
  executionReportIsInsert: boolean;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  onModalOpen: (open: boolean) => void;
  scheduleForm: ScheduleFormHookReturn;
}

export function ExecutionReportDialog({
  idWork,
  isInsert,
  executionReportIsInsert,
  onClose,
  onError,
  onModalOpen,
  onSuccess,
  open,
  scheduleForm,
}: ExecutionReportDialogProps) {
  const {
    formData,
    executionReportData,
    formErrors,
    expanded,
    handleAccordionChange,
    handleInputChange,
    onAddEquipment,
    onEquipmentChange,
    onRemoveEquipment,
    setFormErrors,
  } = scheduleForm;

  const { handleSubmit, isPending } = useScheduleSubmit({
    formData,
    executionReportData,
    idWork,
    isInsert,
    onError,
    onSuccess,
    onModalOpen,
    onClose,
    setFormErrors,
  });

  const submitButtonText = isPending ? "Salvando..." : "Salvar Execução";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        style: {
          minHeight: "600px",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Confirmar Alteração da Execução</Typography>
          <IconButton onClick={onClose} />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <AccordionPanel
          id="panel1"
          title="Informações Básicas"
          expanded={expanded}
          onChange={handleAccordionChange}
        >
          <ExecutionBasicPanel
            formData={!executionReportIsInsert ? executionReportData : formData}
            formErrors={formErrors}
            onInputChange={handleInputChange}
          />
        </AccordionPanel>

        <AccordionPanel
          id="panel2"
          title="Equipamentos"
          expanded={expanded}
          onChange={handleAccordionChange}
        >
          <ExecutionEquipmentPanel
            formData={!executionReportIsInsert ? executionReportData : formData}
            formErrors={formErrors}
            onInputChange={handleInputChange}
            onAddEquipment={onAddEquipment}
            onEquipmentChange={onEquipmentChange}
            onRemoveEquipment={onRemoveEquipment}
          />
        </AccordionPanel>

        <AccordionPanel
          id="panel3"
          title="Informações Adicionais"
          expanded={expanded}
          onChange={handleAccordionChange}
        >
          <AdditionalExecutionInfoPanel
            formData={!executionReportIsInsert ? executionReportData : formData}
            formErrors={formErrors}
            onInputChange={handleInputChange}
          />
        </AccordionPanel>
      </DialogContent>

      <DialogActions>
        <ButtonComponent text="Cancelar" onClick={onClose} />
        <ButtonComponent
          styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={() => {
            !executionReportIsInsert
              ? handleSubmit(null, "executionReport")
              : handleSubmit(null, "schedule");
          }}
          disabled={isPending}
          text={submitButtonText}
        />
      </DialogActions>
    </Dialog>
  );
}
