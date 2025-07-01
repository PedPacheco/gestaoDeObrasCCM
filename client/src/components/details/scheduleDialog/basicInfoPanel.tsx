import { FormData } from "@/hooks/useSchedule";
import { Grid, TextField } from "@mui/material";

interface BasicInfoPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  isInsert: boolean;
  onInputChange: (field: keyof FormData) => (event: any) => void;
}

export const BasicInfoPanel: React.FC<BasicInfoPanelProps> = ({
  formData,
  formErrors,
  isInsert,
  onInputChange,
}) => (
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
      />
    </Grid>

    {!isInsert && (
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="Progresso Executado:"
          type="string"
          value={formData.exec || ""}
          onChange={onInputChange("exec")}
          error={!!formErrors.exec}
          helperText={formErrors.exec}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    )}
  </Grid>
);
