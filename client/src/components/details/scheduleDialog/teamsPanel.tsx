import { FormData } from "@/hooks/useSchedule";
import { Grid, TextField } from "@mui/material";

interface TeamsPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: keyof FormData) => (event: any) => void;
}

export const TeamsPanel: React.FC<TeamsPanelProps> = ({
  formData,
  formErrors,
  onInputChange,
}) => (
  <Grid container spacing={2}>
    {[
      { field: "lmTeam" as const, label: "Equipe LM" },
      { field: "regulTeam" as const, label: "Equipe Regular" },
      { field: "lvTeam" as const, label: "Equipe LV" },
    ].map(({ field, label }) => (
      <Grid item xs={12} sm={4} key={field}>
        <TextField
          fullWidth
          label={label}
          type="number"
          value={formData[field]}
          error={!!formErrors[field]}
          helperText={formErrors[field]}
          onChange={onInputChange(field)}
          inputProps={{ min: 0 }}
        />
      </Grid>
    ))}
  </Grid>
);
