import { FormData } from "@/hooks/useScheduleForm";
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

interface ServiceEquipmentPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (field: keyof FormData) => (event: any) => void;
  disabledFields: () => boolean | undefined;
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

export const ServiceEquipmentPanel: React.FC<ServiceEquipmentPanelProps> = ({
  formData,
  formErrors,
  onInputChange,
  disabledFields,
}) => (
  <Grid container spacing={3}>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Tipo de Serviço</InputLabel>
        <Select
          value={formData.serviceType}
          onChange={onInputChange("serviceType")}
          label="Tipo de Serviço"
          disabled={disabledFields()}
        >
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
        label="Equipamento a ser desligado"
        value={formData.equipment}
        onChange={onInputChange("equipment")}
        disabled={disabledFields()}
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
        disabled={disabledFields()}
      />
    </Grid>

    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Número DP"
        value={formData.numDp}
        onChange={onInputChange("numDp")}
        disabled={disabledFields()}
      />
    </Grid>
  </Grid>
);
