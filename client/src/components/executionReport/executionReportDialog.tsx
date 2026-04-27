import { useState } from "react";
import { z } from "zod";

import ErrorModal from "@/components/common/ErrorModal";
import { useUser } from "@/contexts/userContext";
import { UseExecutionServiceFormReturn } from "@/hooks/useExecutionServicesForm";
import { useExecutionServicesSubmit } from "@/hooks/useExecutionServicesSubmit";
import {
  executionReportSchema,
  validationExecutionService,
} from "@/validations/validationExecutionServices";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";

import { AdditionalExecutionInfoPanel } from "./additionalExecutionInfoPanel";
import { AsBuiltImport } from "./asBuiltImport";
import { ExecutionEquipmentPanel } from "./EquipmentPanel";
import { ExecutionBasicPanel } from "./executionBasicPanel";
import { useFeedback } from "@/hooks/useFeedback";
import { AccordionPanel } from "./accordionPanel";
import { ButtonComponent } from "../common/Button";

export type ExecutionReportData = z.infer<typeof executionReportSchema>;

export interface ExecutionReportDialogProps {
  open: boolean;
  onClose: () => void;
  executionReportIsInsert: boolean;
  onSuccess: (success: string) => void;
  executionForm: UseExecutionServiceFormReturn;
  executionIsPartial?: boolean;
  onModalOpen: (open: boolean) => void;
}

export function ExecutionReportDialog({
  executionReportIsInsert,
  executionIsPartial,
  onClose,
  onSuccess,
  open,
  executionForm,
  onModalOpen,
}: ExecutionReportDialogProps) {
  const { showError } = useFeedback();
  const [files, setFiles] = useState<File[]>([]);

  const { user, permissions } = useUser();

  const {
    executionReportData,
    buildPayload,
    handleExecutionReportChange,
    onAddEquipment,
    onEquipmentChange,
    onRemoveEquipment,
    formErrors,
    setFormErrors,
    handleAccordionChange,
    expanded,
  } = executionForm;

  const { handleSubmit, isPending } = useExecutionServicesSubmit({
    isInsert: executionReportIsInsert,
    onClose,
    onError: showError,
    onSuccess,
    onModalOpen,
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
        {permissions?.permissao_visualizacao === "parcial" ? undefined : (
          <>
            <AccordionPanel
              id="panel1"
              title="Informações Básicas"
              expanded={expanded}
              onChange={handleAccordionChange}
            >
              <ExecutionBasicPanel
                formData={executionReportData}
                formErrors={formErrors}
                handleExecutionReportChange={handleExecutionReportChange}
                // wasTheWorkCompleted={wasTheWorkCompleted}
              />
            </AccordionPanel>

            <AccordionPanel
              id="panel2"
              title="Equipamentos"
              expanded={expanded}
              onChange={handleAccordionChange}
            >
              <ExecutionEquipmentPanel
                formData={executionReportData}
                formErrors={formErrors}
                handleExecutionReportChange={handleExecutionReportChange}
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
                formData={executionReportData}
                formErrors={formErrors}
                handleExecutionReportChange={handleExecutionReportChange}
              />
            </AccordionPanel>
          </>
        )}

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

                console.log(result);
                result.error.issues.forEach((err: any) => {
                  const field = err.path.join(".");
                  fieldErrors[field] = err.message;
                });

                setFormErrors(fieldErrors);
                showError("Erro ao salvar relatório de execução");
                return;
              }

              handleSubmit(result.data, files);
            } else {
              const formData = buildPayload();

              const formDataWithUser = {
                ...formData,
                idUser: user?.id,
              };

              if (!executionIsPartial) return;

              const validationSchema =
                validationExecutionService(executionIsPartial);

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
                showError("Erro ao salvar relatório de execução");
                return;
              }

              handleSubmit(result.data, files);
            }
          }}
          disabled={isPending}
          text={submitButtonText}
        />
      </DialogActions>
    </Dialog>
  );
}
