import { ButtonComponent } from "@/components/common/Button";
import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";

interface PartnerSelectorModalProps {
  open: boolean;
  onClose: () => void;
  partners: { id: number; turma: string }[];
  onSelectPartner: (partnerId: number) => void;
}

export function PartnerSelectorModal({
  open,
  onClose,
  partners,
  onSelectPartner,
}: PartnerSelectorModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
      PaperProps={{
        className:
          "!bg-[#1e2f42] !border !border-white/10 !rounded-2xl !shadow-2xl !overflow-hidden",
      }}
    >
      {/* Header */}
      <DialogTitle className="!bg-[#1e3a5f] !flex !items-center !justify-between !px-6 !py-4">
        <Typography className="!font-bold !text-white">
          Nova Auditoria
        </Typography>

        <IconButton
          onClick={onClose}
          size="small"
          className="!text-white/60 hover:!text-white"
        >
          <XMarkIcon className="w-[18px] h-[18px]" />
        </IconButton>
      </DialogTitle>

      {/* Conteúdo */}
      <DialogContent className="!px-6 !py-6">
        <Typography variant="body2" className="!text-zinc-400 !my-2">
          Selecione a parceira. A linha será inserida após o último registro da
          empresa escolhida.
        </Typography>

        <List disablePadding className="flex flex-col gap-2">
          {partners.map((partner) => (
            <ListItemButton
              key={partner.id}
              onClick={() => onSelectPartner(partner.id)}
              className="!border !border-white/10 !rounded-xl !px-4 !py-3 !transition-all !duration-200"
              sx={{
                "&:hover": {
                  borderColor: "rgba(59, 130, 246, 0.4)",
                  backgroundColor: "rgba(30, 58, 95, 0.5)",
                  "& .partner-name": { color: "white" },
                  "& .partner-icon": { color: "#60a5fa" },
                },
              }}
            >
              <ListItemText
                primary={partner.turma}
                className="partner-name"
                sx={{
                  "& .MuiListItemText-primary": {
                    fontWeight: 600,
                    color: "#e4e4e7",
                    fontSize: "0.875rem",
                  },
                }}
              />
              <ListItemIcon className="partner-icon !min-w-0 !text-zinc-500">
                <PlusIcon className="w-4 h-4" />
              </ListItemIcon>
            </ListItemButton>
          ))}
        </List>
      </DialogContent>

      {/* Footer */}
      <DialogActions className="!justify-center !pb-6">
        <ButtonComponent text="Cancelar" onClick={onClose} />
      </DialogActions>
    </Dialog>
  );
}
