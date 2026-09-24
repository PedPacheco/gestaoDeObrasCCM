"use client";

import { Grid, TextField } from "@mui/material";
import type { D5FormData } from "@/hooks/d5Notes/useD5ScheduleForm";

interface BasicInfoPanelD5Props {
  formData: D5FormData;
  formErrors: Record<string, string>;
  isInsert: boolean;
  onInputChange: (field: keyof D5FormData) => (event: any) => void;
  onExecChange: (value: string | number) => void;
  disabled?: boolean;
}

export const BasicInfoPanelD5: React.FC<BasicInfoPanelD5Props> = ({
  formData,
  formErrors,
  isInsert,
  onInputChange,
  onExecChange,
  disabled = false,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          required
          label="Data da Programação"
          type="date"
          value={formData.scheduledDate}
          onChange={onInputChange("scheduledDate")}
          error={!!formErrors.scheduledDate}
          helperText={formErrors.scheduledDate}
          InputLabelProps={{ shrink: true }}
          disabled={disabled}
        />
      </Grid>

      {/* Horários opcionais no D5 — sem required */}
      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          label="Horário Início"
          type="time"
          value={formData.startTime}
          onChange={onInputChange("startTime")}
          error={!!formErrors.startTime}
          helperText={formErrors.startTime}
          InputLabelProps={{ shrink: true }}
          disabled={disabled}
        />
      </Grid>

      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          label="Horário Fim"
          type="time"
          value={formData.endTime}
          onChange={onInputChange("endTime")}
          error={!!formErrors.endTime}
          helperText={formErrors.endTime}
          InputLabelProps={{ shrink: true }}
          autoComplete="off"
          disabled={disabled}
        />
      </Grid>

      <Grid item xs={12} sm={isInsert ? 12 : 6}>
        <TextField
          fullWidth
          required
          label="Progresso Programado"
          type="number"
          value={formData.prog}
          onChange={onInputChange("prog")}
          error={!!formErrors.prog}
          helperText={formErrors.prog}
          InputLabelProps={{ shrink: true }}
          inputProps={{ min: 0, max: 100 }}
          disabled={disabled}
        />
      </Grid>

      {!isInsert && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Progresso Executado"
            type="number"
            value={formData.exec !== "null" ? String(formData.exec) : "-"}
            onChange={(event) => onExecChange(event.target.value)}
            error={!!formErrors.exec}
            helperText={formErrors.exec}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: 0, max: 100 }}
            disabled={disabled}
          />
        </Grid>
      )}

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Observação da Programação"
          value={formData.observation}
          onChange={onInputChange("observation")}
          error={!!formErrors.observation}
          helperText={formErrors.observation}
          InputLabelProps={{ shrink: true }}
          disabled={disabled}
        />
      </Grid>

      <Grid item xs={12}>
        <TextField
          fullWidth
          multiline
          rows={2}
          label="Observação da Execução"
          value={formData.executionObservation}
          onChange={onInputChange("executionObservation")}
          error={!!formErrors.executionObservation}
          helperText={formErrors.executionObservation}
          InputLabelProps={{ shrink: true }}
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
};
