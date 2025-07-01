import { FormData } from "@/hooks/useSchedule";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { ExecutionReportData } from "./executionReportDialog";
import { equipmentItemSchema } from "@/validations/validationSchedules";
import { z } from "zod";
import { ButtonComponent } from "@/components/common/Button";

export type EquipmentData = z.infer<typeof equipmentItemSchema>;

interface ExecutionEquipmentPanelProps {
  formData: FormData;
  formErrors: Record<string, string>;
  onInputChange: (
    field: keyof FormData | `executionReport.${keyof ExecutionReportData}`
  ) => (event: any) => void;
  onEquipmentChange: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    subField: keyof EquipmentData,
    value: string
  ) => void;
  onAddEquipment: (field: "appliedEquipment" | "equipmentRemoved") => void;
  onRemoveEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number
  ) => void;
}

export const ExecutionEquipmentPanel: React.FC<
  ExecutionEquipmentPanelProps
> = ({
  formData,
  formErrors,
  onInputChange,
  onAddEquipment,
  onEquipmentChange,
  onRemoveEquipment,
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.executionReport?.hasEquipmentInstalled ?? false}
              onChange={onInputChange("executionReport.hasEquipmentInstalled")}
            />
          }
          label="Possui equipamentos aplicados"
        />
      </Grid>

      {formData.executionReport?.hasEquipmentInstalled && (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Equipamentos Aplicados</Typography>
          </Grid>
          {formData.executionReport.appliedEquipment.map((eq, index) => (
            <Grid
              container
              spacing={2}
              key={index}
              sx={{ marginBottom: 1, marginLeft: 1 }}
            >
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Equipamento"
                  value={eq.equipment}
                  error={!!formErrors.equipment}
                  onChange={(e) =>
                    onEquipmentChange(
                      "appliedEquipment",
                      index,
                      "equipment",
                      e.target.value
                    )
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Potência"
                  value={eq.power}
                  onChange={(e) =>
                    onEquipmentChange(
                      "appliedEquipment",
                      index,
                      "power",
                      e.target.value
                    )
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Patrimônio"
                  value={eq.patrimony}
                  onChange={(e) =>
                    onEquipmentChange(
                      "appliedEquipment",
                      index,
                      "patrimony",
                      e.target.value
                    )
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <ButtonComponent
                  onClick={() => onRemoveEquipment("appliedEquipment", index)}
                  text="Retirar equipamento aplicado"
                  styled="mt-2"
                />
              </Grid>
            </Grid>
          ))}
          <Grid item xs={12}>
            <ButtonComponent
              onClick={() => onAddEquipment("appliedEquipment")}
              text="Adicionar equipamento aplicado"
            />
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={formData.executionReport?.hasEquipmentRemoved ?? false}
              onChange={onInputChange("executionReport.hasEquipmentRemoved")}
            />
          }
          label="Possui equipamentos retirados"
        />
      </Grid>

      {formData.executionReport?.hasEquipmentRemoved && (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Equipamentos Retirados</Typography>
          </Grid>
          {formData.executionReport.equipmentRemoved.map((eq, index) => (
            <Grid
              container
              spacing={2}
              key={index}
              sx={{ marginBottom: 1, marginLeft: 1 }}
            >
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Equipamento"
                  value={eq.equipment}
                  onChange={(e) =>
                    onEquipmentChange(
                      "equipmentRemoved",
                      index,
                      "equipment",
                      e.target.value
                    )
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Potência"
                  value={eq.power}
                  onChange={(e) =>
                    onEquipmentChange(
                      "equipmentRemoved",
                      index,
                      "power",
                      e.target.value
                    )
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <TextField
                  fullWidth
                  label="Patrimônio"
                  value={eq.patrimony}
                  onChange={(e) =>
                    onEquipmentChange(
                      "equipmentRemoved",
                      index,
                      "patrimony",
                      e.target.value
                    )
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <ButtonComponent
                  onClick={() => onRemoveEquipment("equipmentRemoved", index)}
                  text="Retirar equipamento removido"
                  styled="mt-2"
                />
              </Grid>
            </Grid>
          ))}
          <Grid item xs={12}>
            <ButtonComponent
              onClick={() => onAddEquipment("equipmentRemoved")}
              text="Adicionar Equipamento Retirado"
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};
