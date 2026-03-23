import { useState } from "react";

import ErrorModal from "@/components/common/ErrorModal";
import { useUser } from "@/contexts/userContext";
import { useScheduleForm } from "@/hooks/useScheduleForm";
import { useScheduleSubmit } from "@/hooks/useScheduleSubmit";
import { schedulesSchema } from "@/validations/validationSchedules";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
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

import { ButtonComponent } from "../../../common/Button";
import { AccordionPanel } from "../../accordionPanel";
import { AdditionalInfoPanel } from "./additionalInfoPanel";
import { BasicInfoPanel } from "./basicInfoPanel";
import { RestrictionsPanel } from "./restrictionsPanel";
import { ServiceEquipmentPanel } from "./serviceEquipmentPanel";
import { TeamsPanel } from "./teamsPanel";

export type ScheduleFormHookReturn = ReturnType<typeof useScheduleForm>;

export interface ScheduleFormDialogProps {
  open: boolean;
  onClose: () => void;
  idWork: number;
  isInsert: boolean;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  onModalOpen: (open: boolean) => void;
  onExecutionDialogOpen: (open: boolean) => void;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string; tipo_restricao: string }>;
  };
  scheduleForm: ScheduleFormHookReturn;
  statusWork: number;
}

export default function ScheduleFormDialog({
  open,
  onExecutionDialogOpen,
  onClose,
  idWork,
  isInsert,
  onError,
  onSuccess,
  onModalOpen,
  options,
  scheduleForm,
  statusWork,
}: ScheduleFormDialogProps) {
  const [error, setError] = useState<string | null>();
  const { permissions } = useUser();

  const {
    expanded,
    formData,
    executionReportData,
    formErrors,
    handleAccordionChange,
    handleInputChange,
    setFormErrors,
    initialExecValue,
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

  const dialogTitle = isInsert ? "Nova Programação" : "Editar Programação";
  const submitButtonText = isPending ? "Salvando..." : "Salvar Programação";

  const disabledFields = () => {
    if (isInsert) {
      return (
        permissions?.permissao_visualizacao === "parcial" &&
        (statusWork === 3 || statusWork === 2)
      );
    }

    return (
      permissions?.permissao_visualizacao === "parcial" && statusWork === 35
    );
  };

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
          <Typography variant="h6">{dialogTitle}</Typography>
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
          <BasicInfoPanel
            formData={formData}
            formErrors={formErrors}
            isInsert={isInsert}
            disabledFields={disabledFields}
            onInputChange={handleInputChange}
          />
        </AccordionPanel>

        <>
          <AccordionPanel
            id="panel2"
            title="Serviço e Equipamentos"
            expanded={expanded}
            onChange={handleAccordionChange}
          >
            <ServiceEquipmentPanel
              formData={formData}
              formErrors={formErrors}
              onInputChange={handleInputChange}
              disabledFields={disabledFields}
              permissionVisualization={permissions?.permissao_visualizacao}
            />
          </AccordionPanel>

          <AccordionPanel
            id="panel3"
            title="Equipes"
            expanded={expanded}
            onChange={handleAccordionChange}
          >
            <TeamsPanel
              formData={formData}
              formErrors={formErrors}
              onInputChange={handleInputChange}
              disabledFields={disabledFields}
            />
          </AccordionPanel>
        </>

        {!isInsert && (
          <>
            <AccordionPanel
              id="panel4"
              title="Informações Adicionais"
              expanded={expanded}
              onChange={handleAccordionChange}
            >
              <AdditionalInfoPanel
                formData={formData}
                formErrors={formErrors}
                options={options}
                onInputChange={handleInputChange}
                disabledFields={disabledFields}
                permission={permissions?.permissao_visualizacao}
              />
            </AccordionPanel>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <AccordionPanel
                id="panel5"
                title="Restrições"
                expanded={expanded}
                onChange={handleAccordionChange}
              >
                <RestrictionsPanel
                  formData={formData}
                  formErrors={formErrors}
                  options={options}
                  onInputChange={handleInputChange}
                  disabledFields={disabledFields}
                />
              </AccordionPanel>
            </LocalizationProvider>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <ButtonComponent text="Cancelar" onClick={onClose} />
        <ButtonComponent
          styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={() => {
            const validationResult =
              schedulesSchema(isInsert).safeParse(formData);

            if (!validationResult.success) {
              const fieldErrors: Record<string, string> = {};
              validationResult.error.issues.forEach((err) => {
                const path = err.path.join(".");
                fieldErrors[path] = err.message;
              });
              setFormErrors(fieldErrors);
              setError("Erro ao salvar programação");

              return;
            }
            setFormErrors({});

            const execAlterado =
              formData.exec !== initialExecValue &&
              initialExecValue === "null" &&
              formData.exec !== "" &&
              formData.exec !== "0";

            if (execAlterado) {
              onExecutionDialogOpen(true);
            } else {
              handleSubmit(validationResult.data, "schedule");
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
