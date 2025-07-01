import { FormData } from "@/hooks/useSchedule";
import { FormControl, Grid, InputLabel, MenuItem, Select } from "@mui/material";

import { ScheduleFormDialogProps } from "./dialog";

interface AdditionalInfoPanelProps {
  formData: FormData;
  options: ScheduleFormDialogProps["options"];
  onInputChange: (field: keyof FormData) => (event: any) => void;
}

const EXECUTION_RESPONSIBILITIES = ["Edp", "Parceira", "Terceiro"];

export const AdditionalInfoPanel: React.FC<AdditionalInfoPanelProps> = ({
  formData,
  options,
  onInputChange,
}) => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Técnico Responsável</InputLabel>
        <Select
          value={formData.idTechnical}
          onChange={onInputChange("idTechnical")}
          label="Técnico Responsável"
        >
          {options.tecnico.map((tec) => (
            <MenuItem key={tec.id} value={tec.id}>
              {tec.tecnico}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Restrição de Execução</InputLabel>
        <Select
          value={formData.idExecutionRestriction}
          onChange={onInputChange("idExecutionRestriction")}
          label="Restrição de Execução"
        >
          {options.restricao.map((restriction) => (
            <MenuItem key={restriction.id} value={restriction.id}>
              {restriction.restricao}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>

    <Grid item xs={12} sm={6}>
      <FormControl fullWidth>
        <InputLabel>Responsabilidade Execução</InputLabel>
        <Select
          value={formData.responsibility}
          onChange={onInputChange("responsibility")}
          label="Responsabilidade Execução"
        >
          {EXECUTION_RESPONSIBILITIES.map((responsibility) => (
            <MenuItem key={responsibility} value={responsibility}>
              {responsibility}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Grid>
  </Grid>
);
