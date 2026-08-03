"use client";

import clsx from "clsx";
import { useCallback, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { FormatCurrency } from "@/utils/formatValue";
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  Autocomplete,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { ServicesContractSelect } from "../services/servicesSection/servicesContractSelect";
import { AddMaterialOrServiceFormState } from "./addServiceAccordion";

interface MaterialData {
  id: number;
  codigo: string;
  descricao: string;
  unidade: string;
  preco: number;
}

interface Props {
  idWork: number;
  materialData: MaterialData[];
  operations: string[];
  points: string[];
  operationsNumber: string[];
  operationsDescription: string[];
  onSubmit: (data: {
    idWork: number;
    idService: number;
    point: string;
    operation: string;
    operationNumber: string;
    operationDescription: string;
  }) => Promise<void>;
}

export function AddMaterialForm({
  idWork,
  materialData,
  operations,
  points,
  operationsDescription,
  operationsNumber,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<AddMaterialOrServiceFormState>({
    idService: null,
    point: "",
    operation: "",
    operationNumber: "",
    operationDescription: "",
  });

  const [loading, setLoading] = useState(false);

  const updateField = useCallback(
    <K extends keyof AddMaterialOrServiceFormState>(
      field: K,
      value: AddMaterialOrServiceFormState[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);

      await onSubmit({
        idWork,
        idService: form.idService!,
        point: form.point,
        operation: form.operation,
        operationNumber: form.operationNumber,
        operationDescription: form.operationDescription,
      });

      // reset form
      setForm({
        idService: null,
        point: "",
        operation: "",
        operationNumber: "",
        operationDescription: "",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* SERVICE SELECT */}
      <div className="grid grid-cols-4 gap-4">
        <FormControl fullWidth size="small" className="col-span-2">
          <Autocomplete<MaterialData>
            options={materialData}
            getOptionLabel={(s) => s.descricao}
            ListboxComponent={ServicesContractSelect}
            value={materialData.find((m) => m.id === form.idService) ?? null}
            renderOption={(props, s) => {
              const { key, className, ...other } = props;
              return (
                <li
                  key={key}
                  {...other}
                  className={clsx(
                    className,
                    "!mx-2 !rounded-lg !border !border-gray-200 !p-3 transition-all hover:!bg-blue-50 hover:!border-blue-300",
                  )}
                >
                  <div className="flex w-full flex-col">
                    {/* Título */}
                    <span className="text-sm font-semibold text-gray-800">
                      {s.descricao}
                    </span>

                    {/* Linha de detalhes */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        💲 {FormatCurrency(Number(s.preco))}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        📄 {s.codigo}
                      </span>
                    </div>

                    {/* Info secundária */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="text-gray-300">|</span>
                      <span>
                        <strong className="text-gray-600">Unidade:</strong>{" "}
                        {s.unidade}
                      </span>
                    </div>
                  </div>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Selecionar material" size="small" />
            )}
            onChange={(_, value) =>
              updateField("idService", value ? value.id : null)
            }
          />
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Ponto</InputLabel>

          <Select
            value={form.point}
            onChange={(e) => updateField("point", e.target.value)}
          >
            {points.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Operação</InputLabel>

          <Select
            value={form.operation}
            onChange={(e) => updateField("operation", e.target.value)}
          >
            {operations.map((op) => (
              <MenuItem key={op} value={op}>
                {op}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormControl fullWidth size="small">
          <InputLabel>N° Operação</InputLabel>
          <Select
            value={form.operationNumber}
            onChange={(e) => updateField("operationNumber", e.target.value)}
          >
            {operationsNumber.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Descrição Operação</InputLabel>
          <Select
            value={form.operationDescription}
            onChange={(e) =>
              updateField("operationDescription", e.target.value)
            }
          >
            {operationsDescription.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      {/* SUBMIT */}
      <ButtonComponent
        text={loading ? "Adicionando..." : "Adicionar Material"}
        fullWidth
        styled="!h-9"
        disabled={loading}
        onClick={handleSubmit}
        startIcon={<PlusIcon className="w-5 h-5 mr-1" />}
      />
    </div>
  );
}
