import { z } from "zod";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";

import { ButtonComponent } from "@/components/common/Button";
import { FormData } from "@/hooks/useScheduleForm";
import { resolveExecutionReportContext } from "@/utils/formatValue";
import { equipmentItemSchema } from "@/validations/validationSchedules";
import { ExecutionReportData } from "./executionReportDialog";

export type EquipmentData = z.infer<typeof equipmentItemSchema>;

const EQUIPMENTS = [
  "Banco capacitor",
  "Transformador",
  "Religador",
  "Regulador de tensão",
] as const;

const POWER_OPTIONS: Record<string, number[]> = {
  "Banco capacitor": [50, 100, 200, 500, 700, 1000],
  Transformador: [100, 500, 1000],
  Religador: [0],
  "Regulador de tensão": [10, 50, 100],
};

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

const EquipmentList = ({
  items,
  fieldKey,
  prefix,
  onEquipmentChange,
  onRemoveEquipment,
  formErrors,
}: {
  items: EquipmentData[];
  fieldKey: "appliedEquipment" | "equipmentRemoved";
  prefix: string;
  onEquipmentChange: ExecutionEquipmentPanelProps["onEquipmentChange"];
  onRemoveEquipment: ExecutionEquipmentPanelProps["onRemoveEquipment"];
  formErrors: Record<string, string>;
}) => {
  return (
    <>
      {items.map((eq, index) => {
        const equipmentError = formErrors[`${fieldKey}.${index}.equipment`];
        const powerError = formErrors[`${fieldKey}.${index}.power`];
        const patrimonyError = formErrors[`${fieldKey}.${index}.patrimony`];

        return (
          <Grid container spacing={2} key={index} sx={{ margin: 1 }}>
            <Grid item xs={3}>
              <FormControl fullWidth error={!!equipmentError}>
                <InputLabel>Equipamento</InputLabel>
                <Select
                  value={eq.equipment}
                  label="Equipamento"
                  onChange={(e) =>
                    onEquipmentChange(
                      fieldKey,
                      index,
                      "equipment",
                      e.target.value,
                      prefix
                    )
                  }
                >
                  {EQUIPMENTS.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {equipmentError && (
                  <FormHelperText>{equipmentError}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <FormControl fullWidth error={!!powerError}>
                <InputLabel>Potência</InputLabel>
                <Select
                  value={eq.power}
                  label="Potência"
                  onChange={(e) =>
                    onEquipmentChange(
                      fieldKey,
                      index,
                      "power",
                      e.target.value,
                      prefix
                    )
                  }
                >
                  {(POWER_OPTIONS[eq.equipment] || []).map((power) => (
                    <MenuItem key={power} value={power}>
                      {power}
                    </MenuItem>
                  ))}
                </Select>
                {powerError && <FormHelperText>{powerError}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                label="Patrimônio"
                value={eq.patrimony}
                onChange={(e) =>
                  onEquipmentChange(
                    fieldKey,
                    index,
                    "patrimony",
                    e.target.value,
                    prefix
                  )
                }
                error={!!patrimonyError}
                helperText={patrimonyError}
              />
            </Grid>
            <Grid item xs={3}>
              <ButtonComponent
                onClick={() => onRemoveEquipment(fieldKey, index, prefix)}
                text={`Remover equipamento ${
                  fieldKey === "appliedEquipment" ? "aplicado" : "removido"
                }`}
                styled="mt-2"
              />
            </Grid>
          </Grid>
        );
      })}
    </>
  );
};

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

  const renderCheckboxGroup = (
    label: string,
    stateKey: keyof ExecutionReportData,
    errorKey: string
  ) => {
    const errorMessage = formErrors[errorKey];
    return (
      <Grid item xs={12}>
        <FormControl fullWidth error={!!errorMessage}>
          <Typography className="text-lg">{label}</Typography>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={data[stateKey] === true}
                  onChange={() =>
                    onInputChange(`${prefix}${stateKey}`)({
                      target: { value: true },
                    })
                  }
                />
              }
              label="Sim"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={data[stateKey] === false}
                  onChange={() =>
                    onInputChange(`${prefix}${stateKey}`)({
                      target: { value: false },
                    })
                  }
                />
              }
              label="Não"
            />
          </FormGroup>
          {errorMessage && <FormHelperText>{errorMessage}</FormHelperText>}
        </FormControl>
      </Grid>
    );
  };

  return (
    <Grid container spacing={3}>
      {renderCheckboxGroup(
        "Possui equipamentos aplicados?",
        "hasEquipmentInstalled",
        "appliedEquipment"
      )}

      {data.hasEquipmentInstalled && (
        <>
          <EquipmentList
            items={data.appliedEquipment}
            fieldKey="appliedEquipment"
            prefix={prefix}
            onEquipmentChange={onEquipmentChange}
            onRemoveEquipment={onRemoveEquipment}
            formErrors={formErrors}
          />
          <Grid item xs={12}>
            <ButtonComponent
              onClick={() => onAddEquipment("appliedEquipment", prefix)}
              text="Adicionar equipamento aplicado"
            />
          </Grid>
        </>
      )}

      {renderCheckboxGroup(
        "Possui equipamentos removidos?",
        "hasEquipmentRemoved",
        "equipmentRemoved"
      )}

      {data.hasEquipmentRemoved && (
        <>
          <EquipmentList
            items={data.equipmentRemoved}
            fieldKey="equipmentRemoved"
            prefix={prefix}
            onEquipmentChange={onEquipmentChange}
            onRemoveEquipment={onRemoveEquipment}
            formErrors={formErrors}
          />
          <Grid item xs={12}>
            <ButtonComponent
              onClick={() => onAddEquipment("equipmentRemoved", prefix)}
              text="Adicionar equipamento removido"
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};
