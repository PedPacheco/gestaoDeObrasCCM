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
  InputLabel,
  FormControl,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { getButtonContent } from "@/utils/getButtonContent";
import { capitalize } from "@/utils/formatValue";
import { DateFilter } from "@/components/common/DateFilter";
import { MagnifyingGlassCircleIcon } from "@heroicons/react/20/solid";

dayjs.extend(isoWeek);

interface filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string; id_regional: number }[];
  grupo: { id: string; grupo: string }[];
  restricao: { id: string; restricao: string; tipo_restricao: string };
}

interface ScheduleByDateFiltersProps {
  data: filters;
  keyFilters: string;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
  setStartDate: (date: Dayjs | null) => void;
  setEndDate: (date: Dayjs | null) => void;
  selectedUser: string | null;
  setSelectedUser: (user: string | null) => void;
  uniqueNames: string[];
  applyFilters: (
    params: Record<string, string | boolean | string | null>,
  ) => void;
  isPending: boolean;
  isPublication: boolean;
}

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
}: ScheduleByDateFiltersProps) {
  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: keyFilters,
    data: data,
  });

  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>(
    {},
  );
  const [ovnota, setOvnota] = useState<string>("");
  const [executed, setExecuted] = useState<boolean>(false);

  useEffect(() => {
    if (filters) {
      setSelectedItems(filters.selectedItems);
      setExecuted(filters.executed);
    }
  }, [filters]);

  function handleApplyFilters() {
    saveFilters({ selectedItems, executed, startDate, endDate });

    const formattedSelectedItems = Transform(selectedItems);

    const params = {
      ...formattedSelectedItems,
      dataInicial: startDate ? startDate.format("DD/MM/YYYY") : null,
      dataFinal: endDate ? endDate.format("DD/MM/YYYY") : null,
      executado: executed,
    };

    applyFilters(params);
  }

  function handleCleanigFilters() {
    setSelectedItems({});
    setStartDate(null);
    setEndDate(null);
    setExecuted(false);
    setSelectedUser(null);

    clearFilters();

    applyFilters({
      executado: "false",
    });
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      {/* ── LINHA ÚNICA: Datas + Selects + campos de publicação ──
          Sem isPublication : 8 cols (2 datas + 6 selects)
          Com isPublication : 10 cols (2 datas + 6 selects + usuário + OV/nota) */}
      <div
        className={`grid gap-3 items-start
          grid-cols-2
          sm:grid-cols-4
          ${isPublication ? "lg:grid-cols-10" : "lg:grid-cols-8"}
        `}
      >
        {/* Datas — col-span-2 dividido internamente em 2 */}
        <div className="col-span-2 grid grid-cols-2 gap-2">
          <DateFilter
            startDate={startDate}
            endDate={endDate}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
          />
        </div>

        {/* 6 selects principais */}
        {Object.entries(data)
          .slice(0, 6)
          .map(([key, value], index) => {
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

        {/* Campos exclusivos de publicação — mesma coluna que os selects */}
        {isPublication && (
          <>
            {/* Select usuário */}
            <FormControl size="small" className="w-full pl-4">
              <Select
                value={selectedUser || ""}
                label="Usuário"
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

            {/* Campo OV / Nota */}
            <TextField
              size="small"
              label="OV / Nota"
              value={ovnota}
              onChange={(event) => setOvnota(event.target.value)}
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

      {/* ── Checkbox + Botões ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className="flex items-center gap-1.5 cursor-pointer select-none w-fit">
          <Checkbox
            onChange={() => setExecuted(!executed)}
            checked={executed}
            size="small"
          />
          <span className="text-sm text-gray-700 whitespace-nowrap">
            {isPublication
              ? "Restrições Concluídas"
              : "Programações Executadas"}
          </span>
        </label>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <ButtonComponent
            onClick={handleApplyFilters}
            text={getButtonContent(isPending, "Aplicar filtros")}
            styled="w-full sm:w-auto"
          />
          <ButtonComponent
            onClick={handleCleanigFilters}
            text={getButtonContent(isPending, "Limpar filtros")}
            styled="w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
}
