"use client";

import { SelectComponent } from "@/components/common/Select";
import { useUser } from "@/contexts/userContext";
import { ReactNode, useMemo } from "react";
import DataItem from "./dataItem";

interface typeData {
  id_turma: string;
  id_status: number;
  data_empreitamento: string | null;
}

interface EditableColumnProps {
  data: typeData;
  feasibilityApprove: boolean;
  feasibilitySubmissionDate: Date | null;
  options: {
    parceira: { id: number; turma: string }[];
    status: { id: number; status: string }[];
  };
  onHandleChange: (field: string, value: string) => void;
  EditSuspension?: ReactNode;
}

const statusOrder = [
  "EM EMPREITAMENTO",
  "AGUARDANDO VIABILIDADE",
  "VIABILIDADE EM APROVAÇÃO",
  "AGUARDANDO PROGRAMAÇÃO",
  "AGUARDANDO VALIDAÇÃO EDP",
  "EM PROGRAMAÇÃO",
  "PROGRAMADO",
  "EXECUTADA",
  "CANCELADA",
  "SUSPENSA",
  "REPROGRAMAR",
];

const ALLOWED_STATUS_BY_CURRENT: Record<number, number[]> = {
  4: [42, 45, 4],
  42: [42, 45, 4, 3],
};

export const EditableColumn = ({
  data,
  feasibilitySubmissionDate,
  feasibilityApprove,
  options,
  onHandleChange,
  EditSuspension,
}: EditableColumnProps) => {
  const { permissions } = useUser();

  const getFilteredAndSortedStatus = useMemo(() => {
    const allowedIds =
      data.data_empreitamento === null
        ? ALLOWED_STATUS_BY_CURRENT[data.id_status]
        : undefined;

    const filtered = allowedIds
      ? options.status.filter((item) => allowedIds.includes(item.id))
      : options.status.filter((item) => item.id !== 42);

    return filtered.sort(
      (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
    );
  }, [data.data_empreitamento, data.id_status, options.status]);

  const havePermission =
    permissions?.tipo_usuario === "PARCEIRA" || !permissions?.permissao_edicao;

  const disableWhenStatusisAwaitingFeasibility =
    !feasibilitySubmissionDate && data.id_status === 45;

  const disableWhenStatusIsPendingApproval =
    data.id_status === 46 &&
    Boolean(feasibilitySubmissionDate) &&
    !feasibilityApprove;

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
        menuItems={getFilteredAndSortedStatus}
        selectedItem={data.id_status?.toString() || "1"}
        setSelectedItem={(value) => onHandleChange("id_status", value)}
        valueKey="id"
        displayKey="status"
        disabled={
          havePermission ||
          disableWhenStatusisAwaitingFeasibility ||
          disableWhenStatusIsPendingApproval
        }
        editButton={EditSuspension}
      />

      <DataItem
        label="Data empreitamento"
        value={data.data_empreitamento || ""}
        isEdit={true}
        onEdit={(value) => onHandleChange("data_empreitamento", value)}
        disabled={data.id_status !== 42}
      />
    </>
  );
};
