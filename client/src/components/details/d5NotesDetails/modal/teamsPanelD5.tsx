"use client";

import type { D5FormData } from "@/hooks/d5Notes/useD5ScheduleForm";
import {
  Checkbox,
  FormControlLabel,
  FormHelperText,
  Grid,
  TextField,
} from "@mui/material";

interface TeamsPanelD5Props {
  formData: D5FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: keyof D5FormData) => (event: any) => void;
  onFiscalizationChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const TEAM_FIELDS = [
  { field: "lmTeam" as const, label: "Equipe LM" },
  { field: "regulTeam" as const, label: "Equipe Regular" },
  { field: "lvTeam" as const, label: "Equipe LV" },
];

export const TeamsPanelD5: React.FC<TeamsPanelD5Props> = ({
  formData,
  formErrors,
  onInputChange,
  onFiscalizationChange,
  disabled = false,
}) => {
  const isFiscalizationOnly = Boolean(formData.fiscalization);

  return (
    <Grid container spacing={2}>
      {TEAM_FIELDS.map(({ field, label }) => (
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
            disabled={disabled || isFiscalizationOnly}
          />
        </Grid>
      ))}

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={isFiscalizationOnly}
              onChange={onFiscalizationChange}
              disabled={disabled}
            />
          }
          label="Pendência Documental (Caso selecionado, não necessário envio de equipes)"
        />
        {formErrors.fiscalization && (
          <FormHelperText error>{formErrors.fiscalization}</FormHelperText>
        )}
      </Grid>
    </Grid>
  );
};
