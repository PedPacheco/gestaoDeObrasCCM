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
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
} from "@mui/material";
import { ButtonComponent } from "../common/Button";

export interface ScheduleFormDialogProps {
  open: boolean;
  onClose: () => void;
  idWork: number;
  isInsert: boolean;
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
  onModalOpen: (open: boolean) => void;
  scheduleData?: any;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string }>;
  };
}

export const SERVICE_TYPES = [
  "LV",
  "DP",
  "Obra livre",
  "DP + LV",
  "LV + Obra livre",
  "Regularização",
  "Desativação RD",
] as const;

export const EXECUTION_RESPONSIBILITIES = [
  "Edp",
  "Parceira",
  "Terceiro",
] as const;

export const SLIDER_MARKS = [
  { value: 0, label: "0" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

// components/BasicInfoPanel.tsx
interface BasicInfoPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  isInsert: boolean;
  onInputChange: (field: keyof FormData) => (event: any) => void;
  onSliderChange: (
    field: "prog" | "exec"
  ) => (event: Event, value: number | number[]) => void;
}

const BasicInfoPanel: React.FC<BasicInfoPanelProps> = ({
  formData,
  formErrors,
  isInsert,
  onInputChange,
  onSliderChange,
}) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Data da Programação"
        type="date"
        value={formData.dataProg}
        onChange={onInputChange("dataProg")}
        error={!!formErrors.dataProg}
        helperText={formErrors.dataProg}
        InputLabelProps={{ shrink: true }}
        required
      />
    </Grid>

    <Grid item xs={12} sm={3}>
      <TextField
        fullWidth
        label="Horário Início"
        type="time"
        value={formData.startTime}
        onChange={onInputChange("startTime")}
        error={!!formErrors.startTime}
        helperText={formErrors.startTime}
        InputLabelProps={{ shrink: true }}
        required
      />
    </Grid>

    <Grid item xs={12} sm={3}>
      <TextField
        fullWidth
        label="Horário Fim"
        type="time"
        value={formData.finishTime}
        onChange={onInputChange("finishTime")}
        error={!!formErrors.finishTime}
        helperText={formErrors.finishTime}
        InputLabelProps={{ shrink: true }}
        required
      />
    </Grid>

    <Grid item xs={12} sm={!isInsert && formData.exec !== undefined ? 6 : 12}>
      <Typography gutterBottom>
        Progresso Programado: {formData.prog}%
      </Typography>
      <Slider
        value={formData.prog}
        onChange={onSliderChange("prog")}
        valueLabelDisplay="auto"
        min={0}
        max={100}
        marks={SLIDER_MARKS}
      />
      {formErrors.prog && (
        <FormHelperText error>{formErrors.prog}</FormHelperText>
      )}
    </Grid>

    {!isInsert && (
      <Grid item xs={12} sm={6}>
        <Typography gutterBottom>
          Progresso Executado: {formData.exec}%
        </Typography>
        <Slider
          value={formData.exec}
          onChange={onSliderChange("exec")}
          valueLabelDisplay="auto"
          min={0}
          max={100}
          marks={SLIDER_MARKS}
        />
        {formErrors.exec && (
          <FormHelperText error>{formErrors.exec}</FormHelperText>
        )}
      </Grid>
    )}
  </Grid>
);

// components/ServiceEquipmentPanel.tsx
interface ServiceEquipmentPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: keyof FormData) => (event: any) => void;
}

const ServiceEquipmentPanel: React.FC<ServiceEquipmentPanelProps> = ({
  formData,
  formErrors,
  onInputChange,
}) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Tipo de Serviço</InputLabel>
        <Select
          value={formData.serviceType}
          onChange={onInputChange("serviceType")}
          label="Tipo de Serviço"
        >
          {SERVICE_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Equipamento a ser desligado"
        value={formData.equipment}
        onChange={onInputChange("equipment")}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="CHI"
        type="number"
        value={formData.chi}
        onChange={onInputChange("chi")}
        error={!!formErrors.chi}
        helperText={formErrors.chi}
        inputProps={{ min: 0 }}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Número DP"
        value={formData.numDp}
        onChange={onInputChange("numDp")}
      />
    </Grid>
  </Grid>
);

// components/TeamsPanel.tsx
interface TeamsPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: keyof FormData) => (event: any) => void;
}

const TeamsPanel: React.FC<TeamsPanelProps> = ({
  formData,
  formErrors,
  onInputChange,
}) => (
  <Grid container spacing={2}>
    {[
      { field: "lmTeam" as const, label: "Equipe LM" },
      { field: "regulTeam" as const, label: "Equipe Regular" },
      { field: "lvTeam" as const, label: "Equipe LV" },
    ].map(({ field, label }) => (
      <Grid item xs={12} sm={4} key={field}>
        <TextField
          fullWidth
          label={label}
          type="number"
          value={formData[field]}
          error={!!formErrors[field]}
          helperText={formErrors[field]}
          onChange={onInputChange(field)}
          inputProps={{ min: 0 }}
        />
      </Grid>
    ))}
  </Grid>
);

// components/AdditionalInfoPanel.tsx
interface AdditionalInfoPanelProps {
  formData: FormData;
  options: ScheduleFormDialogProps["options"];
  onInputChange: (field: keyof FormData) => (event: any) => void;
}

const AdditionalInfoPanel: React.FC<AdditionalInfoPanelProps> = ({
  formData,
  options,
  onInputChange,
}) => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Técnico Responsável</InputLabel>
        <Select
          value={formData.idTechnical}
          onChange={onInputChange("idTechnical")}
          label="Técnico Responsável"
        >
          {options.tecnico.map((tec) => (
            <MenuItem key={tec.id} value={tec.id}>
              {tec.tecnico}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Restrição de Execução</InputLabel>
        <Select
          value={formData.idExecutionRestriction}
          onChange={onInputChange("idExecutionRestriction")}
          label="Restrição de Execução"
        >
          {options.restricao.map((restriction) => (
            <MenuItem key={restriction.id} value={restriction.id}>
              {restriction.restricao}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Responsabilidade Execução</InputLabel>
        <Select
          value={formData.responsibility}
          onChange={onInputChange("responsibility")}
          label="Responsabilidade Execução"
        >
          {EXECUTION_RESPONSIBILITIES.map((responsibility) => (
            <MenuItem key={responsibility} value={responsibility}>
              {responsibility}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  </Grid>
);

// components/AccordionPanel.tsx
interface AccordionPanelProps {
  id: string;
  title: string;
  expanded: string | false;
  onChange: (panel: string) => (event: any, isExpanded: boolean) => void;
  children: React.ReactNode;
}

const AccordionPanel: React.FC<AccordionPanelProps> = ({
  id,
  title,
  expanded,
  onChange,
  children,
}) => (
  <Accordion expanded={expanded === id} onChange={onChange(id)}>
    <AccordionSummary>
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="h6">{title}</Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

// Main Component
export default function ScheduleFormDialog({
  open,
  onClose,
  idWork,
  isInsert,
  onError,
  onSuccess,
  onModalOpen,
  scheduleData,
  options,
}: ScheduleFormDialogProps) {
  const {
    formData,
    formErrors,
    expanded,
    setFormErrors,
    handleInputChange,
    handleSliderChange,
    handleAccordionChange,
    handleClose,
  } = useScheduleForm({ scheduleData, options, onClose });

  const { handleSubmit, isPending } = useScheduleSubmit({
    formData,
    idWork,
    isInsert,
    onError,
    onSuccess,
    onModalOpen,
    onClose: handleClose,
    setFormErrors,
  });

  const dialogTitle = isInsert ? "Nova Programação" : "Editar Programação";
  const submitButtonText = isPending ? "Salvando..." : "Salvar Programação";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
          <IconButton onClick={handleClose} />
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
            onSliderChange={handleSliderChange}
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
        <ButtonComponent text="Cancelar" onClick={handleClose} />
        <ButtonComponent
          styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          onClick={handleSubmit}
          disabled={isPending}
          text={submitButtonText}
        />
      </DialogActions>
    </Dialog>
  );
}
