"use client";

import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import { ButtonComponent } from "@/components/common/Button";

const REJECTION_REASONS = [
  { value: "documentacao_incompleta", label: "Documentação incompleta" },
  // { value: "quantidade_divergente", label: "Quantidade divergente" },
  { value: "arquivo_ilegivel", label: "Arquivo ilegível ou corrompido" },
  // { value: "item_fora_escopo", label: "Item não previsto no escopo" },
  { value: "outro", label: "Outro" },
] as const;

interface RejectFeasibilityModalProps {
  open: boolean;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (data: {
    reason: string;
    description: string;
  }) => void | Promise<void>;
}

export function RejectFeasibilityModal({
  open,
  submitting = false,
  onClose,
  onConfirm,
}: RejectFeasibilityModalProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const canConfirm = reason !== "" && description.trim() !== "";

  const resetAndClose = () => {
    setReason("");
    setDescription("");
    onClose();
  };

  const handleClose = () => {
    if (submitting) return;
    resetAndClose();
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;

    const reasonLabel =
      REJECTION_REASONS.find((item) => item.value === reason)?.label ?? reason;

    const data = { reason: reasonLabel, description };

    await onConfirm(data);
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle className="!text-lg !font-bold !text-zinc-900">
        Reprovar viabilidade
      </DialogTitle>

      <DialogContent className="!pt-2">
        <p className="mb-4 text-sm text-zinc-500">
          Selecione o motivo da reprovação e descreva o que precisa ser ajustado
          antes de um novo envio.
        </p>

        <FormControl fullWidth size="small" className="!mb-4">
          <InputLabel id="rejection-reason-label">Motivo</InputLabel>
          <Select
            labelId="rejection-reason-label"
            label="Motivo"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={submitting}
          >
            {REJECTION_REASONS.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Descrição"
          placeholder="Descreva o motivo da reprovação..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
          minRows={3}
          fullWidth
          size="small"
          disabled={submitting}
        />
      </DialogContent>

      <DialogActions className="!px-6 !pb-4">
        <button
          onClick={handleClose}
          disabled={submitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 disabled:opacity-40"
        >
          Cancelar
        </button>

        <ButtonComponent
          text="Confirmar reprovação"
          onClick={handleConfirm}
          disabled={!canConfirm || submitting}
        />
      </DialogActions>
    </Dialog>
  );
}
