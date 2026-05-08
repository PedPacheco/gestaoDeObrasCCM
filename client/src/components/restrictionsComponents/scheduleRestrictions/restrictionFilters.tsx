"use client";

import "dayjs/locale/pt-br";

import dayjs, { Dayjs } from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useEffect, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { Transform } from "@/utils/transform";
import {
  Checkbox,
  Divider,
  InputAdornment,
  FormControl,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { getButtonContent } from "@/utils/getButtonContent";
import { capitalize } from "@/utils/formatValue";
import { DateFilter } from "@/components/common/DateFilter";
import {
  DocumentArrowDownIcon,
  MagnifyingGlassCircleIcon,
} from "@heroicons/react/20/solid";

dayjs.extend(isoWeek);

export default function RestrictionFilters({
  data,
  keyFilters,
  endDate,
  setEndDate,
  setStartDate,
  selectedUser,
  setSelectedUser,
  uniqueNames,
  startDate,
  applyFilters,
  isPending,
  isPublication,
  generateExcel,
}: any) {
  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: keyFilters,
    data: data,
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );
  const [ovnota, setOvnota] = useState("");

  const [statusFilter, setStatusFilter] = useState({
    done: false,
    pending: false,
  });

  // 🔥 carregar filtros salvos
  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems || {});
      setStatusFilter(filters.statusFilter || { done: false, pending: false });
    }
  }, [filters]);

  // 🎯 montar payload padronizado
  function buildParams() {
    const formattedSelectedItems = Transform(selectedItems);

    const status: string[] = [];

    if (statusFilter.done) status.push("done");
    if (statusFilter.pending) status.push("pending");

    return {
      ...formattedSelectedItems,
      dataInicial: startDate ? startDate.format("DD/MM/YYYY") : null,
      dataFinal: endDate ? endDate.format("DD/MM/YYYY") : null,
      ovnota: ovnota,
      status: status.length ? status.join(",") : null,
    };
  }

  function handleApplyFilters() {
    const params = buildParams();

    saveFilters({
      selectedItems,
      statusFilter,
      startDate,
      endDate,
    });

    applyFilters(params);
  }

  function handleGenerateExcel() {
    const params = buildParams();
    generateExcel(params);
  }

  function handleCleaningFilters() {
    setSelectedItems({});
    setStartDate(null);
    setEndDate(null);
    setStatusFilter({ done: false, pending: false });
    setSelectedUser(null);
    setOvnota("");

    clearFilters();

    applyFilters({});
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* GRID */}
      <div
        className={`grid gap-3 items-start
          grid-cols-2
          sm:grid-cols-4
          ${isPublication ? "lg:grid-cols-10" : "lg:grid-cols-8"}
        `}
      >
        {/* Datas */}
        <div className="col-span-2 grid grid-cols-2 gap-2">
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        </div>

        {/* Selects */}
        {Object.entries(data)
          .slice(0, 6)
          .map(([key, value]: any, index) => {
            const valueKey = Object.keys(value[0])[0];
            const displayKey = Object.keys(value[0])[1];

            const filterValue = `${valueKey}${
              key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()
            }`;

            return (
              <MultipleSelectComponent
                key={index}
                label={capitalize(key)}
                menuItems={value || []}
                selectedItem={selectedItems[filterValue]}
                setSelectedItem={(selectedValue) => {
                  setSelectedItems((prev: any) => ({
                    ...prev,
                    [filterValue]: selectedValue,
                  }));
                }}
                valueKey={valueKey}
                displayKey={displayKey}
              />
            );
          })}

        {/* Publicação */}
        {isPublication && (
          <>
            <FormControl size="small" className="w-full pl-4">
              <Select
                value={selectedUser || ""}
                onChange={(e) => setSelectedUser(e.target.value || null)}
                displayEmpty
              >
                <MenuItem value="">Todos</MenuItem>
                {uniqueNames.map((name: string) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="OV / Nota"
              value={ovnota}
              onChange={(e) => setOvnota(e.target.value)}
              className="w-full"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MagnifyingGlassCircleIcon
                      height={16}
                      width={16}
                      className="text-gray-400"
                    />
                  </InputAdornment>
                ),
              }}
            />
          </>
        )}
      </div>

      <Divider className="!my-0.5" />

      {/* ✅ CHECKBOXES NOVOS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={statusFilter.done}
              onChange={() =>
                setStatusFilter((prev) => ({
                  ...prev,
                  done: !prev.done,
                }))
              }
              size="small"
            />
            <span className="text-sm text-gray-700">Concluídas</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer">
            <Checkbox
              checked={statusFilter.pending}
              onChange={() =>
                setStatusFilter((prev) => ({
                  ...prev,
                  pending: !prev.pending,
                }))
              }
              size="small"
            />
            <span className="text-sm text-gray-700">Pendentes</span>
          </label>
        </div>

        {/* BOTÕES */}
        <div className="flex flex-col sm:flex-row gap-3 w-1/3">
          {isPublication && (
            <ButtonComponent
              onClick={handleGenerateExcel}
              text="Exportar"
              styled="flex-1 w-full"
              startIcon={<DocumentArrowDownIcon width={20} height={20} />}
            />
          )}

          <ButtonComponent
            onClick={handleApplyFilters}
            text={getButtonContent(isPending, "Aplicar filtros")}
            styled="flex-1 w-full"
          />

          <ButtonComponent
            onClick={handleCleaningFilters}
            text={getButtonContent(isPending, "Limpar filtros")}
            styled="flex-1 w-full"
          />
        </div>
      </div>
    </div>
  );
}
