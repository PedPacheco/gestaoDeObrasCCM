import { Box, Modal, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ButtonComponent } from "./Button";

interface ErrorModalProps {
  open: boolean;
  onClose: () => void;
  icon: React.ReactNode;
  message: string;
}

export default function ErrorModal({
  message,
  onClose,
  open,
  icon,
}: ErrorModalProps) {
  const theme = useTheme();

  return (
    <Modal
      open={open}
      onClose={onClose}
      className="flex items-center justify-center p-4"
    >
      <Box
        className={`bg-white p-6 rounded-lg shadow-lg w-full lg:w-1/2 mx-auto flex flex-col items-center`}
      >
        {icon}
        <Typography className="font-semibold text-2xl">Erro</Typography>
        <Typography id="error-modal-description" className="mb-4">
          <p className="text-red-700 font-semibold text-lg text-center">
            {message}
          </p>
        </Typography>

        <ButtonComponent onClick={onClose} text="Fechar" styled="w-full" />
      </Box>
    </Modal>
  );
}
