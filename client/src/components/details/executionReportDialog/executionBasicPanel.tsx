import { FormData } from "@/hooks/useScheduleForm";
import { resolveExecutionReportContext } from "@/utils/formatValue";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  TextField,
} from "@mui/material";

import { ExecutionReportData } from "./executionReportDialog";

interface ExecutionBasicPanelProps {
  formData: FormData | ExecutionReportData;
  formErrors: Record<string, string>;
  onInputChange: (
    field:
      | keyof FormData
      | `executionReport.${keyof ExecutionReportData}`
      | keyof ExecutionReportData
  ) => (event: any) => void;
}

export const ExecutionBasicPanel: React.FC<ExecutionBasicPanelProps> = ({
  formData,
  formErrors,
  onInputChange,
}) => {
  const { data, prefix } = resolveExecutionReportContext(formData);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Supervisor"
          value={data.supervisor || ""}
          onChange={onInputChange(`${prefix}supervisor`)}
          error={!!formErrors.supervisor}
          helperText={formErrors.supervisor}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          type="time"
          label="Horário de Início (Real campo)"
          value={data.startTime}
          onChange={onInputChange(`${prefix}startTime`)}
          error={!!formErrors.startTime}
          helperText={formErrors.startTime}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          type="time"
          label="Horário de Término (Real campo)"
          value={data.finishTime}
          onChange={onInputChange(`${prefix}finishTime`)}
          error={!!formErrors.finishTime}
          helperText={formErrors.finishTime}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Contato Início"
          value={data.startContact || ""}
          error={!!formErrors.startContact}
          helperText={formErrors.startContact}
          onChange={onInputChange(`${prefix}startContact`)}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Contato Término"
          value={data.endContact || ""}
          error={!!formErrors.endContact}
          helperText={formErrors.endContact}
          onChange={onInputChange(`${prefix}endContact`)}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Justificativa de Atraso"
          multiline
          minRows={2}
          value={data.delayJustification || ""}
          onChange={onInputChange(`${prefix}delayJustification`)}
          error={!!formErrors.delayJustification}
          helperText={formErrors.delayJustification}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={data.partialConnectionReleased || false}
              onChange={onInputChange(`${prefix}partialConnectionReleased`)}
            />
          }
          label="Liberado para ligação parcial?"
        />
      </Grid>
    </Grid>
  );
};
