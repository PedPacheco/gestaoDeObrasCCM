import { FormData } from "@/hooks/useSchedule";
import {
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  FormControl,
} from "@mui/material";
import { ExecutionReportData } from "./executionReportDialog";

interface AdditionalExecutionInfoPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (
    field: keyof FormData | `executionReport.${keyof ExecutionReportData}`
  ) => (event: any) => void;
}

export const AdditionalExecutionInfoPanel: React.FC<
  AdditionalExecutionInfoPanelProps
> = ({ formData, formErrors, onInputChange }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Observação Geral"
        value={formData.executionReport?.generalObservation}
        onChange={onInputChange("executionReport.generalObservation")}
        multiline
        minRows={2}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Situação da Obra"
        value={formData.executionReport?.workSituation || ""}
        onChange={onInputChange("executionReport.workSituation")}
        error={!!formErrors.workSituation}
        helperText={formErrors.workSituation}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Motivo"
        value={formData.executionReport?.reason || ""}
        onChange={onInputChange("executionReport.reason")}
      />
    </Grid>

    <Grid item xs={12}>
      <FormControlLabel
        control={
          <Checkbox
            checked={formData.executionReport?.provisionalKeyInstalled || false}
            onChange={onInputChange("executionReport.provisionalKeyInstalled")}
          />
        }
        label="Chave Provisória Instalada?"
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Referência da Chave Provisória"
        value={formData.executionReport?.provisionalKeyReference || ""}
        onChange={onInputChange("executionReport.provisionalKeyReference")}
      />
    </Grid>

    <Grid item xs={12}>
      <FormControlLabel
        control={
          <Checkbox
            checked={formData.executionReport?.provisionalKeyWithdrawn || false}
            onChange={onInputChange("executionReport.provisionalKeyWithdrawn")}
          />
        }
        label="Chave Provisória Retirada?"
      />
    </Grid>
  </Grid>
);
