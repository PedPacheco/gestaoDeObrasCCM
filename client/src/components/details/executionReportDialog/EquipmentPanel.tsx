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
import { resolveExecutionReportContext } from "@/utils/formatValue";

export type EquipmentData = z.infer<typeof equipmentItemSchema>;

interface ExecutionEquipmentPanelProps {
  formData: FormData | ExecutionReportData;
  formErrors: Record<string, string>;
  onInputChange: (
    field:
      | keyof FormData
      | `executionReport.${keyof ExecutionReportData}`
      | keyof ExecutionReportData
  ) => (event: any) => void;
  onEquipmentChange: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    subField: keyof EquipmentData,
    value: string,
    prefix: string
  ) => void;
  onAddEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    prefix: string
  ) => void;
  onRemoveEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    prefix: string
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
  const { data, prefix } = resolveExecutionReportContext(formData);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={data.hasEquipmentInstalled ?? false}
              onChange={onInputChange(`${prefix}hasEquipmentInstalled`)}
            />
          }
          label="Possui equipamentos aplicados"
        />
      </Grid>

      {data.hasEquipmentInstalled && (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Equipamentos Aplicados</Typography>
          </Grid>
          {data.appliedEquipment.map((eq, index) => (
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
                      e.target.value,
                      prefix
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
                      e.target.value,
                      prefix
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
                      e.target.value,
                      prefix
                    )
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <ButtonComponent
                  onClick={() =>
                    onRemoveEquipment("appliedEquipment", index, prefix)
                  }
                  text="Retirar equipamento aplicado"
                  styled="mt-2"
                />
              </Grid>
            </Grid>
          ))}
          <Grid item xs={12}>
            <ButtonComponent
              onClick={() => onAddEquipment("appliedEquipment", prefix)}
              text="Adicionar equipamento aplicado"
            />
          </Grid>
        </>
      )}

      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={data.hasEquipmentRemoved ?? false}
              onChange={onInputChange(`${prefix}hasEquipmentRemoved`)}
            />
          }
          label="Possui equipamentos retirados"
        />
      </Grid>

      {data.hasEquipmentRemoved && (
        <>
          <Grid item xs={12}>
            <Typography variant="subtitle1">Equipamentos Retirados</Typography>
          </Grid>
          {data.equipmentRemoved.map((eq, index) => (
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
                      e.target.value,
                      prefix
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
                      e.target.value,
                      prefix
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
                      e.target.value,
                      prefix
                    )
                  }
                />
              </Grid>
              <Grid item xs={3}>
                <ButtonComponent
                  onClick={() =>
                    onRemoveEquipment("equipmentRemoved", index, prefix)
                  }
                  text="Retirar equipamento removido"
                  styled="mt-2"
                />
              </Grid>
            </Grid>
          ))}
          <Grid item xs={12}>
            <ButtonComponent
              onClick={() => onAddEquipment("equipmentRemoved", prefix)}
              text="Adicionar Equipamento Retirado"
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};
