import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  TextField,
} from "@mui/material";
import { ExecutionReportData } from "./executionReportDialog";
import { FormData } from "@/hooks/useSchedule";

interface ExecutionBasicPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (
    field: keyof FormData | `executionReport.${keyof ExecutionReportData}`
  ) => (event: any) => void;
}

export const ExecutionBasicPanel: React.FC<ExecutionBasicPanelProps> = ({
  formData,
  formErrors,
  onInputChange,
}) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Supervisor"
        value={formData.executionReport?.supervisor || ""}
        onChange={onInputChange("executionReport.supervisor")}
        error={!!formErrors.supervisor}
        helperText={formErrors.supervisor}
      />
    </Grid>

    <Grid item xs={12} sm={3}>
      <TextField
        fullWidth
        label="Horário de Início"
        value={formData.executionReport?.startTime || ""}
        onChange={onInputChange("executionReport.startTime")}
        error={!!formErrors.startTime}
        helperText={formErrors.startTime}
      />
    </Grid>

    <Grid item xs={12} sm={3}>
      <TextField
        fullWidth
        label="Horário de Término"
        value={formData.finishTime || ""}
        onChange={onInputChange("executionReport.finishTime")}
        error={!!formErrors.finishTime}
        helperText={formErrors.finishTime}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Contato Início"
        value={formData.executionReport?.startContact || ""}
        error={!!formErrors.startContact}
        helperText={formErrors.startContact}
        onChange={onInputChange("executionReport.startContact")}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Contato Término"
        value={formData.executionReport?.endContact || ""}
        error={!!formErrors.endContact}
        helperText={formErrors.endContact}
        onChange={onInputChange("executionReport.endContact")}
      />
    </Grid>

    <Grid item xs={12}>
      <TextField
        fullWidth
        label="Justificativa de Atraso"
        multiline
        minRows={2}
        value={formData.executionReport?.delayJustification || ""}
        onChange={onInputChange("executionReport.delayJustification")}
      />
    </Grid>

    <Grid item xs={12}>
      <FormControlLabel
        control={
          <Checkbox
            checked={
              formData.executionReport?.partialConnectionReleased || false
            }
            onChange={onInputChange(
              "executionReport.partialConnectionReleased"
            )}
          />
        }
        label="Liberado para ligação parcial?"
      />
    </Grid>
  </Grid>
);
