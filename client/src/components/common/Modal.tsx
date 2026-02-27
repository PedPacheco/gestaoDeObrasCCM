import React from "react";

import { Box, Modal, Typography } from "@mui/material";

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
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
          bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg w-96 xl:w-2/4 max-h-72 flex flex-col`}
      >
        {title && (
          <Typography
            id="custom-modal-title"
            variant="h6"
            component="h2"
            className="text-center font-bold text-2xl p-6 pb-2"
          >
            {title}
          </Typography>
        )}
        <div id="custom-modal-description" className="px-6 flex-1 text-center">
          {children}
        </div>
        <div>
          <ButtonComponent
            onClick={onClose}
            styled="w-full text-white py-2 px-4 rounded"
            text="Fechar"
          />
        </div>
      </Box>
    </Modal>
  );
}
