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
} from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { ExecutionEditableData } from "@/hooks/useExecutionServicesForm";

interface RestrictionsModalProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  options: {
    restricao: Array<{ id: number; restricao: string }>;
  };
  onInputChange: (field: keyof ExecutionEditableData) => (event: any) => void;
  formData: {
    idExecutionRestriction: number;
    responsibility?: string;
  };
}

export function RestrictionsModal({
  open,
  onClose,
  onSave,
  formData,
  options,
  onInputChange,
}: RestrictionsModalProps) {
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
            <FormControl fullWidth>
              <InputLabel>Restrição de Execução</InputLabel>
              <Select
                value={formData.idExecutionRestriction}
                label="Restrição de Execução"
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
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" color="secondary">
          Cancelar
        </Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
