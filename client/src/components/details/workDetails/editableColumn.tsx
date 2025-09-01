"use client";

import { useUser } from "@/contexts/userContext";
import DataItem from "./dataItem";
import { SelectComponent } from "@/components/common/Select";

interface typeData {
  id_turma: string;
  id_status: string;
  data_empreitamento: string;
  tipo_ads: string;
}

interface EditableColumnProps {
  data: typeData;
  options: {
    parceira: { id: number; turma: string }[];
    status: { id: number; status: string }[];
  };
  onHandleChange: (field: string, value: string) => void;
}

const statusOrder = [
  "EM EMPREITAMENTO",
  "AGUARDANDO PROGRAMAÇÃO",
  "AGUARDANDO VALIDAÇÃO EDP",
  "EM PROGRAMAÇÃO",
  "PROGRAMADO",
  "EXECUTADA",
  "CANCELADA",
  "SUSPENSA",
  "REPROGRAMAR",
];

export const EditableColumn = ({
  data,
  options,
  onHandleChange,
}: EditableColumnProps) => {
  const { permissions = { permissao_visualizacao: "total" } } = useUser();

  const sortedStatus = options.status.sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  return (
    <>
      <SelectComponent
        label="Parceira"
        menuItems={options.parceira}
        selectedItem={data.id_turma || "1"}
        setSelectedItem={(value) => onHandleChange("id_turma", value)}
        valueKey="id"
        displayKey="turma"
        disabled={permissions?.permissao_visualizacao === "parcial"}
      />

      <SelectComponent
        label="Status da Obra"
        menuItems={sortedStatus}
        selectedItem={data.id_status || "1"}
        setSelectedItem={(value) => onHandleChange("id_status", value)}
        valueKey="id"
        displayKey="status"
        disabled={permissions?.permissao_visualizacao === "parcial"}
      />

      <DataItem
        label="Data empreitamento"
        value={data.data_empreitamento || ""}
        isEdit={true}
        onEdit={(value) => onHandleChange("data_empreitamento", value)}
        disabled={permissions?.permissao_visualizacao === "parcial"}
      />

      <SelectComponent
        label="Tipo ADS"
        menuItems={[
          { tipo: "" },
          { tipo: "CONVENCIONAL" },
          { tipo: "PONTO A PONTO" },
        ]}
        selectedItem={data.tipo_ads || ""}
        setSelectedItem={(value) => onHandleChange("tipo_ads", value)}
        valueKey="tipo"
        displayKey="tipo"
        disabled={permissions?.permissao_visualizacao === "parcial"}
      />
    </>
  );
};
