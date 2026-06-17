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

import { ServicesContractSelect } from "./servicesContractSelect";

export type ServiceContract = {
  id: number;
  texto_breve: string;
  material: string;
  preco: string;
  contrato: string;
  medida: string;
  turmas: { turma: string };
};

type AddServiceFormState = {
  idService: number | null;
  point: string;
  operation: string;
  qtdePlan: number | null;
};

interface Props {
  idWork: number;
  serviceContractData: ServiceContract[];
  operations: string[];
  points: string[];
  onSubmit: (data: {
    idWork: number;
    idService: number;
    point: string;
    operation: string;
    qtdePlan: number;
  }) => Promise<void>;
}

export function AddServiceForm({
  idWork,
  serviceContractData,
  operations,
  points,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<AddServiceFormState>({
    idService: null,
    point: "",
    operation: "",
    qtdePlan: null,
  });

  const [loading, setLoading] = useState(false);

  /**
   * Atualiza estado de forma segura e imutável
   */
  const updateField = useCallback(
    <K extends keyof AddServiceFormState>(
      field: K,
      value: AddServiceFormState[K],
    ) => {
      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  /**
   * Submit handler otimizado
   */
  const handleSubmit = async () => {
    try {
      setLoading(true);

      await onSubmit({
        idWork,
        idService: form.idService!,
        point: form.point,
        operation: form.operation,
        qtdePlan: form.qtdePlan!,
      });

      // reset form
      setForm({
        idService: null,
        point: "",
        operation: "",
        qtdePlan: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* SERVICE SELECT */}
      <FormControl fullWidth size="small">
        <Autocomplete<ServiceContract>
          options={serviceContractData}
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

      {/* POINT + OPERATION */}
      <div className="grid grid-cols-3 gap-4">
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

        <TextField
          label="Qtde Plan"
          type="number"
          size="small"
          value={form.qtdePlan ?? ""}
          onChange={(e) => updateField("qtdePlan", Number(e.target.value))}
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
