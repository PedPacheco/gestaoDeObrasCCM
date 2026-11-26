import { FormData } from "@/hooks/details/useOldScheduleForm";
import {
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  FormLabel,
  Box,
  FormControl,
  FormHelperText,
  Radio,
  RadioGroup,
} from "@mui/material";
import { OldExecutionReportData } from "./oldExecutionReportDialog";
import { resolveExecutionReportContext } from "@/utils/formatValue";

interface AdditionalExecutionInfoPanelProps {
  formData: FormData | OldExecutionReportData;
  formErrors: Record<string, string>;
  onInputChange: (
    field:
      | keyof FormData
      | `executionReport.${keyof OldExecutionReportData}`
      | keyof OldExecutionReportData,
  ) => (event: any) => void;
}

export const AdditionalExecutionInfoPanel: React.FC<
  AdditionalExecutionInfoPanelProps
> = ({ formData, formErrors, onInputChange }) => {
  const { data, prefix } = resolveExecutionReportContext(formData);
  const errorProvisionalKeyWithdrawn = formErrors["provisionalKeyWithdrawn"];

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
        <FormControl error={!!errorProvisionalKeyWithdrawn}>
          <FormLabel>Chave Provisória Retirada?</FormLabel>
          <RadioGroup
            row
            value={
              data.provisionalKeyWithdrawn === true
                ? "true"
                : data.provisionalKeyWithdrawn === false
                  ? "false"
                  : ""
            }
            onChange={(event) =>
              onInputChange(`${prefix}provisionalKeyWithdrawn`)({
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
          value={data.provisionalKeyReferenceWithdrawn || ""}
          onChange={onInputChange(`${prefix}provisionalKeyReferenceWithdrawn`)}
          autoComplete="off"
        />
      </Grid>
    </Grid>
  );
};
