import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import {
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { ScheduledServiceState } from "./scheduledServices";
import { TableFilter } from "../servicesFilters";
import { FormatCurrency } from "@/utils/formatValue";

const SERVICE_COLUMNS = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "equipe", label: "EQUIPE" },
  { key: "perfil", label: "PERFIL" },
  { key: "encarregado", label: "ENCARREGADO" },
  { key: "dataProgramada", label: "DATA PROG" },
  { key: "qtdePlanejada", label: "PLAN", align: "right" as const },
  { key: "qtdeAdicional", label: "ADICIONAL", align: "right" as const },
  { key: "qtdeProgramada", label: "PROG", align: "right" as const },
  { key: "qtdeRealizada", label: "REAL", align: "right" as const },
  { key: "valorUnit", label: "VALOR UNIT", align: "right" as const },
  { key: "status", label: "STATUS" },
] as const;

interface ScheduleServicesTableProps {
  scheduledServicesData: any[];
  scheduledServices: ScheduledServiceState[];
  setScheduledServices: (service: any) => any;
  clearValidation: () => void;
  points: string[];
  operations: string[];
  services: any[];
}

export function ScheduledServicesTable({
  scheduledServicesData,
  scheduledServices,
  setScheduledServices,
  clearValidation,
  operations,
  points,
  services,
}: ScheduleServicesTableProps) {
  const [filteredServicesData, setFilteredServicesData] = useState<any[]>([]);

  useEffect(() => {
    setFilteredServicesData(scheduledServicesData);
  }, [scheduledServicesData]);

  const formatCellValue = (key: string, value: any) => {
    if (key === "dataProgramada") {
      return dayjs(value).utc().format("DD/MM/YYYY");
    }

    if (key === "valorUnit") {
      return FormatCurrency(value);
    }

    return value;
  };

  const { allSelected, indeterminate } = useMemo(() => {
    const allChecked = scheduledServices.every((s) => s.selected);
    const someChecked = scheduledServices.some((s) => s.selected);
    return {
      allSelected: allChecked,
      indeterminate: someChecked && !allChecked,
    };
  }, [scheduledServices]);

  const updateServiceQuantity = (id: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    setScheduledServices((prev: any) =>
      prev.map((item: ScheduledServiceState) =>
        item.id === id
          ? { ...item, qtdeRealizada: value === "" ? null : value }
          : item,
      ),
    );

    clearValidation();
  };

  const toggleAllServices = (checked: boolean) => {
    setScheduledServices((prev: any) =>
      prev.map((item: ScheduledServiceState) => ({
        ...item,
        selected: checked,
      })),
    );
  };

  const toggleService = (id: number, checked: boolean) => {
    setScheduledServices((prev: any) =>
      prev.map((item: ScheduledServiceState) =>
        item.id === id ? { ...item, selected: checked } : item,
      ),
    );
  };

  const getStatusBadge = (
    status: "completo" | "reprogramar" | "sem-realizacao" | null | undefined,
  ) => {
    if (!status) return null;

    const badges = {
      completo: {
        icon: "✓",
        text: "Completo",
        className: "bg-green-300 text-green-800 border border-green-300",
      },
      reprogramar: {
        icon: "⚠",
        text: "Reprogramar",
        className: "bg-red-300 text-red-800 border border-red-300",
      },
      "sem-realizacao": {
        icon: "⊘",
        text: "Sem Realização",
        className:
          "bg-yellow-300 text-yellow-800 border border-yellow-300 text-nowrap",
      },
    };

    const badge = badges[status];

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.className}`}
      >
        <span>{badge.icon}</span>
        <span>{badge.text}</span>
      </span>
    );
  };

  const getRowClassName = (
    status: "completo" | "reprogramar" | "sem-realizacao" | null | undefined,
  ) => {
    if (!status)
      return {
        border: "",
        bg: "",
      };

    const classes = {
      completo: {
        border: "border-l-green-500 border-solid",
        bg: "bg-green-200",
      },
      reprogramar: {
        border: "border-l-red-500 border-solid",
        bg: "bg-red-200",
      },
      "sem-realizacao": {
        border: "border-l-yellow-500 border-solid",
        bg: "bg-yellow-200",
      },
    };

    return classes[status];
  };

  return (
    <>
      <TableFilter
        data={scheduledServicesData}
        fields={[
          {
            label: "SERVIÇO",
            field: "textoBreve",
            options: services.filter((item) => {
              return scheduledServicesData.some(
                (service) => service.textoBreve === item,
              );
            }),
          },
          {
            label: "OPERAÇÃO",
            field: "operacao",
            options: operations.filter((item) => {
              return scheduledServicesData.some(
                (service) => service.operacao === item,
              );
            }),
            width: "w-1/4",
          },
          {
            label: "PONTO",
            field: "ponto",
            options: points.filter((item) => {
              return scheduledServicesData.some(
                (service) => service.ponto === item,
              );
            }),
            width: "w-44",
          },
        ]}
        onFilter={setFilteredServicesData}
      />
      <TableContainer component={Paper} sx={{ height: 460 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={indeterminate}
                  onChange={(e) => toggleAllServices(e.target.checked)}
                />
              </TableCell>
              {SERVICE_COLUMNS.map((header, index) => (
                <TableCell className="text-nowrap max-h-5" key={index}>
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredServicesData.map((row) => {
              const currentService = scheduledServices.find(
                (s) => s.id === row.id,
              );

              if (!currentService) return;

              const rowStyle = getRowClassName(currentService.validationStatus);

              return (
                <TableRow key={row.id} hover className={rowStyle?.bg}>
                  <TableCell
                    padding="checkbox"
                    className={`border-l-4 ${rowStyle?.border}`}
                  >
                    <Checkbox
                      checked={currentService?.selected}
                      onChange={(e) => toggleService(row.id, e.target.checked)}
                    />
                  </TableCell>

                  {SERVICE_COLUMNS.map((col, index) => {
                    if (col.key === "qtdeRealizada") {
                      return (
                        <TableCell key={index}>
                          <input
                            type="text"
                            className="w-16 border rounded px-2 py-1 text-right"
                            value={currentService?.qtdeRealizada ?? ""}
                            onChange={(e) =>
                              updateServiceQuantity(row.id, e.target.value)
                            }
                          />
                        </TableCell>
                      );
                    }

                    if (col.key === "status") {
                      return (
                        <TableCell key={index}>
                          {getStatusBadge(currentService.validationStatus)}
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell key={index} className="text-nowrap max-h-5">
                        {formatCellValue(col.key, row[col.key])}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
