import { FormData } from "@/hooks/details/useOldScheduleForm";
import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import { ScheduleFormDialogProps } from "./dialog";
import { useEffect } from "react";

interface AdditionalInfoPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  options: ScheduleFormDialogProps["options"];
  onInputChange: (field: keyof FormData) => (event: any) => void;
  disabledFields: () => boolean | undefined;
  permission?: string;
}

const EXECUTION_RESPONSIBILITIES = ["", "Edp", "Parceira", "Terceiro"];

export function AdditionalInfoPanel({
  formData,
  formErrors,
  options,
  onInputChange,
  disabledFields,
  permission,
}: AdditionalInfoPanelProps) {
  const errorRestriction = formErrors.idExecutionRestriction;
  const errorResponsibility = formErrors.responsibility;
  const errorObservation = formErrors.executionObservation;

  const exec =
    formData.exec === "null" || formData.exec === null || formData.exec === ""
      ? null
      : Number(formData.exec);

  const selectedRestriction = options.restricao.find(
    (item) => item.id === formData.idExecutionRestriction,
  );

  const restrictionResponsibility =
    selectedRestriction?.responsabilidade ?? null;

  const restrictionIsDisabled =
    exec === null || (formData.prog != null && exec >= formData.prog);

  const responsibilityDisabled =
    Boolean(restrictionResponsibility) ||
    (restrictionIsDisabled && permission === "PARCEIRA");

  const responsibilityValue =
    restrictionResponsibility ?? formData.responsibility ?? "";

  useEffect(() => {
    if (!restrictionResponsibility) return;

    onInputChange("responsibility")({
      target: {
        value: restrictionResponsibility,
      },
    });
  }, [restrictionResponsibility, onInputChange]);

  return (
    <Grid container spacing={2}>
      {/* Técnico */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Técnico Responsável</InputLabel>

          <Select
            value={formData.idTechnical}
            onChange={onInputChange("idTechnical")}
            label="Técnico Responsável"
            disabled={disabledFields()}
          >
            {options.tecnico.map((tec) => (
              <MenuItem key={tec.id} value={tec.id}>
                {tec.tecnico}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Restrição */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errorRestriction}>
          <InputLabel>Restrição de Execução</InputLabel>

          <Select
            value={formData.idExecutionRestriction}
            onChange={onInputChange("idExecutionRestriction")}
            label="Restrição de Execução"
            disabled={restrictionIsDisabled && permission === "PARCEIRA"}
          >
            {options.restricao
              .filter((item) => item.tipo_restricao === "EXECUÇÃO")
              .map((restriction) => (
                <MenuItem key={restriction.id} value={restriction.id}>
                  {restriction.restricao}
                </MenuItem>
              ))}
          </Select>

          {errorRestriction && (
            <FormHelperText>{errorRestriction}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      {/* Responsabilidade */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errorResponsibility}>
          <InputLabel>Responsabilidade Execução</InputLabel>

          <Select
            value={responsibilityValue}
            onChange={onInputChange("responsibility")}
            label="Responsabilidade Execução"
            disabled={responsibilityDisabled}
          >
            {EXECUTION_RESPONSIBILITIES.map((responsibility) => (
              <MenuItem key={responsibility} value={responsibility}>
                {responsibility}
              </MenuItem>
            ))}
          </Select>

          {errorResponsibility && (
            <FormHelperText>{errorResponsibility}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      {/* Observação */}
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Observação da Execução"
          value={formData.executionObservation || ""}
          onChange={onInputChange("executionObservation")}
          disabled={restrictionIsDisabled && permission === "PARCEIRA"}
          error={!!errorObservation}
          helperText={errorObservation}
        />
      </Grid>
    </Grid>
  );
}
