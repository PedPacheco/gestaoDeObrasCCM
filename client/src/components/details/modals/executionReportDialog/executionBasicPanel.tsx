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
import { useEffect } from "react";

interface ExecutionBasicPanelProps {
  formData: FormData | ExecutionReportData;
  formErrors: Record<string, string>;
  onInputChange: (
    field:
      | keyof FormData
      | `executionReport.${keyof ExecutionReportData}`
      | keyof ExecutionReportData
  ) => (event: any) => void;
  wasTheWorkCompleted: number;
}

export const ExecutionBasicPanel: React.FC<ExecutionBasicPanelProps> = ({
  formData,
  formErrors,
  onInputChange,
  wasTheWorkCompleted,
}) => {
  const { data, prefix } = resolveExecutionReportContext(formData);

  useEffect(() => {
    if (wasTheWorkCompleted === 100) {
      onInputChange(`${prefix}partialConnectionReleased`)(true);
    }
  }, [wasTheWorkCompleted, onInputChange, prefix]);

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
          label="Nome Operador COI - Inicio"
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
          label="Nome Operador COI - Término"
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
              checked={
                wasTheWorkCompleted === 100
                  ? true
                  : data.partialConnectionReleased || false
              }
              disabled={wasTheWorkCompleted === 100}
              onChange={
                wasTheWorkCompleted === 100
                  ? undefined
                  : onInputChange(`${prefix}partialConnectionReleased`)
              }
            />
          }
          label="Liberado para publicação?"
        />
      </Grid>
    </Grid>
  );
};
