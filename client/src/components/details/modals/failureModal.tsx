import React, { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { ButtonComponent } from "../../common/Button";
import { flushSync } from "react-dom";

interface FailureModalComponentProps {
  open: boolean;
  onClose: () => void;
  rejectedSchedule: {
    id: number;
    reject: boolean;
  } | null;
  handleReject: (data: {
    id: number;
    reject: boolean;
    reason: string;
    description: string;
  }) => void;
}

const reasonsForFailure: string[] = [
  "Data",
  "Horário",
  "Equipamento divergênte",
  "Viabilidade",
  "Quantidade de equipes",
  "Tipo de equipe",
  "CHI",
  "Outros",
];

export default function FailureModalComponent({
  open,
  onClose,

  handleReject,
  rejectedSchedule,
}: FailureModalComponentProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleRejectedSchedule = () => {
    if (!rejectedSchedule) return;

    const newRejected = {
      id: rejectedSchedule?.id,
      reject: rejectedSchedule?.reject,
      reason: reason,
      description: description,
    };

    handleReject(newRejected);

    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
      closeAfterTransition
    >
      <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg w-96 xl:w-10/12 flex flex-col items-center">
        <Typography
          id="confirmation-modal-title"
          variant="h6"
          component="h2"
          className="text-center mb-4 font-bold text-2xl"
        >
          Reprovação da programação
        </Typography>

        <div className="w-64 mb-4">
          <FormControl fullWidth>
            <InputLabel>Motivo da reprovação</InputLabel>
            <Select
              value={reason || ""}
              onChange={(event) => setReason(event.target.value)}
              label="Motivo"
            >
              {reasonsForFailure.map((reason, index) => (
                <MenuItem key={index} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <div className="mb-4 w-4/5">
          <TextField
            fullWidth
            label="Motivo"
            value={description || ""}
            onChange={(event) => setDescription(event.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="flex justify-center gap-4">
          <ButtonComponent
            onClick={onClose}
            text="Cancelar"
            styled=" py-2 px-4 rounded"
          />
          <ButtonComponent
            onClick={handleRejectedSchedule}
            text="Confirmar"
            styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          />
        </div>
      </Box>
    </Modal>
  );
}
