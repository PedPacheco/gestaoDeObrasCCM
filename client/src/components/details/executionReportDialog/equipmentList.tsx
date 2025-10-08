import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { EquipmentData } from "./EquipmentPanel";
import { ButtonComponent } from "@/components/common/Button";

const EQUIPMENTS = [
  "Banco capacitor",
  "Transformador",
  "Religador",
  "Regulador de tensão",
] as const;

const PREFIXES: Record<string, string> = {
  Transformador: "ET",
  "Banco capacitor": "BC",
  "Regulador de tensão": "RV",
  Religador: "RE",
};

const POWER_OPTIONS: Record<string, string[]> = {
  "Banco capacitor": ["300", "600", "1200"],
  Transformador: [
    "1,5",
    "5",
    "10",
    "15",
    "25",
    "30",
    "45",
    "50",
    "75",
    "100",
    "112.5",
    "150",
    "225",
    "300",
    "500",
  ],
  Religador: ["0"],
  "Regulador de tensão": ["167", "333"],
};

const csBrand = ["Landis Gyr", "Eletra", "Nansen"];

interface EquipmentListProps {
  items: EquipmentData[];
  fieldKey: "appliedEquipment" | "equipmentRemoved";
  prefix: string;
  onAddEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    prefix: string,
    type: string,
    insertIndex?: number
  ) => void;
  onEquipmentChange: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    subField: keyof EquipmentData,
    value: string,
    prefix: string
  ) => void;
  onRemoveEquipment: (
    field: "appliedEquipment" | "equipmentRemoved",
    index: number,
    prefix: string
  ) => void;
  formErrors: Record<string, string>;
}

export const EquipmentList = ({
  items,
  fieldKey,
  prefix,
  onAddEquipment,
  onEquipmentChange,
  onRemoveEquipment,
  formErrors,
}: EquipmentListProps) => {
  return (
    <>
      {items.map((eq, index) => {
        const equipmentError = formErrors[`${fieldKey}.${index}.equipment`];
        const powerError = formErrors[`${fieldKey}.${index}.power`];
        const patrimonyError = formErrors[`${fieldKey}.${index}.patrimony`];
        const installationError =
          formErrors[`${fieldKey}.${index}.installation`];

        return (
          <Grid container spacing={2} key={index} sx={{ margin: 1 }}>
            <Grid item xs={2.5}>
              <FormControl fullWidth error={!!equipmentError}>
                {eq.type === "DEFAULT" ? (
                  <>
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
                  </>
                ) : (
                  <TextField
                    fullWidth
                    label="Número CS"
                    value={
                      eq.equipment?.startsWith("CS")
                        ? eq.equipment
                        : "CS" + (eq.equipment || "")
                    }
                    onChange={(e) =>
                      onEquipmentChange(
                        fieldKey,
                        index,
                        "equipment",
                        e.target.value,
                        prefix
                      )
                    }
                    autoComplete="off"
                  />
                )}
                {equipmentError && (
                  <FormHelperText>{equipmentError}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={2.5}>
              <TextField
                fullWidth
                label="Número de Instalação"
                value={
                  PREFIXES[eq.equipment]
                    ? eq.installation?.startsWith(PREFIXES[eq.equipment])
                      ? eq.installation
                      : PREFIXES[eq.equipment] + (eq.installation || "")
                    : eq.installation
                }
                onChange={(e) =>
                  onEquipmentChange(
                    fieldKey,
                    index,
                    "installation",
                    e.target.value,
                    prefix
                  )
                }
                error={!!installationError}
                helperText={installationError}
              />
            </Grid>
            <Grid item xs={2.5}>
              <FormControl fullWidth error={!!powerError}>
                <InputLabel>
                  {eq.type === "DEFAULT" ? "Potência" : "Marca CS"}
                </InputLabel>
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
                  {eq.type === "DEFAULT"
                    ? (POWER_OPTIONS[eq.equipment] || []).map((power) => (
                        <MenuItem key={power} value={power}>
                          {power}
                        </MenuItem>
                      ))
                    : csBrand.map((power) => (
                        <MenuItem key={power} value={power}>
                          {power}
                        </MenuItem>
                      ))}
                </Select>
                {powerError && <FormHelperText>{powerError}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={2.5}>
              <TextField
                fullWidth
                label={eq.type === "DEFAULT" ? "Patrimônio" : "Número de série"}
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
            <Grid
              item
              xs={4.5}
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 1,
              }}
            >
              {eq.equipment === "Transformador" && (
                <ButtonComponent
                  onClick={() => onAddEquipment(fieldKey, prefix, "CS", index)}
                  text="Adicionar CS"
                  styled="w-[200px]"
                />
              )}
              <ButtonComponent
                onClick={() => onRemoveEquipment(fieldKey, index, prefix)}
                text={`Remover equipamento ${
                  fieldKey === "appliedEquipment" ? "aplicado" : "removido"
                }`}
              />
            </Grid>
          </Grid>
        );
      })}
    </>
  );
};
