"use client";

import { useCallback, useMemo, useState } from "react";

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
import { SERVICE_OPERATIONS } from "@/constants/services/services";
import { MaterialData, ServiceContract } from "./addServiceAccordion";

type SelectOption = {
  id: number;
  tipo: "SERVICO" | "MATERIAL";
  descricao: string;
  preco: number;
  unidade?: string;
  contrato?: string;
  turma?: string;
};

export type AddFamilyFormState = {
  idService: number | null;
  point: string;
  operation: string;
  operationDescription: string;
  quantity: number;
  type: "M" | "S" | null;
};

const INITIAL_FORM: AddFamilyFormState = {
  idService: null,
  point: "",
  operation: "",
  operationDescription: "",
  quantity: 0,
  type: null,
};

interface Props {
  idWork: number;
  serviceContractData: ServiceContract[];
  materialData: MaterialData[];
  points: string[];
  operationsDescription: string[];
  onSubmit: (data: {
    idWork: number;
    idService: number;
    point: string;
    operation: string;
    operationDescription: string;
    quantity: number;
    type: "M" | "S";
  }) => Promise<void>;
}

export function AddFamilyForm({
  idWork,
  serviceContractData,
  materialData,
  points,
  operationsDescription,
  onSubmit,
}: Props) {
  const options = useMemo<SelectOption[]>(() => {
    const services = serviceContractData.map((service) => ({
      id: service.id,
      tipo: "SERVICO" as const,
      descricao: service.texto_breve,
      preco: Number(service.preco),
      unidade: service.medida,
      contrato: service.contrato,
      turma: service.turmas?.turma,
    }));

    const materials = materialData.map((material) => ({
      id: material.id,
      tipo: "MATERIAL" as const,
      descricao: material.descricao,
      preco: material.preco,
      unidade: material.unidade,
    }));

    return [...services, ...materials];
  }, [serviceContractData, materialData]);

  const [form, setForm] = useState<AddFamilyFormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback(
    <K extends keyof AddFamilyFormState>(
      field: K,
      value: AddFamilyFormState[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.id === form.idService) ?? null,
    [options, form.idService],
  );

  const isValid =
    form.idService !== null &&
    form.point !== "" &&
    form.operation !== "" &&
    form.operationDescription !== "" &&
    form.quantity > 0 &&
    form.type !== null;

  const handleSubmit = async () => {
    if (!isValid || form.idService === null || form.type === null) return;

    try {
      setLoading(true);
      setError(null);

      await onSubmit({
        idWork,
        idService: form.idService,
        point: form.point,
        operation: form.operation,
        operationDescription: form.operationDescription,
        quantity: form.quantity,
        type: form.type,
      });

      setForm(INITIAL_FORM);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível adicionar o serviço. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateServiceOrMaterial = (
    type?: "SERVICO" | "MATERIAL",
    id?: number,
  ) => {
    if (type === null) {
      updateField("type", null);
      updateField("idService", null);
      return;
    }

    updateField("type", type === "SERVICO" ? "S" : "M");

    updateField("idService", id ?? null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <FormControl fullWidth size="small" className="col-span-2">
          <Autocomplete<SelectOption>
            options={options}
            value={selectedOption}
            groupBy={(option) =>
              option.tipo === "SERVICO" ? "Serviços" : "Materiais"
            }
            getOptionLabel={(option) => option.descricao}
            getOptionKey={(option) => `${option.tipo}-${option.id}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onChange={(_, value) =>
              updateServiceOrMaterial(value?.tipo, value?.id)
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Selecionar Serviço ou Material"
                size="small"
              />
            )}
            renderGroup={(params) => (
              <li key={params.key}>
                <div className="sticky top-0 z-10 bg-slate-100 px-3 py-2 text-xs font-bold uppercase text-slate-700 border-b">
                  {params.group}
                </div>
                <ul>{params.children}</ul> 
              </li>
            )}
            renderOption={(props, option) => {
              const { key, ...rest } = props;

              return (
                <li
                  key={key}
                  {...rest}
                  className="!mx-2 !rounded-lg !border !border-gray-200 !p-3 transition-all hover:!bg-blue-50 hover:!border-blue-300"
                >
                  <div className="flex w-full flex-col gap-1">
                    <span className="text-sm font-semibold text-gray-800">
                      {option.descricao}
                    </span>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {FormatCurrency(Number(option.preco))}
                      </span>

                      {option.tipo === "SERVICO" && option.contrato && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {option.contrato}
                        </span>
                      )}

                      {option.tipo === "SERVICO" && option.turma && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                          {option.turma}
                        </span>
                      )}
                    </div>

                    {option.unidade && (
                      <span className="text-xs text-gray-500">
                        Unidade: {option.unidade}
                      </span>
                    )}
                  </div>
                </li>
              );
            }}
          />
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Ponto</InputLabel>

          <Select
            value={form.point}
            label="Ponto"
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
            label="Operação"
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
          <InputLabel>Família</InputLabel>
          <Select
            value={form.operationDescription}
            label="Família"
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
          onChange={(e) => {
            const parsed = Number(e.target.value);
            updateField("quantity", Number.isNaN(parsed) ? 0 : parsed);
          }}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <ButtonComponent
        text={loading ? "Adicionando..." : "Adicionar Serviço"}
        fullWidth
        styled="!h-9"
        disabled={loading || !isValid}
        onClick={handleSubmit}
        startIcon={<PlusIcon className="w-5 h-5 mr-1" />}
      />
    </div>
  );
}
