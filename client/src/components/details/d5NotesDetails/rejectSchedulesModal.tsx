import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { RestrictionOption } from "./d5NotesPanel";

export interface RejectD5SchedulePayload {
  id: number;
  reason: string;
  description: string;
}

interface RejectSchedulesModalProps {
  open: boolean;
  onClose: () => void;
  options: RestrictionOption[];
  /** Ids das programações selecionadas para reprovação. */
  selectedIds: Set<number>;
  onConfirm: (data: RejectD5SchedulePayload[]) => Promise<void> | void;
}

const MAX_DESCRIPTION = 500;

export default function RejectSchedulesModal({
  open,
  onClose,
  options,
  selectedIds,
  onConfirm,
}: RejectSchedulesModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ reason: false, description: false });

  const selectedCount = selectedIds.size;

  const resetForm = useCallback(() => {
    setReason("");
    setDescription("");
    setErrors({ reason: false, description: false });
  }, []);

  // garante formulário limpo a cada abertura
  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const handleClose = useCallback(() => {
    if (submitting) return;
    resetForm();
    onClose();
  }, [onClose, resetForm, submitting]);

  const isFormValid = useMemo(
    () =>
      reason.trim() !== "" && description.trim() !== "" && selectedCount > 0,
    [reason, description, selectedCount],
  );

  const handleConfirm = useCallback(async () => {
    const newErrors = {
      reason: reason.trim() === "",
      description: description.trim() === "",
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;
    if (selectedCount === 0 || submitting) return;

    const payload: RejectD5SchedulePayload[] = Array.from(selectedIds).map(
      (id) => ({
        id,
        reason: reason.trim(),
        description: description.trim(),
      }),
    );

    setSubmitting(true);
    try {
      await onConfirm(payload);
      resetForm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }, [
    selectedIds,
    selectedCount,
    onConfirm,
    reason,
    description,
    resetForm,
    onClose,
    submitting,
  ]);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="reject-modal-title"
      aria-describedby="reject-modal-description"
      closeAfterTransition
    >
      <Box className="absolute top-1/2 left-1/2 flex w-96 -translate-x-1/2 -translate-y-1/2 transform flex-col items-center rounded-lg bg-white p-6 shadow-lg xl:w-10/12 dark:bg-gray-800">
        <Typography
          id="reject-modal-title"
          variant="h6"
          component="h2"
          className="mb-2 text-center text-2xl font-bold"
        >
          Reprovação da programação
        </Typography>

        {/* Motivo */}
        <div className="mb-4 w-64">
          <FormControl fullWidth error={errors.reason} disabled={submitting}>
            <InputLabel>Motivo da reprovação</InputLabel>
            <Select
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setErrors((prev) => ({ ...prev, reason: false }));
              }}
              label="Motivo da reprovação"
            >
              {options.map((item) => (
                <MenuItem key={item.id} value={item.restricao}>
                  {item.restricao}
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
            multiline
            rows={4}
            label="Descrição"
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setErrors((prev) => ({ ...prev, description: false }));
            }}
            error={errors.description}
            helperText={
              errors.description
                ? "Descrição é obrigatória"
                : `${description.length}/${MAX_DESCRIPTION}`
            }
            inputProps={{ maxLength: MAX_DESCRIPTION }}
            disabled={submitting}
            autoComplete="off"
          />
        </div>

        {/* Botões */}
        <div className="flex justify-center gap-4">
          <ButtonComponent
            onClick={handleClose}
            text="Cancelar"
            disabled={submitting}
            styled="py-2 px-4 rounded"
          />
          <ButtonComponent
            onClick={handleConfirm}
            text={submitting ? "A reprovar..." : "Confirmar"}
            disabled={!isFormValid || submitting}
            styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded disabled:opacity-50"
          />
        </div>
      </Box>
    </Modal>
  );
}
