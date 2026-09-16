"use client";

import { Dispatch, SetStateAction } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import {
  ClipboardDocumentListIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { ButtonComponent } from "@/components/common/Button";

interface ServiceQuantityToBt0ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onQuantityChange: Dispatch<SetStateAction<any[]>>;
  selectedServices: any[];
}

export function ServiceQuantityToBt0Modal({
  open,
  onClose,
  onConfirm,
  selectedServices,
  onQuantityChange,
}: ServiceQuantityToBt0ModalProps) {
  const handleChange = (id: number, value: string, max: number) => {
    if (value === "") {
      onQuantityChange((prev) =>
        prev.map((s) => (s.id === id ? { ...s, prog: 0 } : s)),
      );
      return;
    }

    const parsed = parseFloat(value);
    if (isNaN(parsed) || parsed < 0) return;

    const clamped = Math.round(Math.min(parsed, max) * 1000) / 1000;

    onQuantityChange((prev) =>
      prev.map((s) => (s.id === id ? { ...s, prog: clamped } : s)),
    );
  };

  const hasAnySelected = selectedServices.some((s) => s.prog > 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "12px" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-medium text-gray-900">
              Programar serviços
            </h2>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, fontSize: 12 }}
            >
              Informe a quantidade que deseja programar para cada serviço
            </Typography>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2, px: 0 }}>
        {selectedServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-gray-400">
            <ClipboardDocumentListIcon className="h-8 w-8 opacity-50" />
            <p className="text-sm">Nenhum serviço disponível</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_100px_120px] gap-3 px-4 pb-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Serviço/Material
              </span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                Disponível
              </span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                Programar
              </span>
            </div>

            <Divider />

            <div className="flex max-h-[400px] flex-col overflow-y-auto">
              {selectedServices.map((service, index) => {
                const max = service.saldoDisponivel;

                return (
                  <div
                    key={service.id ?? index}
                    className={`grid grid-cols-[1fr_100px_120px] items-center gap-3 px-4 py-3 bg-white
                     ${
                       index < selectedServices.length - 1
                         ? "border-b border-gray-100"
                         : ""
                     }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-700">
                        {service.textoBreve}
                      </p>
                    </div>

                    <div className="text-center">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-medium text-gray-700">
                        {max}
                      </span>
                    </div>

                    <div className="flex justify-center">
                      <TextField
                        type="number"
                        size="small"
                        value={service.prog === 0 ? "" : service.prog}
                        onChange={(e) =>
                          handleChange(service.id, e.target.value, max)
                        }
                        placeholder="0"
                        inputProps={{
                          min: 0,
                          max: max,
                          step: "any",
                          style: { textAlign: "center" },
                        }}
                        sx={{
                          width: 80,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            height: 36,
                          },
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            textTransform: "none",
            fontSize: 14,
            color: "text.secondary",
            borderColor: "divider",
          }}
        >
          Cancelar
        </Button>

        <ButtonComponent
          text="Confirmar Programação"
          onClick={onConfirm}
          disabled={!hasAnySelected || selectedServices.length === 0}
          styled="!py-[5px] !px-[15px] !text-sm !h-9"
        />
      </DialogActions>
    </Dialog>
  );
}
