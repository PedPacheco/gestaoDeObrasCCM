"use client";

import { useUser } from "@/contexts/userContext";
import DataItem from "./dataItem";
import { SelectComponent } from "@/components/common/Select";
import { ReactNode } from "react";

interface typeData {
  id_turma: string;
  id_status: number;
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
  EditSuspension?: ReactNode;
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
  EditSuspension,
}: EditableColumnProps) => {
  const { permissions } = useUser();

  const sortedStatus = options.status.sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
  );

  const havePermission =
    permissions?.tipo_usuario === "PARCEIRA" || !permissions?.permissao_edicao;

  return (
    <>
      <SelectComponent
        label="Parceira"
        menuItems={options.parceira}
        selectedItem={data.id_turma || "1"}
        setSelectedItem={(value) => onHandleChange("id_turma", value)}
        valueKey="id"
        displayKey="turma"
        disabled={havePermission}
      />

      <SelectComponent
        label="Status da Obra"
        menuItems={sortedStatus}
        selectedItem={data.id_status?.toString() || "1"}
        setSelectedItem={(value) => onHandleChange("id_status", value)}
        valueKey="id"
        displayKey="status"
        disabled={havePermission}
        editButton={EditSuspension}
      />

      <DataItem
        label="Data empreitamento"
        value={data.data_empreitamento || ""}
        isEdit={true}
        onEdit={(value) => onHandleChange("data_empreitamento", value)}
        disabled={havePermission}
      />

      <SelectComponent
        label="Tipo ADS"
        menuItems={[
          { tipo: null },
          { tipo: "CONVENCIONAL" },
          { tipo: "PONTO A PONTO" },
        ]}
        selectedItem={data.tipo_ads || ""}
        setSelectedItem={(value) => onHandleChange("tipo_ads", value)}
        valueKey="tipo"
        displayKey="tipo"
        disabled={havePermission}
      />
    </>
  );
};
