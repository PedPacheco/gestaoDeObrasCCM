import React from "react";
import { Modal, Box, Typography, Button, IconButton } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { ButtonComponent } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeButton?: boolean;
}

export default function ModalComponent({
  open,
  onClose,
  title,
  children,
  closeButton = true,
}: ModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="custom-modal-title"
      aria-describedby="custom-modal-description"
      closeAfterTransition
    >
      <Box
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg w-10/12`}
      >
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
            id="custom-modal-title"
            variant="h6"
            component="h2"
            className="text-center mb-4 font-bold text-2xl"
          >
            {title}
          </Typography>
        )}
        <div id="custom-modal-description" className="mt-4 h-full">
          {children}
        </div>
        <ButtonComponent
          onClick={onClose}
          styled="mt-6 text-white py-2 px-4 rounded"
          text="Fechar"
        />
      </Box>
    </Modal>
  );
}
