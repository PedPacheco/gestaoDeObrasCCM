import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  TextField,
  FormHelperText,
} from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { UseExecutionServiceFormReturn } from "@/hooks/useExecutionServicesForm";
import { schedulesSchemaV2 } from "@/validations/validationExecutionServices";

interface RestrictionsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  options: {
    restricao: Array<{ id: number; restricao: string }>;
  };
  executionForm: UseExecutionServiceFormReturn;
}

export function RestrictionsModal({
  open,
  onClose,
  onSave,
  options,
  executionForm,
}: RestrictionsModalProps) {
  const {
    formErrors,
    editableData,
    setFormErrors,
    handleEditableChange,
    buildPayload,
  } = executionForm;

  const errorRestriction = formErrors["idExecutionRestriction"];
  const errorResponsibility = formErrors["responsibility"];
  const errorObservation = formErrors["executionObservation"];

  const EXECUTION_RESPONSIBILITIES = ["", "Edp", "Parceira", "Terceiro"];

  const handleSave = () => {
    onSave();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Responsáveis e Restrições
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <XMarkIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth error={!!errorRestriction}>
              <InputLabel>Restrição de Execução</InputLabel>
              <Select
                value={editableData.idExecutionRestriction}
                label="Restrição de Execução"
                onChange={handleEditableChange("idExecutionRestriction")}
                error={!!errorRestriction}
              >
                {options.restricao.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.restricao}
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

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errorResponsibility}>
              <InputLabel>Responsabilidade</InputLabel>
              <Select
                value={editableData.responsibility}
                label="Responsabilidade"
                onChange={handleEditableChange("responsibility")}
                error={!!errorResponsibility}
              >
                {EXECUTION_RESPONSIBILITIES.map((resp) => (
                  <MenuItem key={resp} value={resp}>
                    {resp}
                  </MenuItem>
                ))}
              </Select>
              {formErrors["responsibility"] && (
                <FormHelperText>{formErrors["responsibility"]}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Observação da Execução"
              value={editableData.executionObservation || ""}
              onChange={handleEditableChange("executionObservation")}
              error={!!errorObservation}
              helperText={errorObservation}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancelar
        </Button>
        <Button
          onClick={() => {
            const data = buildPayload();

            const validationResult = schedulesSchemaV2(true).safeParse(data);

            if (!validationResult.success) {
              const fieldErrors: Record<string, string> = {};

              validationResult.error.issues.forEach((err) => {
                const path = err.path.join(".");
                fieldErrors[path] = err.message;
              });

              setFormErrors(fieldErrors);

              return;
            }

            setFormErrors({});

            handleSave();
          }}
          variant="contained"
          color="primary"
        >
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
