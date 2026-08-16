"use client";

import clsx from "clsx";
import { useCallback, useState } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { FormatCurrency } from "@/utils/formatValue";
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  Autocomplete,
  createFilterOptions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { ServicesContractSelect } from "../services/servicesSection/servicesContractSelect";
import {
  AddMaterialOrServiceFormState,
  ServiceContract,
} from "./addServiceAccordion";
import { SERVICE_OPERATIONS } from "@/constants/services/services";

interface Props {
  idWork: number;
  serviceContractData: ServiceContract[];
  points: string[];
  operationsDescription: string[];
  onSubmit: (data: {
    idWork: number;
    idService: number;
    point: string;
    operation: string;
    operationDescription: string;
    quantity: number;
  }) => Promise<void>;
}

export function AddServiceForm({
  idWork,
  serviceContractData,
  points,
  operationsDescription,
  onSubmit,
}: Props) {
  const filterOptions = createFilterOptions<ServiceContract>({
    stringify: (option) => `${option.texto_breve} ${option.material}`,
  });

  const [form, setForm] = useState<AddMaterialOrServiceFormState>({
    idService: null,
    point: "",
    operation: "",
    operationDescription: "",
    quantity: 0,
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
        operationDescription: form.operationDescription,
        quantity: form.quantity,
      });

      // reset form
      setForm({
        idService: null,
        point: "",
        operation: "",
        operationDescription: "",
        quantity: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <FormControl fullWidth size="small" className="col-span-2">
          <Autocomplete<ServiceContract>
            options={serviceContractData}
            filterOptions={filterOptions}
            getOptionLabel={(s) => s.texto_breve}
            ListboxComponent={ServicesContractSelect}
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
                      {s.texto_breve}
                    </span>

                    {/* Linha de detalhes */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        💲 {FormatCurrency(Number(s.preco))}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        📄 {s.contrato}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                        👥 {s.turmas.turma}
                      </span>
                    </div>

                    {/* Info secundária */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>
                        <strong className="text-gray-600">Material:</strong>{" "}
                        {s.material}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span>
                        <strong className="text-gray-600">Unidade:</strong>{" "}
                        {s.medida}
                      </span>
                    </div>
                  </div>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Selecionar serviço" size="small" />
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
            {SERVICE_OPERATIONS.map((op) => (
              <MenuItem key={op} value={op}>
                {op}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="grid grid-cols-2 gap-4">
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

        <TextField
          fullWidth
          size="small"
          label="Quantidade"
          type="number"
          value={form.quantity}
          onChange={(e) => updateField("quantity", Number(e.target.value))}
        />
      </div>

      {/* SUBMIT */}
      <ButtonComponent
        text={loading ? "Adicionando..." : "Adicionar Serviço"}
        fullWidth
        styled="!h-9"
        disabled={loading}
        onClick={handleSubmit}
        startIcon={<PlusIcon className="w-5 h-5 mr-1" />}
      />
    </div>
  );
}
