"use client";

import { useState, useCallback } from "react";

import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import { PlusIcon } from "@heroicons/react/20/solid";
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
            const { key, ...other } = props;
            return (
              <li key={key} {...other}>
                <div className="flex flex-col">
                  <strong>{s.texto_breve}</strong>
                  <small>Material: {s.material}</small>
                  <small>Preço: {s.preco}</small>
                  <small>Contrato: {s.contrato}</small>
                  <small>Unidade: {s.medida}</small>
                  <small>Turma: {s.turmas.turma}</small>
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
      <Button
        fullWidth
        disabled={loading}
        onClick={handleSubmit}
        variant="contained"
        className="bg-blue-600 text-white"
      >
        <PlusIcon className="w-5 h-5 mr-1" />
        {loading ? "Adicionando..." : "Adicionar Serviço"}
      </Button>
    </div>
  );
}
