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
import { ExecutionReportData } from "./executionReportDialog";
import { EquipmentList } from "./equipmentList";
import { equipmentItemSchemaV2 } from "@/validations/validationExecutionServices";

export type EquipmentData = z.infer<typeof equipmentItemSchemaV2>;

interface ExecutionEquipmentPanelProps {
  formData: ExecutionReportData;
  formErrors: Record<string, string>;
  handleExecutionReportChange: (
    field: keyof ExecutionReportData,
  ) => (event: any) => void;
  onEquipmentChange: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    subField: keyof EquipmentData,
    value: string,
  ) => void;
  onAddEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    type?: "DEFAULT" | "CS",
    insertIndex?: number,
  ) => void;
  onRemoveEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
  ) => void;
}

export const ExecutionEquipmentPanel: React.FC<
  ExecutionEquipmentPanelProps
> = ({
  formData,
  formErrors,
  handleExecutionReportChange,
  onAddEquipment,
  onEquipmentChange,
  onRemoveEquipment,
}) => {
  const renderCheckboxGroup = (
    label: string,
    stateKey: keyof ExecutionReportData,
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
                  checked={formData[stateKey] === true}
                  onChange={() =>
                    handleExecutionReportChange(stateKey)({
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
                  checked={formData[stateKey] === false}
                  onChange={() =>
                    handleExecutionReportChange(stateKey)({
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

      {formData.hasEquipmentInstalled && (
        <>
          <EquipmentList
            items={formData.appliedEquipment}
            fieldKey="appliedEquipment"
            onAddEquipment={onAddEquipment}
            onEquipmentChange={onEquipmentChange}
            onRemoveEquipment={onRemoveEquipment}
            formErrors={formErrors}
          />
          <Grid item xs={12}>
            <ButtonComponent
              onClick={() => onAddEquipment("appliedEquipment")}
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

      {formData.hasEquipmentRemoved && (
        <>
          <EquipmentList
            items={formData.equipmentRemoved}
            fieldKey="equipmentRemoved"
            onAddEquipment={onAddEquipment}
            onEquipmentChange={onEquipmentChange}
            onRemoveEquipment={onRemoveEquipment}
            formErrors={formErrors}
          />
          <Grid item xs={12}>
            <ButtonComponent
              onClick={() => onAddEquipment("equipmentRemoved")}
              text="Adicionar equipamento removido"
            />
          </Grid>
        </>
      )}
    </Grid>
  );
};
