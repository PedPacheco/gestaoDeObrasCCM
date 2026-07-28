import { Checkbox, FormControlLabel, Grid, TextField } from "@mui/material";

import { ExecutionReportData } from "./executionReportDialog";

interface ExecutionBasicPanelProps {
  formData: ExecutionReportData;
  formErrors: Record<string, string>;
  handleExecutionReportChange: (
    field: keyof ExecutionReportData,
  ) => (event: any) => void;
}

export const ExecutionBasicPanel: React.FC<ExecutionBasicPanelProps> = ({
  formData,
  formErrors,
  handleExecutionReportChange,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Supervisor"
          value={formData.supervisor || ""}
          onChange={handleExecutionReportChange("supervisor")}
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
          value={formData.startTime}
          onChange={handleExecutionReportChange("startTime")}
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
          value={formData.finishTime}
          onChange={handleExecutionReportChange("finishTime")}
          error={!!formErrors.finishTime}
          helperText={formErrors.finishTime}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Nome Operador COI - Inicio"
          value={formData.startContact || ""}
          error={!!formErrors.startContact}
          helperText={formErrors.startContact}
          onChange={handleExecutionReportChange("startContact")}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Nome Operador COI - Término"
          value={formData.endContact || ""}
          error={!!formErrors.endContact}
          helperText={formErrors.endContact}
          onChange={handleExecutionReportChange("endContact")}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Justificativa de Atraso"
          multiline
          minRows={2}
          value={formData.delayJustification || ""}
          onChange={handleExecutionReportChange("delayJustification")}
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
                // wasTheWorkCompleted === 100
                //   ? true
                //   : formData.partialConnectionReleased || false

                formData.partialConnectionReleased
              }
              // disabled={wasTheWorkCompleted === 100}
              onChange={
                // wasTheWorkCompleted === 100
                //   ? undefined
                //   :
                handleExecutionReportChange("partialConnectionReleased")
              }
            />
          }
          label="Liberado para publicação?"
        />
      </Grid>
    </Grid>
  );
};
