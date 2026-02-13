import {
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  FormLabel,
  FormControl,
  FormHelperText,
  Radio,
  RadioGroup,
} from "@mui/material";
import { ExecutionReportData } from "./executionReportDialog";

interface AdditionalExecutionInfoPanelProps {
  formData: ExecutionReportData;
  formErrors: Record<string, string>;
  handleExecutionReportChange: (
    field: keyof ExecutionReportData,
  ) => (event: any) => void;
}

export const AdditionalExecutionInfoPanel: React.FC<
  AdditionalExecutionInfoPanelProps
> = ({ formData, formErrors, handleExecutionReportChange }) => {
  const errorProvisionalKeyWithdrawn = formErrors["provisionalKeyWithdrawn"];

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Observação Geral"
          value={formData.generalObservation}
          onChange={handleExecutionReportChange("generalObservation")}
          multiline
          minRows={2}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Motivo"
          value={formData.reason || ""}
          onChange={handleExecutionReportChange("reason")}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.provisionalKeyInstalled || false}
              onChange={handleExecutionReportChange("provisionalKeyInstalled")}
            />
          }
          label="Chave Provisória Instalada?"
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Referência da Chave Provisória - Exemplo: 175ET00554845"
          value={formData.provisionalKeyReference || ""}
          onChange={handleExecutionReportChange("provisionalKeyReference")}
          autoComplete="off"
        />
      </Grid>

      <Grid item xs={12}>
        <FormControl error={!!errorProvisionalKeyWithdrawn}>
          <FormLabel>Chave Provisória Retirada?</FormLabel>
          <RadioGroup
            row
            value={
              formData.provisionalKeyWithdrawn === true
                ? "true"
                : formData.provisionalKeyWithdrawn === false
                  ? "false"
                  : ""
            }
            onChange={(event) =>
              handleExecutionReportChange("provisionalKeyWithdrawn")({
                target: { type: "radio", value: event.target.value === "true" },
              } as unknown as React.ChangeEvent<HTMLInputElement>)
            }
          >
            <FormControlLabel value="true" control={<Radio />} label="Sim" />
            <FormControlLabel value="false" control={<Radio />} label="Não" />
          </RadioGroup>
          {errorProvisionalKeyWithdrawn && (
            <FormHelperText>{errorProvisionalKeyWithdrawn}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Referência da Chave Provisória - Exemplo: 175ET00554845"
          value={formData.provisionalKeyReferenceWithdrawn || ""}
          onChange={handleExecutionReportChange(
            "provisionalKeyReferenceWithdrawn",
          )}
          autoComplete="off"
        />
      </Grid>
    </Grid>
  );
};
