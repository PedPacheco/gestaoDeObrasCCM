"use client";

import { useState } from "react";
import {
  Avatar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Typography,
} from "@mui/material";
import {
  CheckCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { ButtonComponent } from "@/components/common/Button";

interface TeamModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (team: any) => void;
  teams: any[];
}

function getTeamInitials(team: any): string {
  const teamType = team.equipe;

  if (teamType.includes("LM")) {
    return "LM";
  }
  if (teamType.includes("LV")) {
    return "LV";
  }

  return "BT0";
}

export function TeamModal({ open, onClose, onConfirm, teams }: TeamModalProps) {
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  const handleClose = () => {
    setSelectedTeam(null);
    onClose();
  };

  const handleConfirm = () => {
    if (!selectedTeam) return;
    onConfirm(selectedTeam);
    setSelectedTeam(null);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: "12px" },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-medium text-gray-900">
              Definir equipe
            </h2>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, fontSize: 12 }}
            >
              Selecione a equipe responsável pelos serviços
            </Typography>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 2 }}>
        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-gray-400">
            <UserGroupIcon className="h-8 w-8 opacity-50" />
            <p className="text-sm">Nenhuma equipe disponível</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {teams
              .sort((a, b) => {
                if (a.perfil < b.perfil) return -1;
                if (a.perfil > b.perfil) return 1;

                return 0;
              })
              .map((team, index) => {
                const isSelected =
                  selectedTeam !== null &&
                  String(selectedTeam.id) === String(team.id);

                return (
                  <button
                    key={team.id ?? index}
                    type="button"
                    onClick={() => setSelectedTeam(team)}
                    className={`flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-blue-300"
                    }`}
                  >
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        fontSize: 14,
                        fontWeight: 600,
                        backgroundColor: "#E6F1FB",
                        color: "#185FA5",
                        flexShrink: 0,
                      }}
                    >
                      {getTeamInitials(team)}
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-zinc-700">
                        {team.equipe}
                      </p>
                      <p className="truncate text-sm text-zinc-500">
                        Encarregado: {team.encarregado}
                      </p>
                      {team.perfil && (
                        <p className="truncate text-sm text-zinc-500">
                          Perfil: {team.perfil}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-blue-500" />
                    )}
                  </button>
                );
              })}
          </div>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
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
          text="Confirmar Equipe"
          onClick={handleConfirm}
          disabled={!selectedTeam || teams.length === 0}
          styled="!py-[5px] !px-[15px] !text-sm !h-9"
        />
      </DialogActions>
    </Dialog>
  );
}
