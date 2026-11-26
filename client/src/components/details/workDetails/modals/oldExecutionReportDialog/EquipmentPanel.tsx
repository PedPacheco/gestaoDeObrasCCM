import { z } from "zod";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Grid,
  Typography,
} from "@mui/material";

import { ButtonComponent } from "@/components/common/Button";
import { FormData } from "@/hooks/details/useOldScheduleForm";
import { resolveExecutionReportContext } from "@/utils/formatValue";
import { OldExecutionReportData } from "./oldExecutionReportDialog";
import { EquipmentList } from "./equipmentList";
import { OldEquipmentItemSchema } from "@/validations/oldValidationSchedules";

export type EquipmentData = z.infer<typeof OldEquipmentItemSchema>;

interface ExecutionEquipmentPanelProps {
  formData: FormData | OldExecutionReportData;
  formErrors: Record<string, string>;
  onInputChange: (
    field:
      | keyof FormData
      | `executionReport.${keyof OldExecutionReportData}`
      | keyof OldExecutionReportData,
  ) => (event: any) => void;
  onEquipmentChange: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    subField: keyof EquipmentData,
    value: string,
    prefix: string,
  ) => void;
  onAddEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    prefix: string,
  ) => void;
  onRemoveEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    prefix: string,
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

  const renderCheckboxGroup = (
    label: string,
    stateKey: keyof OldExecutionReportData,
    errorKey: string,
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
        "appliedEquipment",
      )}

      {data.hasEquipmentInstalled && (
        <>
          <EquipmentList
            items={data.appliedEquipment}
            fieldKey="appliedEquipment"
            prefix={prefix}
            onAddEquipment={onAddEquipment}
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
        "equipmentRemoved",
      )}

      {data.hasEquipmentRemoved && (
        <>
          <EquipmentList
            items={data.equipmentRemoved}
            fieldKey="equipmentRemoved"
            prefix={prefix}
            onAddEquipment={onAddEquipment}
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
