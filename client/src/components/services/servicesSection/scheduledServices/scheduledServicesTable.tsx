import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";

import {
  Checkbox,
  FormControl,
  MenuItem,
  Paper,
  Select,
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
import {
  MATERIAL_OR_SERVICE_OPTIONS,
  SERVICE_OPERATIONS,
} from "@/constants/services/services";
import { useServicesFilters } from "@/hooks/services/useServicesFilters";

const SERVICE_COLUMNS = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "numeroOperacao", label: "N° DA OPERAÇÃO" },
  { key: "descricaoOperacao", label: "DESCRIÇÃO DA OPERAÇÃO" },
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
  const {
    materialOrService,
    setMaterialOrService,
    setTableFilters,
    filterOptions,
    applyFilters,
  } = useServicesFilters(scheduledServicesData);

  const filteredServicesData = applyFilters(scheduledServicesData);

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
    if (!/^\d*([.]\d*)?$/.test(value)) return;

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
    const visibleIds = new Set(filteredServicesData.map((item) => item.id));

    setScheduledServices((prev: ScheduledServiceState[]) =>
      prev.map((item) =>
        visibleIds.has(item.id) ? { ...item, selected: checked } : item,
      ),
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
        bg: "bg-green-100 hover:bg-green-200 transition-colors",
      },
      reprogramar: {
        border: "border-l-red-500 border-solid",
        bg: "bg-red-100 hover:bg-red-200 transition-colors",
      },
      "sem-realizacao": {
        border: "border-l-yellow-500 border-solid",
        bg: "bg-yellow-100 hover:bg-yellow-200 transition-colors",
      },
    };

    return classes[status];
  };

  return (
    <>
      <TableFilter
        fields={[
          {
            label: "Serviço/Material",
            field: "textoBreve",
            options: filterOptions.textoBreve,
          },
          {
            label: "Família",
            field: "descricaoOperacao",
            options: filterOptions.descricaoOperacao,
            width: "w-80",
          },
          {
            label: "Encarregado",
            field: "encarregado",
            options: filterOptions.encarregado,
            width: "w-72",
          },
          {
            label: "Operação",
            field: "operacao",
            options: SERVICE_OPERATIONS,
            width: "w-72",
          },
          {
            label: "Equipe",
            field: "perfil",
            options: filterOptions.equipe,
            width: "w-44",
          },
          {
            label: "Ponto",
            field: "ponto",
            options: filterOptions.ponto,
            width: "w-44",
          },
        ]}
        onFilter={setTableFilters}
        extraFilters={
          <div className="min-w-[160px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Tipo
            </label>
            <FormControl fullWidth size="small">
              <Select
                value={materialOrService}
                onChange={(e) => setMaterialOrService(e.target.value)}
                className="bg-white rounded-lg h-[38px]"
              >
                {MATERIAL_OR_SERVICE_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        }
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
                <TableRow key={row.id} className={rowStyle?.bg}>
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
