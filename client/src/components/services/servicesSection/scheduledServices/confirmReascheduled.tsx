import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { ButtonComponent } from "@/components/common/Button";

interface ConfirmRescheduleModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmRescheduleModal({
  open,
  onClose,
  onConfirm,
}: ConfirmRescheduleModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirmar Reprogramação</DialogTitle>

      <DialogContent>
        <Typography className="text-gray-600">
          Deseja realmente reprogramar os serviços marcados para reprogramação?
        </Typography>
      </DialogContent>

      <DialogActions className="px-6 pb-4">
        <ButtonComponent text="Cancelar" styled="!h-8" onClick={onClose} />

        <ButtonComponent text="Confirmar" styled="!h-8" onClick={onConfirm} />
      </DialogActions>
    </Dialog>
  );
}
