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
  isDisabled: boolean;
}

export function ConfirmRescheduleModal({
  open,
  onClose,
  onConfirm,
  isDisabled,
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
        <ButtonComponent
          text="Cancelar"
          styled="!h-8"
          onClick={onClose}
          disabled={isDisabled}
        />

        <ButtonComponent
          text={isDisabled ? "Reprogramando..." : "Confirmar"}
          styled="!h-8"
          onClick={onConfirm}
          disabled={isDisabled}
        />
      </DialogActions>
    </Dialog>
  );
}
