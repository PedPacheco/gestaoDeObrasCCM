import React from "react";

import { Box, Modal, Typography } from "@mui/material";

import { ButtonComponent } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  closeButton?: boolean;
  className?: string;
}

const DEFAULT_WIDTH = "w-80 xl:w-8/12";

export default function ModalComponent({
  open,
  onClose,
  title,
  children,
  className,
  closeButton = false,
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
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg max-h-[90vh] overflow-y-auto ${
          className ?? DEFAULT_WIDTH
        }`}
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
        {closeButton && (
          <ButtonComponent
            onClick={onClose}
            styled="mt-2 text-white py-2 px-4 rounded"
            text="Fechar"
          />
        )}
      </Box>
    </Modal>
  );
}
