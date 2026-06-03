import { useEffect, useState, useTransition } from "react";

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
import { useRouter } from "next/navigation";
import {
  applyAdditonalPlanServices,
  scheduleServices,
} from "@/actions/services";
import { FormatCurrency } from "@/utils/formatValue";
import { LoadingComponent } from "@/components/common/Loading";
import { TeamModal } from "./teamsModal";
import { useFeedback } from "@/hooks/useFeedback";

interface ServicesAvaliableProps {
  servicesData: any[];
  points: string[];
  operations: string[];
  availableServices: any[];
  setSelectedServices: (service: any) => void;
  selectedServices: any;
  teams: any[];
  // setOpenTeamsModal: (team: boolean) => void;
  isInsert: boolean;
  isDisabled: boolean;
  onError: (error: string) => void;
  onSuccess: (success: string, onClose?: () => void) => void;
}

const serviceColumns = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "dataProg", label: "DATA PROG" },
  { key: "qtdePlanejada", label: "PLAN" },
  { key: "qtdeAdicional", label: "ADICIONAL" },
  { key: "qtdeProgramada", label: "PROG" },
  { key: "qtdeRealizada", label: "REAL" },
  { key: "dif", label: "DIF" },
  { key: "valorUnit", label: "VALOR UNIT" },
  { key: "valorReal", label: "VALOR REAL" },
];

export function ServicesAvaliable({
  servicesData,
  availableServices,
  operations,
  points,
  teams,
  selectedServices,
  setSelectedServices,
  // setOpenTeamsModal,
  isInsert,
  isDisabled,
  onError,
  onSuccess,
}: ServicesAvaliableProps) {
  const [filteredServicesData, setFilteredServicesData] = useState<any[]>([]);
  const [openTeamsModal, setOpenTeamsModal] = useState(false);

  const [isPending, startTransition] = useTransition();

  const { showError, showSuccess } = useFeedback();

  const router = useRouter();

  const allSelected = selectedServices.length === filteredServicesData.length;

  useEffect(() => {
    setFilteredServicesData(servicesData);
  }, [servicesData]);

  const updateServiceQuantity = (id: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    setFilteredServicesData((prev: any) =>
      prev.map((item: any) =>
        item.id === id
          ? { ...item, qtdeAdicional: value === "" ? null : value }
          : item,
      ),
    );
  };

  const applyAdditional = async () => {
    const data = filteredServicesData.map((service) => ({
      id: service.id,
      additional:
        service.qtdeAdicional == null || service.qtdeAdicional === ""
          ? null
          : Number(service.qtdeAdicional),
    }));

    const response = await applyAdditonalPlanServices(data);

    if (!response.success) {
      onError(response.error);
      return;
    }

    startTransition(() => {});

    if (response.message) {
      onSuccess(response.message, () => router.refresh());
    }
  };

  const handleTeamConfirm = (idTeam: number | string) => {
    setOpenTeamsModal(false);

    if (selectedServices.length === 0) {
      showError("Nenhum serviço selecionado.");
      return;
    }

    // console.log(idTeam, selectedServices);

    const formattedServices = selectedServices.map((service: any) => ({
      id: service.id,
      idTeam,
      prog: service.prog,
      additional: service.additional,
    }));

    setSelectedServices(formattedServices);
  };

  const isDisableAfterChangeData = filteredServicesData.some((item) => {
    const original = servicesData.find((service) => service.id === item.id);

    return original?.qtdeAdicional !== item.qtdeAdicional;
  });

  const canSchedule =
    selectedServices.length > 0 && !isDisabled && !isDisableAfterChangeData;

  return (
    <>
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
                            additional: s.qtdeAdicional,
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
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <LoadingComponent color="text-black" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredServicesData?.map((row, index) => (
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
                              {
                                id: row.id,
                                prog: row.qtdePlanejada,
                                additional: row.qtdeAdicional,
                              },
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

                    {serviceColumns.map((col, index) => {
                      let value = row[col.key];

                      if (col.key === "qtdeAdicional") {
                        return (
                          <TableCell key={index}>
                            <input
                              type="text"
                              className="w-16 border rounded px-2 py-1 text-right"
                              value={value || ""}
                              onChange={(e) =>
                                updateServiceQuantity(row.id, e.target.value)
                              }
                            />
                          </TableCell>
                        );
                      }

                      if (col.key === "valorUnit") {
                        value = FormatCurrency(value);
                      }

                      return (
                        <TableCell key={index} className="text-nowrap">
                          {value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box className="flex justify-end mt-4">
          <Button
            variant="contained"
            startIcon={<PlusIcon className="w-5 h-5 text-white" />}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-4"
            onClick={applyAdditional}
            disabled={isDisabled || !isDisableAfterChangeData}
          >
            APLICAR ADICIONAL
          </Button>

          <Button
            variant="contained"
            startIcon={<PlusIcon className="w-5 h-5 text-white" />}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={() => setOpenTeamsModal(true)}
            disabled={!canSchedule}
          >
            PROGRAMAR SERVIÇOS
          </Button>
        </Box>
      </Paper>

      <TeamModal
        open={openTeamsModal}
        onClose={() => setOpenTeamsModal(false)}
        onConfirm={handleTeamConfirm}
        teams={teams}
      />
    </>
  );
}
