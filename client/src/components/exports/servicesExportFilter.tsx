import {
  Autocomplete,
  Box,
  FormControl,
  FormControlLabel,
  FormLabel,
  Modal,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ButtonComponent } from "../common/Button";
import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { ArrowPathIcon } from "@heroicons/react/20/solid";

export type ExportFileType = "excel" | "pdf";

export type ServicesExportFilterValues = {
  dataInicial: string;
  dataFinal: string;
  idParceira: number[];
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
  onConfirm: (
    filters: ServicesExportFilterValues & {
      fileType: ExportFileType;
    },
  ) => void;
  options: {
    parceira: Array<{ id: number; turma: string }>;
    equipes: Array<{ id: number; equipe: string; id_turma: number }>;
  };
  loading?: boolean;
}

export function ServicesExportFilter({
  onConfirm,
  options,
  loading = false,
}: ServicesExportFilterProps) {
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

  const [idParceira, setIdParceira] = useState<number[]>([]);
  const [equipes, setEquipes] = useState<number[]>([]);

  const [fileType, setFileType] = useState<ExportFileType>("excel");

  const filteredTeams = useMemo(() => {
    if (!idParceira) return [];
    return options.equipes.filter((item) => idParceira.includes(item.id_turma));
  }, [idParceira, options.equipes]);

  const handleConfirm = () => {
    if (!startDate || !endDate || !idParceira) return;

    onConfirm({
      dataInicial: startDate.format("YYYY-MM-DD"),
      dataFinal: endDate.format("YYYY-MM-DD"),
      idParceira,
      idEquipe: equipes,
      fileType,
    });
  };

  return (
    <Stack spacing={3} className="w-full">
      {/* Grupo: período */}
      <Box>
        <Typography variant="subtitle2" className="mb-2 text-gray-600">
          Período
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="pt-br"
          >
            <DatePicker
              label="Data Inicial"
              value={startDate}
              format="DD/MM/YYYY"
              onChange={setStartDate}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="pt-br"
          >
            <DatePicker
              label="Data Final"
              value={endDate}
              format="DD/MM/YYYY"
              onChange={setEndDate}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Stack>
      </Box>

      {/* Grupo: parceira e equipes */}
      <Box>
        <Typography variant="subtitle2" className="mb-2 text-gray-600">
          Parceira e Equipes
        </Typography>

        <Stack spacing={2}>
          <Autocomplete
            multiple
            options={options.parceira}
            getOptionLabel={(option) => option.turma}
            onChange={(_, value) => {
              setIdParceira(value.map((item) => item.id));
              setEquipes([]); // limpa equipes ao trocar de parceira
            }}
            renderInput={(params) => (
              <TextField {...params} label="Parceira" fullWidth />
            )}
          />

          <Autocomplete
            multiple
            disabled={!idParceira}
            options={filteredTeams}
            value={filteredTeams.filter((t) => equipes.includes(t.id))}
            getOptionLabel={(option) => option.equipe}
            onChange={(_, value) => setEquipes(value.map((item) => item.id))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Equipes"
                placeholder={!idParceira ? "Selecione a parceira primeiro" : ""}
                fullWidth
              />
            )}
          />
        </Stack>
      </Box>

      {/* Grupo: formato de exportação */}
      <FormControl>
        <FormLabel className="text-gray-600">Tipo de Exportação</FormLabel>

        <RadioGroup
          row
          value={fileType}
          onChange={(event) =>
            setFileType(event.target.value as ExportFileType)
          }
        >
          <FormControlLabel
            value="excel"
            control={<Radio />}
            label="Planilha Excel"
          />
          <FormControlLabel value="pdf" control={<Radio />} label="PDF" />
        </RadioGroup>
      </FormControl>

      <ButtonComponent
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
        onClick={handleConfirm}
        disabled={loading}
      />
    </Stack>
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
