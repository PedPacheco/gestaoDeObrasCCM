import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useState } from "react";

import { PlusIcon } from "@heroicons/react/20/solid";
import {
  Box,
  Button,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  performScheduleServices,
  reascheduleServices,
} from "@/actions/services";

dayjs.extend(utc);

interface ScheduledServicesProps {
  scheduledServicesData: any[];
}

interface ScheduledServiceState {
  id: any;
  prog: number;
  qtdeRealizada: string | null;
}

const serviceColumns = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "dataProgramada", label: "DATA PROG" },
  { key: "qtdePlanejada", label: "PLAN", align: "right" },
  { key: "qtdeProgramada", label: "PLAN TOTAL", align: "right" },
  { key: "qtdeRealizada", label: "REAL", align: "right" },
  { key: "dif", label: "DIF" },
  { key: "valorUnit", label: "VALOR UNIT", align: "right" },
  { key: "valorReal", label: "VALOR REAL" },
];

export function ScheduledServices({
  scheduledServicesData,
}: ScheduledServicesProps) {
  const [scheduledServices, setScheduledServices] = useState<
    ScheduledServiceState[]
  >(() =>
    scheduledServicesData.map((item) => ({
      id: item.id,
      prog: item.qtdeProgramada,
      qtdeRealizada: item.qtdeRealizada,
    })),
  );

  const allSelected = scheduledServices.every((s) => s.qtdeRealizada !== null);
  const someSelected = scheduledServices.some((s) => s.qtdeRealizada !== null);
  const indeterminate = someSelected && !allSelected;

  const performServices = async () => {
    // const servicesToPerform = scheduledServices.filter(
    //   (s) => s.qtdeRealizada !== null,
    // );

    const formattedService = scheduledServices.map((item) => ({
      id: item.id,
      qtdeRealizada: item.qtdeRealizada ? Number(item.qtdeRealizada) : null,
    }));

    await performScheduleServices(formattedService);
  };

  const handleReaschduleServices = async () => {
    const servicesForRescheduling = scheduledServices
      .filter((s) => s.qtdeRealizada === null)
      .map((s) => ({ id: s.id }));

    console.log(servicesForRescheduling);

    if (servicesForRescheduling.length === 0) {
      return;
    }

    const result = await reascheduleServices(servicesForRescheduling);

    if (!result.success) {
      console.error(result.error);
      return;
    }

    console.log("Serviços reagendados com sucesso");
  };

  return (
    <Paper className="p-6 min-h-96">
      <Typography className="text-xl font-semibold text-gray-700 mb-2">
        SERVIÇOS PROGRAMADOS
      </Typography>

      <TableContainer component={Paper} sx={{ height: 380 }}>
        <Table stickyHeader size="small" className="text-sm h-full">
          <TableHead className="bg-gray-100">
            <TableRow>
              {/* CHECKBOX GLOBAL */}
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={indeterminate}
                  onChange={(e) => {
                    setScheduledServices((prev) =>
                      prev.map((item) => ({
                        ...item,
                        qtdeRealizada: e.target.checked
                          ? item.prog.toString()
                          : null,
                      })),
                    );
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
            {scheduledServicesData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  Nenhum serviço programado
                </TableCell>
              </TableRow>
            ) : (
              scheduledServicesData.map((row) => {
                const currentService = scheduledServices.find(
                  (s) => s.id === row.id,
                );

                return (
                  <TableRow key={row.id} hover>
                    {/* CHECKBOX POR LINHA */}
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={Boolean(currentService?.qtdeRealizada)}
                        onChange={(e) => {
                          setScheduledServices((prev) =>
                            prev.map((item) =>
                              item.id === row.id
                                ? {
                                    ...item,
                                    qtdeRealizada: e.target.checked
                                      ? item.prog.toString()
                                      : null,
                                  }
                                : item,
                            ),
                          );
                        }}
                      />
                    </TableCell>

                    {serviceColumns.map((col, index) => {
                      let cellValue = row[col.key];

                      if (col.key === "dataProgramada") {
                        cellValue = dayjs(cellValue).utc().format("DD/MM/YYYY");
                      }

                      if (col.key === "qtdeRealizada") {
                        return (
                          <TableCell key={index}>
                            <input
                              type="text"
                              className="w-16 border rounded px-2 py-1 text-right"
                              value={currentService?.qtdeRealizada ?? ""}
                              onChange={(e) => {
                                const raw = e.target.value;

                                if (!/^\d*$/.test(raw)) return;

                                setScheduledServices((prev) =>
                                  prev.map((item) =>
                                    item.id === row.id
                                      ? {
                                          ...item,
                                          qtdeRealizada:
                                            raw === "" ? null : raw,
                                        }
                                      : item,
                                  ),
                                );
                              }}
                            />
                          </TableCell>
                        );
                      }

                      return (
                        <TableCell key={index} className="text-nowrap max-h-9">
                          {cellValue}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="flex justify-end">
        <Box className="flex justify-end mt-4 ml-4">
          <Button
            variant="contained"
            startIcon={<PlusIcon className="w-5 h-5 text-white" />}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={handleReaschduleServices}
          >
            REPRORAMAR SERVIÇOS
          </Button>
        </Box>
        <Box className="flex justify-end mt-4 ml-4">
          <Button
            variant="contained"
            startIcon={<PlusIcon className="w-5 h-5 text-white" />}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={performServices}
          >
            REALIZAR SERVIÇOS
          </Button>
        </Box>
        <Box className="flex justify-end mt-4 ml-4">
          <Button
            variant="contained"
            startIcon={<PlusIcon className="w-5 h-5 text-white" />}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={performServices}
            // disabled={
            //   !scheduledServices.every(
            //     (service) => service.qtdeRealizada !== null,
            //   )
            // }
          >
            FINALIZAR EXECUÇÃO DOS SERVIÇOS
          </Button>
        </Box>
      </div>
    </Paper>
  );
}
