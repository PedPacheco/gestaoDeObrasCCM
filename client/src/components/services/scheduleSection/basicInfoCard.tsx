import { Grid, TextField } from "@mui/material";
import { ScheduleCard } from "./scheduleCard";
import { FormData } from "@/hooks/details/useScheduleForm";

interface BasicInfoCardProps {
  formData: FormData;
  onInputChange: (field: keyof FormData) => (event: any) => void;
  disabledFields: () => boolean | undefined;
}

export function BasicInfoCard({
  formData,
  disabledFields,
  onInputChange,
}: BasicInfoCardProps) {
  return (
    <Grid item xs={12} md={6} lg={4}>
      <ScheduleCard title="Informações Básicas">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Data da Programação"
              type="date"
              value={formData.dataProg}
              onChange={onInputChange("dataProg")}
              InputLabelProps={{ shrink: true }}
              required
              disabled={disabledFields()}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Horário Início"
              type="time"
              value={formData.startTime}
              onChange={onInputChange("startTime")}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={disabledFields()}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Horário Fim"
              type="time"
              value={formData.finishTime}
              onChange={onInputChange("finishTime")}
              fullWidth
              InputLabelProps={{ shrink: true }}
              disabled={disabledFields()}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Observação da Programação"
              value={formData.observation}
              onChange={onInputChange("observation")}
              multiline
              rows={4}
              fullWidth
              disabled={disabledFields()}
            />
          </Grid>
        </Grid>
      </ScheduleCard>
    </Grid>
  );
}
