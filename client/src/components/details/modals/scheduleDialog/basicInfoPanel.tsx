"use client";

import { FormData } from "@/hooks/details/useScheduleForm";
import { Grid, TextField } from "@mui/material";
import dayjs from "dayjs";

interface BasicInfoPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  isInsert: boolean;
  onInputChange: (field: keyof FormData) => (event: any) => void;
  disabledFields: () => boolean | undefined;
}

export const BasicInfoPanel: React.FC<BasicInfoPanelProps> = ({
  formData,
  formErrors,
  isInsert,
  onInputChange,
  disabledFields,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Data da Programação"
          type="date"
          value={formData.dataProg}
          onChange={onInputChange("dataProg")}
          error={!!formErrors.dataProg}
          helperText={formErrors.dataProg}
          InputLabelProps={{ shrink: true }}
          required
          disabled={disabledFields()}
        />
      </Grid>

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
          required
          disabled={disabledFields()}
        />
      </Grid>

      <Grid item xs={12} sm={3}>
        <TextField
          fullWidth
          label="Horário Fim"
          type="time"
          value={formData.finishTime}
          onChange={onInputChange("finishTime")}
          error={!!formErrors.finishTime}
          helperText={formErrors.finishTime}
          InputLabelProps={{ shrink: true }}
          required
          autoComplete="off"
          disabled={disabledFields()}
        />
      </Grid>

      <Grid item xs={12} sm={!isInsert && formData.exec !== undefined ? 6 : 12}>
        <TextField
          fullWidth
          label="Progresso Programado:"
          type="number"
          value={formData.prog}
          onChange={onInputChange("prog")}
          error={!!formErrors.prog}
          helperText={formErrors.prog}
          InputLabelProps={{ shrink: true }}
          disabled={disabledFields()}
        />
      </Grid>

      {!isInsert && (
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Progresso Executado:"
            type="string"
            value={formData.exec !== "null" ? String(formData.exec) : ""}
            onChange={onInputChange("exec")}
            error={!!formErrors.exec}
            helperText={formErrors.exec}
            InputLabelProps={{ shrink: true }}
            disabled={dayjs().isBefore(dayjs(formData.dataProg))}
          />
        </Grid>
      )}
      <Grid item xs={12} sm={12}>
        <TextField
          fullWidth
          label="Observação da Programação"
          type="string"
          value={formData.observation}
          onChange={onInputChange("observation")}
          error={!!formErrors.observation}
          helperText={formErrors.observation}
          InputLabelProps={{ shrink: true }}
          disabled={disabledFields()}
        />
      </Grid>
    </Grid>
  );
};
