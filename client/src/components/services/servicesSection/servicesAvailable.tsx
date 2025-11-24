import {
  ArrowUpTrayIcon,
  FunnelIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface ServicesAvaliableProps {
  servicesData: any[];
  points: string[];
  operations: string[];
  availableServices: any[];
  setSelectedServices: (service: any) => void;
  selectedServices: any;
  setOpenTeamsModal: (team: boolean) => void;
}

const serviceColumns = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "dataProg", label: "DATA PROG" },
  { key: "qtdePlanejada", label: "PLAN", align: "right" },
  { key: "qtdeProgramada", label: "PLAN TOTAL", align: "right" },
  { key: "qtdeRealizada", label: "REAL", align: "right" },
  { key: "dif", label: "DIF" },
  { key: "valorUnit", label: "VALOR UNIT", align: "right" },
  { key: "valorReal", label: "VALOR REAL" },
];

export function ServicesAvaliable({
  servicesData,
  availableServices,
  operations,
  points,
  selectedServices,
  setSelectedServices,
  setOpenTeamsModal,
}: ServicesAvaliableProps) {
  const [serviceFilter, setServiceFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [pointFilter, setPointFilter] = useState("");

  const [filteredServicesData, setFilteredServicesData] =
    useState<any[]>(servicesData);

  const allSelected = selectedServices.length === filteredServicesData.length;

  const handleFilteringData = () => {
    const result = servicesData.filter((service) => {
      const matchService =
        !serviceFilter || service.textoBreve === serviceFilter;

      const matchOperation =
        !operationFilter || service.operacao === operationFilter;

      const matchPoint = !pointFilter || service.ponto === pointFilter;

      return matchService && matchOperation && matchPoint;
    });

    setFilteredServicesData(result);
  };

  const clearFilter = () => {
    setFilteredServicesData(servicesData);
    setOperationFilter("");
    setPointFilter("");
    setServiceFilter("");
  };

  return (
    <Paper className="p-6 mb-6 min-h-96">
      <div className="flex items-center justify-between flex-wrap mb-4">
        <Typography className="text-xl font-semibold text-gray-700">
          SERVIÇOS DISPONÍVEIS PARA PROGRAMAÇÃO
        </Typography>
        <div className="flex gap-2">
          <Button
            variant="outlined"
            startIcon={<TrashIcon className="w-5 h-5 text-gray-700" />}
            className="border-blue-600 text-blue-600"
          >
            EXCLUIR SERVIÇOS
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowUpTrayIcon className="w-5 h-5 text-gray-700" />}
            className="border-blue-600 text-blue-600"
          >
            IMPORTAR SERVIÇOS
          </Button>
        </div>
      </div>
      {/* filtros */}
      <Paper className="bg-gray-100 p-4 mb-4">
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>SERVIÇO</InputLabel>
              <Select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
              >
                <MenuItem value="">Selecionar...</MenuItem>
                {availableServices.map((service, index) => (
                  <MenuItem key={index} value={service}>
                    {service}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>OPERAÇÃO</InputLabel>
              <Select
                value={operationFilter}
                onChange={(e) => setOperationFilter(e.target.value)}
              >
                <MenuItem value="">Selecionar...</MenuItem>
                {operations.map((op) => (
                  <MenuItem key={op} value={op}>
                    {op}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>PONTO</InputLabel>
              <Select
                value={pointFilter}
                onChange={(e) => setPointFilter(e.target.value)}
              >
                <MenuItem value="">Selecionar...</MenuItem>
                {points.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Buttons */}
          <Grid item xs={12} className="flex gap-2">
            <Button
              fullWidth
              variant="contained"
              className="bg-blue-600 text-white"
              onClick={handleFilteringData}
            >
              <FunnelIcon className="w-5 h-5 mr-1" /> APLICAR
            </Button>

            <Button
              fullWidth
              variant="outlined"
              className="border-gray-400 text-gray-600"
              onClick={clearFilter}
            >
              LIMPAR
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {/* tabela de serviços */}
      <TableContainer component={Paper} sx={{ height: 380 }}>
        <Table stickyHeader size="small" className="text-sm h-full">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={
                    selectedServices.length > 0 &&
                    selectedServices.length < filteredServicesData.length
                  }
                  onChange={(e) => {
                    if (e.target.checked) {
                      // Selecionar todos
                      setSelectedServices(
                        filteredServicesData.map((s) => ({
                          id: s.id,
                          prog: s.qtdePlanejada,
                        }))
                      );
                    } else {
                      // Limpar seleção
                      setSelectedServices([]);
                    }
                  }}
                />
              </TableCell>
              {serviceColumns.map((header, index) => (
                <TableCell key={index} className="text-nowrap">
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredServicesData?.map((row, index) => (
              <TableRow
                key={index}
                hover
                selected={selectedServices.includes(index)}
                className="cursor-pointer"
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedServices.some(
                      (item: any) => item.id === row.id
                    )}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedServices([
                          ...selectedServices,
                          { id: row.id, prog: row.qtdePlanejada },
                        ]);
                      } else {
                        setSelectedServices(
                          selectedServices.filter(
                            (selected: any) => selected.id !== row.id
                          )
                        );
                      }
                    }}
                  />
                </TableCell>

                {serviceColumns.map((col, index) => (
                  <TableCell key={index} className="text-nowrap">
                    {row[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box className="flex justify-end mt-4">
        <Button
          variant="contained"
          startIcon={<PlusIcon className="w-5 h-5 text-white" />}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          onClick={() => setOpenTeamsModal(true)}
          disabled={selectedServices.length === 0}
        >
          PROGRAMAR SERVIÇOS
        </Button>
      </Box>
    </Paper>
  );
}
