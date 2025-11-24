import { FormControl, Grid, InputLabel, MenuItem, Select } from "@mui/material";
import { ScheduleCard } from "./scheduleCard";
import { FormData } from "@/hooks/useScheduleForm";

interface RestrictionsCardProps {
  formData: FormData;
  options: {
    tecnico: Array<{ id: number; tecnico: string }>;
    restricao: Array<{ id: number; restricao: string }>;
  };
  disabledFields: () => boolean | undefined;
  onInputChange: (field: keyof FormData) => (event: any) => void;
}

export function RestrictionsCard({
  formData,
  options,
  disabledFields,
  onInputChange,
}: RestrictionsCardProps) {
  const EXECUTION_RESPONSIBILITIES = ["", "Edp", "Parceira", "Terceiro"];

  return (
    <Grid item xs={12} md={12} lg={4}>
      <ScheduleCard title="Responsáveis e Restrições">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Técnico Responsável</InputLabel>
              <Select
                value={formData.idTechnical}
                label="Técnico Responsável"
                disabled={disabledFields()}
                onChange={onInputChange("idTechnical")}
              >
                {options.tecnico.map((tec) => (
                  <MenuItem key={tec.id} value={tec.id}>
                    {tec.tecnico}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Restrição de Execução</InputLabel>
              <Select
                value={formData.idExecutionRestriction}
                label="Restrição de Execução"
                disabled={disabledFields()}
                onChange={onInputChange("idExecutionRestriction")}
              >
                {options.restricao.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.restricao}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Responsabilidade</InputLabel>
              <Select
                value={formData.responsibility}
                label="Responsabilidade"
                disabled={disabledFields()}
                onChange={onInputChange("responsibility")}
              >
                {EXECUTION_RESPONSIBILITIES.map((resp) => (
                  <MenuItem key={resp} value={resp}>
                    {resp}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </ScheduleCard>
    </Grid>
  );
}
