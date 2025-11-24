import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { ScheduleCard } from "./scheduleCard";
import { FormData } from "@/hooks/useScheduleForm";

interface EquipmentCardProps {
  formData: FormData;
  disabledFields: () => boolean | undefined;
  onInputChange: (field: keyof FormData) => (event: any) => void;
  isInsert: boolean;
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

export function EquipmentCard({
  formData,
  disabledFields,
  isInsert,
  onInputChange,
}: EquipmentCardProps) {
  return (
    <Grid item xs={12} md={6} lg={!isInsert ? 4 : 6}>
      <ScheduleCard title="Serviço e Equipamentos">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Serviço</InputLabel>
              <Select
                value={formData.serviceType}
                label="Tipo de Serviço"
                disabled={disabledFields()}
                onChange={onInputChange("serviceType")}
              >
                {SERVICE_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Equipamento"
              value={formData.equipment}
              fullWidth
              disabled={disabledFields()}
              onChange={onInputChange("equipment")}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="CHI"
              type="number"
              value={formData.chi}
              inputProps={{ min: 0 }}
              fullWidth
              disabled={disabledFields()}
              onChange={onInputChange("chi")}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Número DP"
              value={formData.numDp}
              fullWidth
              disabled={disabledFields()}
              onChange={onInputChange("numDp")}
            />
          </Grid>
        </Grid>
      </ScheduleCard>
    </Grid>
  );
}
