"use client";

import { useEffect } from "react";
import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import type { D5FormData } from "@/hooks/d5Notes/useD5ScheduleForm";

interface AdditionalInfoPanelD5Props {
  formData: D5FormData;
  formErrors: Record<string, string>;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{
      id: number;
      restricao: string;
      tipo_restricao: string;
      responsabilidade: string;
    }>;
  };
  onInputChange: (field: keyof D5FormData) => (event: any) => void;
  disabled?: boolean;
}

const EXECUTION_RESPONSIBILITIES = ["", "Edp", "Parceira", "Terceiro"];

export function AdditionalInfoPanelD5({
  formData,
  formErrors,
  options,
  onInputChange,
  disabled = false,
}: AdditionalInfoPanelD5Props) {
  const selectedRestriction = options.restricao.find(
    (item) => item.id === Number(formData.restrictionId),
  );

  const restrictionResponsibility =
    selectedRestriction?.responsabilidade ?? null;

  // Quando a restrição define a responsabilidade, o campo fica travado
  const responsibilityDisabled = disabled || Boolean(restrictionResponsibility);
  const responsibilityValue =
    restrictionResponsibility ?? formData.restrictionResponsible ?? "";

  useEffect(() => {
    if (!restrictionResponsibility) return;
    if (formData.restrictionResponsible === restrictionResponsibility) return;

    onInputChange("restrictionResponsible")({
      target: { value: restrictionResponsibility },
    });
  }, [
    restrictionResponsibility,
    formData.restrictionResponsible,
    onInputChange,
  ]);

  return (
    <Grid container spacing={2}>
      {/* Técnico */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!formErrors.technicalId}>
          <InputLabel>Técnico Responsável</InputLabel>
          <Select
            value={formData.technicalId}
            onChange={onInputChange("technicalId")}
            label="Técnico Responsável"
            disabled={disabled}
          >
            <MenuItem value="">
              <em>Nenhum</em>
            </MenuItem>
            {options.tecnico.map((tec) => (
              <MenuItem key={tec.id} value={tec.id}>
                {tec.tecnico}
              </MenuItem>
            ))}
          </Select>
          {formErrors.technicalId && (
            <FormHelperText>{formErrors.technicalId}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      {/* Restrição de execução */}
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!formErrors.restrictionId}>
          <InputLabel>Restrição de Execução</InputLabel>
          <Select
            value={formData.restrictionId}
            onChange={onInputChange("restrictionId")}
            label="Restrição de Execução"
            disabled={disabled}
          >
            <MenuItem value="">
              <em>Nenhuma</em>
            </MenuItem>
            {options.restricao
              .filter((item) => item.tipo_restricao === "EXECUÇÃO")
              .map((restriction) => (
                <MenuItem key={restriction.id} value={restriction.id}>
                  {restriction.restricao}
                </MenuItem>
              ))}
          </Select>
          {formErrors.restrictionId && (
            <FormHelperText>{formErrors.restrictionId}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      {/* Responsável pela restrição */}
      <Grid item xs={12}>
        <FormControl fullWidth error={!!formErrors.restrictionResponsible}>
          <InputLabel>Responsabilidade Execução</InputLabel>
          <Select
            value={responsibilityValue}
            onChange={onInputChange("restrictionResponsible")}
            label="Responsabilidade Execução"
            disabled={responsibilityDisabled}
          >
            {EXECUTION_RESPONSIBILITIES.map((responsibility) => (
              <MenuItem key={responsibility} value={responsibility}>
                {responsibility || <em>Nenhum</em>}
              </MenuItem>
            ))}
          </Select>
          {formErrors.restrictionResponsible && (
            <FormHelperText>{formErrors.restrictionResponsible}</FormHelperText>
          )}
        </FormControl>
      </Grid>
    </Grid>
  );
}
