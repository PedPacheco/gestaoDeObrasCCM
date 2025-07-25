"use client";

import dynamic from "next/dynamic";

import DataItem from "./dataItem";
import { SelectComponent } from "@/components/common/Select";

// const SelectComponent = dynamic(
//   () => import("../../common/Select").then((mod) => mod.SelectComponent),
//   { ssr: false }
// );

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

export const EditableColumn = ({
  data,
  options,
  onHandleChange,
}: EditableColumnProps) => {
  return (
    <>
      <SelectComponent
        label="Parceira"
        menuItems={options.parceira}
        selectedItem={data.id_turma || "1"}
        setSelectedItem={(value) => onHandleChange("id_turma", value)}
        valueKey="id"
        displayKey="turma"
      />

      <SelectComponent
        label="Status"
        menuItems={options.status}
        selectedItem={data.id_status || "1"}
        setSelectedItem={(value) => onHandleChange("id_status", value)}
        valueKey="id"
        displayKey="status"
      />

      <DataItem
        label="Data empreitamento"
        value={data.data_empreitamento || ""}
        isEdit={true}
        onEdit={(value) => onHandleChange("data_empreitamento", value)}
      />

      <SelectComponent
        label="Tipo ADS"
        menuItems={[{ tipo: "CONVENCIONAL" }, { tipo: "PONTO A PONTO" }]}
        selectedItem={data.tipo_ads || ""}
        setSelectedItem={(value) => onHandleChange("tipo_ads", value)}
        valueKey="tipo"
        displayKey="tipo"
      />
    </>
  );
};
