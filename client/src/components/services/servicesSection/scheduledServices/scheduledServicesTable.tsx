import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import {
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
} from "@mui/material";

import { ScheduledServiceState } from "./scheduledServices";
import { TableFilter } from "../servicesFilters";
import { FormatCurrency } from "@/utils/formatValue";
import { SERVICE_OPERATIONS } from "@/constants/services/services";

const SERVICE_COLUMNS = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "numero_operacao", label: "N° OPERAÇÃO" },
  { key: "descricao_operacao", label: "DESCRIÇÃO OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "equipe", label: "EQUIPE" },
  { key: "perfil", label: "PERFIL" },
  { key: "encarregado", label: "ENCARREGADO" },
  { key: "dataProgramada", label: "DATA PROG" },
  { key: "qtdePlanejada", label: "PLAN", align: "right" as const },
  { key: "viabilizado", label: "VIABILIZADO", align: "right" as const },
  { key: "qtdeAdicional", label: "ADICIONAL", align: "right" as const },
  { key: "qtdeProgramada", label: "PROG", align: "right" as const },
  { key: "qtdeRealizada", label: "REAL", align: "right" as const },
  { key: "valorUnit", label: "VALOR UNIT", align: "right" as const },
  { key: "valorTotal", label: "VALOR TOTAL", align: "right" as const },
  { key: "status", label: "STATUS" },
] as const;

const SUMMABLE_COLUMNS = new Set([
  "qtdePlanejada",
  "viabilizado",
  "qtdeAdicional",
  "qtdeProgramada",
  "qtdeRealizada",
  "valorUnit",
  "valorTotal",
]);

const CURRENCY_COLUMNS = new Set(["valorUnit", "valorTotal"]);

interface ScheduleServicesTableProps {
  scheduledServicesData: any[];
  scheduledServices: ScheduledServiceState[];
  setScheduledServices: (service: any) => any;
  clearValidation: () => void;
}

export function ScheduledServicesTable({
  scheduledServicesData,
  scheduledServices,
  setScheduledServices,
  clearValidation,
}: ScheduleServicesTableProps) {
  const [filteredServicesData, setFilteredServicesData] = useState<any[]>([]);

  useEffect(() => {
    setFilteredServicesData(scheduledServicesData);
  }, [scheduledServicesData]);

  const formatCellValue = (key: string, value: any) => {
    if (key === "dataProgramada") {
      return dayjs(value).utc().format("DD/MM/YYYY");
    }

    if (["valorUnit", "valorTotal"].includes(key)) {
      return FormatCurrency(value);
    }

    return value;
  };

  const totals = useMemo(() => {
    const sums: Record<string, number> = {};

    for (const col of SUMMABLE_COLUMNS) {
      sums[col] = 0;
    }

    for (const row of filteredServicesData) {
      const currentService = scheduledServices.find((s) => s.id === row.id);

      for (const col of SUMMABLE_COLUMNS) {
        if (col === "qtdeRealizada") {
          // Usa o valor do state (editável pelo utilizador)
          const val = Number(currentService?.qtdeRealizada) || 0;
          sums[col] += val;
        } else {
          sums[col] += Number(row[col]) || 0;
        }
      }
    }

    return sums;
  }, [filteredServicesData, scheduledServices]);

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
            options: Array.from(
              new Set(scheduledServicesData.map((item) => item.textoBreve)),
            ),
          },
          {
            label: "FAMÍLIA",
            field: "descricao_operacao",
            options: Array.from(
              new Set(
                scheduledServicesData.map((item) => item.descricao_operacao),
              ),
            ),
            width: "w-80",
          },
          {
            label: "ENCARREGADO",
            field: "encarregado",
            options: Array.from(
              new Set(scheduledServicesData.map((item) => item.encarregado)),
            ),
            width: "w-72",
          },
          {
            label: "OPERAÇÃO",
            field: "operacao",
            options: SERVICE_OPERATIONS,
            width: "w-72",
          },
          {
            label: "EQUIPE",
            field: "perfil",
            options: Array.from(
              new Set(scheduledServicesData.map((item) => item.perfil)),
            ),
            width: "w-44",
          },
          {
            label: "PONTO",
            field: "ponto",
            options: Array.from(
              new Set(scheduledServicesData.map((item) => item.ponto)),
            ),
            width: "w-44",
          },
        ]}
        onFilter={setFilteredServicesData}
      />
      <TableContainer component={Paper} sx={{ height: 620 }}>
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

          <TableFooter>
            <TableRow className="bg-zinc-100 sticky bottom-0 z-10">
              {/* Célula do checkbox — vazia, mantém alinhamento */}
              <TableCell className="border-l-4 border-l-transparent" />

              {SERVICE_COLUMNS.map((col, index) => {
                if (index === 0) {
                  return (
                    <TableCell
                      key={index}
                      className="text-nowrap text-sm font-bold text-zinc-700"
                    >
                      TOTAL
                    </TableCell>
                  );
                }

                if (SUMMABLE_COLUMNS.has(col.key)) {
                  return (
                    <TableCell
                      key={index}
                      className="text-nowrap text-sm font-bold text-zinc-700"
                    >
                      {CURRENCY_COLUMNS.has(col.key)
                        ? FormatCurrency(totals[col.key])
                        : totals[col.key].toLocaleString("pt-BR")}
                    </TableCell>
                  );
                }

                return <TableCell key={index} />;
              })}
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </>
  );
}
