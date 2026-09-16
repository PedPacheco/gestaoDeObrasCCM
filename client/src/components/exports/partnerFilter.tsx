import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  Autocomplete,
  Box,
  IconButton,
  Modal,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ButtonComponent } from "../common/Button";
import { useState } from "react";

interface PartnerFilterProps {
  openModal: boolean;
  setOpenModal: (value: boolean) => void;
  generateExcel: (filters: { idPartner: number[] }) => Promise<void>;
  options: {
    parceira: Array<{ id: number; turma: string }>;
  };
  loading: boolean;
}

export function PartnerFilter({
  openModal,
  setOpenModal,
  generateExcel,
  options,
  loading,
}: PartnerFilterProps) {
  const [selectedPartners, setSelectedPartners] = useState<
    { id: number; turma: string }[]
  >([]);

  return (
    <Modal
      open={openModal}
      onClose={() => setOpenModal(!openModal)}
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
      closeAfterTransition
    >
      <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg w-8/12 md:w-1/2">
        <IconButton
          onClick={() => setOpenModal(!openModal)}
          className="absolute top-2 right-2 text-gray-600 dark:text-gray-300"
        >
          <XMarkIcon />
        </IconButton>

        <Box className="mb-2">
          <Typography variant="subtitle2" className="mb-2 text-gray-600">
            Parceira e Equipes
          </Typography>

          <Stack spacing={2}>
            <Autocomplete
              multiple
              options={options.parceira}
              value={selectedPartners}
              getOptionLabel={(option) => option.turma}
              onChange={(_, value) => setSelectedPartners(value)}
              renderInput={(params) => (
                <TextField {...params} label="Parceiras" fullWidth />
              )}
            />
          </Stack>
        </Box>

        <div className="flex justify-center gap-4">
          <ButtonComponent
            onClick={() => setOpenModal(!openModal)}
            text="Cancelar"
            styled=" py-2 px-4 rounded"
          />
          <ButtonComponent
            onClick={() => {
              generateExcel({
                idPartner: selectedPartners.map((partner) => partner.id),
              });

              setOpenModal(false);
            }}
            text={
              loading ? (
                <div className="flex items-center gap-2">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  Exportando...
                </div>
              ) : (
                "Confirmar"
              )
            }
            styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          />
        </div>
      </Box>
    </Modal>
  );
}
