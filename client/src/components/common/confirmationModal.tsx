import React from "react";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { ButtonComponent } from "./Button";

interface ConfirmationModalComponentProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (id: number) => void;
  title?: string;
  message: string;
  closeButton?: boolean;
  actionId: number;
}

export default function ConfirmationModalComponent({
  open,
  onClose,
  onConfirm,
  title,
  message,
  closeButton = true,
  actionId,
}: ConfirmationModalComponentProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
      closeAfterTransition
    >
      <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg w-96 xl:w-2/4">
        {closeButton && (
          <IconButton
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-600 dark:text-gray-300"
          >
            <XMarkIcon />
          </IconButton>
        )}
        {title && (
          <Typography
            id="confirmation-modal-title"
            variant="h6"
            component="h2"
            className="text-center mb-4 font-bold text-2xl"
          >
            {title}
          </Typography>
        )}
        <Typography
          id="confirmation-modal-description"
          className="text-center text-lg text-gray-700 dark:text-gray-200 mb-6"
        >
          {message}
        </Typography>

        <div className="flex justify-center gap-4">
          <ButtonComponent
            onClick={onClose}
            text="Cancelar"
            styled=" py-2 px-4 rounded"
          />
          <ButtonComponent
            onClick={() => onConfirm(actionId)}
            text="Confirmar"
            styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          />
        </div>
      </Box>
    </Modal>
  );
}
