import React, { useCallback, useState } from "react";
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Modal,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { ButtonComponent } from "@/components/common/Button";

interface FailureModalComponentProps {
  open: boolean;
  onClose: () => void;
  rejectedSchedule: {
    id: number;
    reject: boolean;
  }[];
  handleReject: (
    data: {
      id: number;
      reject: boolean;
      reason: string;
      description: string;
    }[],
  ) => void;
}

const reasonsForFailure: string[] = [
  "Data",
  "Horário",
  "Equipamento divergente",
  "Viabilidade",
  "Quantidade de equipes",
  "Tipo de equipe",
  "CHI",
  "Fora da meta",
];

export default function FailureModalComponent({
  open,
  onClose,
  handleReject,
  rejectedSchedule,
}: FailureModalComponentProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({
    reason: false,
    description: false,
  });

  // -----------------------------
  // Reset form
  // -----------------------------
  const resetForm = useCallback(() => {
    setReason("");
    setDescription("");
    setErrors({ reason: false, description: false });
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleRejectedSchedule = useCallback(() => {
    const newErrors = {
      reason: reason.trim() === "",
      description: description.trim() === "",
    };

    setErrors(newErrors);

    const hasError = Object.values(newErrors).some(Boolean);

    if (hasError) return;

    if (!rejectedSchedule) return;

    handleReject(
      rejectedSchedule.map((item) => ({
        id: item.id,
        reject: item.reject,
        description: description.trim(),
        reason: reason.trim(),
      })),
    );

    resetForm();
    onClose();
  }, [rejectedSchedule, handleReject, reason, description, resetForm, onClose]);

  const isFormValid = reason.trim() && description.trim();

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="failure-modal-title"
      aria-describedby="failure-modal-description"
      closeAfterTransition
    >
      <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg w-96 xl:w-10/12 flex flex-col items-center">
        <Typography
          id="failure-modal-title"
          variant="h6"
          component="h2"
          className="text-center mb-6 font-bold text-2xl"
        >
          Reprovação da programação
        </Typography>

        {/* Motivo */}
        <div className="w-64 mb-4">
          <FormControl fullWidth error={errors.reason}>
            <InputLabel>Motivo da reprovação</InputLabel>
            <Select
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setErrors((prev) => ({ ...prev, reason: false }));
              }}
              label="Motivo da reprovação"
            >
              {reasonsForFailure.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </Select>

            {errors.reason && (
              <Typography color="error" variant="caption">
                Motivo é obrigatório
              </Typography>
            )}
          </FormControl>
        </div>

        {/* Descrição */}
        <div className="mb-6 w-4/5">
          <TextField
            fullWidth
            label="Descrição"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setErrors((prev) => ({ ...prev, description: false }));
            }}
            error={errors.description}
            helperText={errors.description ? "Descrição é obrigatória" : ""}
            autoComplete="off"
          />
        </div>

        {/* Botões */}
        <div className="flex justify-center gap-4">
          <ButtonComponent
            onClick={handleClose}
            text="Cancelar"
            styled="py-2 px-4 rounded"
          />
          <ButtonComponent
            onClick={handleRejectedSchedule}
            text="Confirmar"
            // disabled={!isFormValid}
            styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50"
          />
        </div>
      </Box>
    </Modal>
  );
}
