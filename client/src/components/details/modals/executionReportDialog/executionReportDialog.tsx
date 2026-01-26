import { z } from "zod";

import {
  executionReportSchema,
  validationSchedulesSchema,
} from "@/validations/validationSchedules";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";

import { ButtonComponent } from "../../../common/Button";
import { AccordionPanel } from "../../accordionPanel";
import { ScheduleFormHookReturn } from "../scheduleDialog/dialog";
import { AdditionalExecutionInfoPanel } from "./additionalExecutionInfoPanel";
import { ExecutionEquipmentPanel } from "./EquipmentPanel";
import { ExecutionBasicPanel } from "./executionBasicPanel";
import { useScheduleSubmit } from "@/hooks/useScheduleSubmit";
import { useState } from "react";
import ErrorModal from "@/components/common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { AsBuiltImport } from "./asBuiltImport";
import { useUser } from "@/contexts/userContext";

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
  totalExec: number;
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
  totalExec,
}: ExecutionReportDialogProps) {
  const [error, setError] = useState<string | null>();
  const [files, setFiles] = useState<File[]>([]);

  const { user } = useUser();

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

  const wasTheWorkCompleted = Number(formData?.exec ?? 0) + totalExec;

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
            wasTheWorkCompleted={wasTheWorkCompleted}
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

        <AccordionPanel
          id="panel4"
          title="Arquivos As Build"
          expanded={expanded}
          onChange={handleAccordionChange}
        >
          <AsBuiltImport files={files} setFiles={setFiles} />
        </AccordionPanel>
      </DialogContent>

      <DialogActions>
        <ButtonComponent text="Cancelar" onClick={onClose} />
        <ButtonComponent
          styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={() => {
            if (!executionReportIsInsert) {
              const result =
                executionReportSchema.safeParse(executionReportData);

              if (!result.success) {
                const fieldErrors: Record<string, string> = {};
                result.error.issues.forEach((err: any) => {
                  const field = err.path.join(".");
                  fieldErrors[field] = err.message;
                });

                setFormErrors(fieldErrors);
                setError("Erro ao salvar relatório de execução");
                return;
              }

              handleSubmit(result.data, "executionReport", files);
            } else {
              const formDataWithUser = {
                ...formData,
                idUser: user?.id,
              };

              const validationSchema = validationSchedulesSchema(null, false);
              const result = validationSchema.safeParse(formDataWithUser);

              if (!result.success) {
                const fieldErrors: Record<string, string> = {};

                result.error.issues.forEach((item: any) => {
                  if (item.errors) {
                    item.errors[0].map((err: any) => {
                      if (err.code === "invalid_type") return;

                      if (err.code === "custom") {
                        const field = err.path.join(".");
                        fieldErrors[field] = err.message;
                        return;
                      }

                      const field = err.path[0];
                      fieldErrors[field] = err.message;
                    });

                    return;
                  }

                  const field = item.path[1];
                  fieldErrors[field] = item.message;
                });

                setFormErrors(fieldErrors);
                setError("Erro ao salvar relatório de execução");
                return;
              }

              handleSubmit(result.data, "schedule", files);
            }
          }}
          disabled={isPending}
          text={submitButtonText}
        />
      </DialogActions>

      {error && (
        <ErrorModal
          open={true}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </Dialog>
  );
}
