import { FormData } from "@/hooks/useScheduleForm";
import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";

import { ScheduleFormDialogProps } from "./dialog";

interface AdditionalInfoPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  options: ScheduleFormDialogProps["options"];
  onInputChange: (field: keyof FormData) => (event: any) => void;
  disabledFields: () => boolean | undefined;
}

const EXECUTION_RESPONSIBILITIES = ["", "Edp", "Parceira", "Terceiro"];

export const AdditionalInfoPanel: React.FC<AdditionalInfoPanelProps> = ({
  formData,
  formErrors,
  options,
  onInputChange,
  disabledFields,
}) => {
  const errorRestriction = formErrors["idExecutionRestriction"];
  const errorResponsibility = formErrors["responsibility"];

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth>
          <InputLabel>Técnico Responsável</InputLabel>
          <Select
            value={formData.idTechnical}
            onChange={onInputChange("idTechnical")}
            label="Técnico Responsável"
            disabled={disabledFields()}
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
        <FormControl fullWidth error={!!errorRestriction}>
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
          {formErrors["idExecutionRestriction"] && (
            <FormHelperText>
              {formErrors["idExecutionRestriction"]}
            </FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errorResponsibility}>
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
          {formErrors["responsibility"] && (
            <FormHelperText>{formErrors["responsibility"]}</FormHelperText>
          )}
        </FormControl>
      </Grid>
    </Grid>
  );
};
