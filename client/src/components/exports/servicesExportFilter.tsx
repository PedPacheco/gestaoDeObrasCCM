import { Autocomplete, Box, Modal, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { ButtonComponent } from "../common/Button";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export type ExportFileType = "excel" | "pdf";

export type ServicesExportFilterValues = {
  dataInicial: string;
  dataFinal: string;
  idParceira: number;
  idEquipe: number[];
};

export type DateRangeFilterValues = {
  startDate: string;
  endDate: string;
};

export type ExportFilterValues =
  | ServicesExportFilterValues
  | DateRangeFilterValues;

interface ServicesExportFilterProps {
  onConfirm: (filters: ServicesExportFilterValues) => void;
  options: {
    parceira: Array<{ id: number; turma: string }>;
    equipes: Array<{ id: number; equipe: string; id_turma: number }>;
  };
}

export function ServicesExportFilter({
  onConfirm,
  options,
}: ServicesExportFilterProps) {
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);

  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

  const [idParceira, setIdParceira] = useState<number | null>(null);

  const [equipes, setEquipes] = useState<number[]>([]);

  const handleConfirm = () => {
    if (!startDate || !endDate || !idParceira) {
      return;
    }

    console.log({
      dataInicial: startDate.format("YYYY-MM-DD"),
      dataFinal: endDate.format("YYYY-MM-DD"),
      idParceira,
      idEquipe: equipes,
    });

    onConfirm({
      dataInicial: startDate.format("YYYY-MM-DD"),
      dataFinal: endDate.format("YYYY-MM-DD"),
      idParceira,
      idEquipe: equipes,
    });
  };

  const filteredTeams = useMemo(() => {
    if (!idParceira) {
      return [];
    }

    return options.equipes.filter((item) => item.id_turma === idParceira);
  }, [idParceira, options.equipes]);

  return (
    <>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <DatePicker
          label="Data Inicial"
          value={startDate}
          format="DD/MM/YYYY"
          onChange={setStartDate}
        />
      </LocalizationProvider>

      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <DatePicker
          label="Data Final"
          value={endDate}
          format="DD/MM/YYYY"
          onChange={setEndDate}
        />
      </LocalizationProvider>

      <Autocomplete
        options={options.parceira}
        getOptionLabel={(option) => option.turma}
        onChange={(_, value) => setIdParceira(value?.id ?? null)}
        renderInput={(params) => <TextField {...params} label="Parceira" />}
      />

      <Autocomplete
        multiple
        disabled={!idParceira}
        options={filteredTeams}
        getOptionLabel={(option) => option.equipe}
        onChange={(_, value) => setEquipes(value.map((item) => item.id))}
        renderInput={(params) => <TextField {...params} label="Equipes" />}
      />

      <ButtonComponent text="Confirmar" onClick={handleConfirm} />
    </>
  );
}

interface ExportFiltersModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function ExportFiltersModal({
  open,
  onClose,
  children,
}: ExportFiltersModalProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <Box
        className="
          absolute
          top-1/2
          left-1/2
          -translate-x-1/2
          -translate-y-1/2
          bg-white
          p-6
          rounded-lg
          w-10/12
          md:w-1/2
        "
      >
        {children}
      </Box>
    </Modal>
  );
}
