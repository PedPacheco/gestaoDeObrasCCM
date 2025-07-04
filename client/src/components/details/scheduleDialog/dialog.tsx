import {
  FormData,
  useScheduleForm,
  useScheduleSubmit,
} from "@/hooks/useSchedule";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { ButtonComponent } from "../../common/Button";
import { BasicInfoPanel } from "./basicInfoPanel";
import { AccordionPanel } from "../accordionPanel";
import { ServiceEquipmentPanel } from "./serviceEquipmentPanel";
import { TeamsPanel } from "./teamsPanel";
import { AdditionalInfoPanel } from "./additionalInfoPanel";

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
    restricao: Array<{ id: number; restricao: string }>;
  };
  scheduleForm: ScheduleFormHookReturn;
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
}: ScheduleFormDialogProps) {
  const {
    expanded,
    formData,
    executionReportData,
    formErrors,
    handleAccordionChange,
    handleInputChange,
    openExecChangeDialog,
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
            onInputChange={handleInputChange}
          />
        </AccordionPanel>

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
          />
        </AccordionPanel>

        {!isInsert && (
          <AccordionPanel
            id="panel4"
            title="Informações Adicionais"
            expanded={expanded}
            onChange={handleAccordionChange}
          >
            <AdditionalInfoPanel
              formData={formData}
              options={options}
              onInputChange={handleInputChange}
            />
          </AccordionPanel>
        )}
      </DialogContent>

      <DialogActions>
        <ButtonComponent text="Cancelar" onClick={onClose} />
        <ButtonComponent
          styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={() => {
            if (openExecChangeDialog) {
              onExecutionDialogOpen(true);
            } else {
              handleSubmit(initialExecValue, "schedule");
            }
          }}
          disabled={isPending}
          text={submitButtonText}
        />
      </DialogActions>
    </Dialog>
  );
}
