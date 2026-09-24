"use client";

import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import type { D5FormData } from "@/hooks/d5Notes/useD5ScheduleForm";

interface ServiceEquipmentPanelD5Props {
  formData: D5FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: keyof D5FormData) => (event: any) => void;
  disabled?: boolean;
}

const SERVICE_TYPES = [
  "LV",
  "DP",
  "Obra livre",
  "DP + LV",
  "LV + Obra livre",
  "Regularização",
  "Desativação RD",
];

export const ServiceEquipmentPanelD5: React.FC<
  ServiceEquipmentPanelD5Props
> = ({ formData, formErrors, onInputChange, disabled = false }) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth error={!!formErrors.serviceType}>
        <InputLabel>Tipo de Serviço</InputLabel>
        <Select
          value={formData.serviceType}
          onChange={onInputChange("serviceType")}
          label="Tipo de Serviço"
          disabled={disabled}
        >
          <MenuItem value="">
            <em>Nenhum</em>
          </MenuItem>
          {SERVICE_TYPES.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Número DP"
        value={formData.numDp}
        onChange={onInputChange("numDp")}
        error={!!formErrors.numDp}
        helperText={formErrors.numDp}
        inputProps={{ maxLength: 25 }}
        disabled={disabled}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="CHI"
        type="number"
        value={formData.chi}
        onChange={onInputChange("chi")}
        error={!!formErrors.chi}
        helperText={formErrors.chi}
        inputProps={{ min: 0 }}
        disabled={disabled}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <FormControlLabel
        control={
          <Checkbox
            checked={!!formData.temporaryKey}
            onChange={onInputChange("temporaryKey")}
            disabled={disabled}
          />
        }
        label="Chave provisória"
      />
    </Grid>
  </Grid>
);
