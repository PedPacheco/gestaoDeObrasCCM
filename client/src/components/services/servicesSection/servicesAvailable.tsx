import { useEffect, useState } from "react";

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
import { TableFilter } from "./servicesFilters";

interface ServicesAvaliableProps {
  servicesData: any[];
  points: string[];
  operations: string[];
  availableServices: any[];
  setSelectedServices: (service: any) => void;
  selectedServices: any;
  setOpenTeamsModal: (team: boolean) => void;
  isInsert: boolean;
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
  isInsert,
}: ServicesAvaliableProps) {
  const [filteredServicesData, setFilteredServicesData] = useState<any[]>([]);

  useEffect(() => {
    setFilteredServicesData(servicesData);
  }, [servicesData]);

  const allSelected = selectedServices.length === filteredServicesData.length;

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
      <TableFilter
        data={servicesData}
        fields={[
          {
            label: "SERVIÇO",
            field: "textoBreve",
            options: availableServices,
          },
          {
            label: "OPERAÇÃO",
            field: "operacao",
            options: operations,
          },
          {
            label: "PONTO",
            field: "ponto",
            options: points,
          },
        ]}
        onFilter={setFilteredServicesData}
      />

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
                        })),
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
                      (item: any) => item.id === row.id,
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
                            (selected: any) => selected.id !== row.id,
                          ),
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
      {!isInsert && (
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
      )}
    </Paper>
  );
}
