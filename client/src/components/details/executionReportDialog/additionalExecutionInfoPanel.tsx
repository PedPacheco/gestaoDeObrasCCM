import { FormData } from "@/hooks/useScheduleForm";
import { Grid, TextField, FormControlLabel, Checkbox } from "@mui/material";
import { ExecutionReportData } from "./executionReportDialog";
import { resolveExecutionReportContext } from "@/utils/formatValue";

interface AdditionalExecutionInfoPanelProps {
  formData: FormData | ExecutionReportData;
  formErrors: Record<string, string>;
  onInputChange: (
    field:
      | keyof FormData
      | `executionReport.${keyof ExecutionReportData}`
      | keyof ExecutionReportData
  ) => (event: any) => void;
}

export const AdditionalExecutionInfoPanel: React.FC<
  AdditionalExecutionInfoPanelProps
> = ({ formData, formErrors, onInputChange }) => {
  const { data, prefix } = resolveExecutionReportContext(formData);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Observação Geral"
          value={data.generalObservation}
          onChange={onInputChange(`${prefix}generalObservation`)}
          multiline
          minRows={2}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Situação da Obra"
          value={data.workSituation || ""}
          onChange={onInputChange(`${prefix}workSituation`)}
          error={!!formErrors.workSituation}
          helperText={formErrors.workSituation}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Motivo"
          value={data.reason || ""}
          onChange={onInputChange(`${prefix}reason`)}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={data.provisionalKeyInstalled || false}
              onChange={onInputChange(`${prefix}provisionalKeyInstalled`)}
            />
          }
          label="Chave Provisória Instalada?"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Referência da Chave Provisória - Exemplo: 175ET00554845"
          value={data.provisionalKeyReference || ""}
          onChange={onInputChange(`${prefix}provisionalKeyReference`)}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={data.provisionalKeyWithdrawn || false}
              onChange={onInputChange(`${prefix}provisionalKeyWithdrawn`)}
            />
          }
          label="Chave Provisória Retirada?"
        />
      </Grid>
    </Grid>
  );
};
