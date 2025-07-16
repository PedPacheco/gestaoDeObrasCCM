"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import DataItem from "./dataItem";
import { EditableColumn } from "./editableColumn";
import { useRouter } from "next/navigation";
import { updateWork } from "@/actions/updateWork.action";

dayjs.extend(customParseFormat);

interface WorkDetailsProps {
  data: {
    ovnota: string;
    tipos: string;
    municipios: string;
    referencia: string;
    circuitos: string;
    conjunto: string;
    pep: string;
    status_pep: string;
    diagrama: string;
    status_diagrama: string;
    ordem_dci: string;
    status_170: string;
    ordem_dcd: string;
    status_190: string;
    ordem_dca: string;
    status_150: string;
    ordem_dcim: string;
    status_180: string;
    executado: string;
    ano_plan: string;
    empreendimento: string;
    id_status: string;
    id_turma: string;
    status_ov_sap: string;
    tipo_ads: string;
    observ_obra: string;
    id: string;
  };
  formattedData: {
    entrada: string;
    prazo: string;
    prazoFinal: string;
    data_conclusao: string;
    dataEmpreitamento: string;
    backgroundColor: string;
    executadoFormatted: string;
  };
  idWork: number;
  options: any;
}

export function WorkDetails({
  data,
  idWork,
  formattedData,
  options,
}: WorkDetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [editableData, setEditableData] = useState({
    data_empreitamento: formattedData.dataEmpreitamento,
    id_status: data.id_status,
    id_turma: data.id_turma,
    tipo_ads: data.tipo_ads,
  });
  const [changedFields, setChangedFields] =
    useState<Record<string, string | null>>();

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleSubmit = () => {
    startTransition(async () => {
      if (!changedFields || Object.keys(changedFields).length === 0) {
        setError("Nenhuma alteração foi feita");
        return;
      }
      setError(null);

      try {
        const response = await updateWork(changedFields, idWork);

        if (!response.success) {
          setError(response.error || "Erro ao salvar alterações");
          return;
        }

        setChangedFields(undefined);
        setSuccess(response.message);
        setOpenModal(true);

        router.refresh();
      } catch (error: any) {
        setError("Erro de conexão. Tente novamente.");
      }
    });
  };

  const handleDataChange = (field: string, value: string) => {
    setEditableData((prev) => ({ ...prev, [field]: value }));

    const isDateField = field === "data_empreitamento";
    let formattedValue: string | null = value;

    if (isDateField) {
      if (value === "") {
        formattedValue = null;
      } else {
        const parsed = dayjs(value, "DD/MM/YYYY", true);
        formattedValue = parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
      }
    }

    setChangedFields((prev) => ({
      ...prev,
      [field]: formattedValue,
    }));
  };
  return (
    <>
      <div className="w-full flex justify-between items-center mb-4 px-2 md:px-8">
        <p className="text-2xl font-extrabold">Informações gerais</p>
        <ButtonComponent
          text={isPending ? "Salvando..." : "Salvar alterações"}
          styled="px-6"
          onClick={handleSubmit}
          disabled={
            isPending ||
            !changedFields ||
            Object.keys(changedFields).length === 0
          }
        />
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 md:px-4 w-full">
        <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
          <DataItem label="Ov/Nota" value={data.ovnota} />
          <DataItem label="Tipo" value={data.tipos} />
          <DataItem label="Municipio" value={data.municipios} />
          <DataItem label="Referência" value={data.referencia} />
          <DataItem label="Circuitos" value={data.circuitos} />
          <DataItem label="Conjunto" value={data.conjunto} />
        </div>

        <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
          <DataItem label="Pep" value={data.pep} status={data.status_pep} />
          <DataItem
            label="Diagrama"
            value={data.diagrama}
            status={data.status_diagrama}
          />
          <DataItem
            label="Ordem DCI"
            value={data.ordem_dci}
            status={data.status_170}
          />
          <DataItem
            label="Ordem DCD"
            value={data.ordem_dcd}
            status={data.status_190}
          />
          <DataItem
            label="Ordem DCA"
            value={data.ordem_dca}
            status={data.status_150}
          />
          <DataItem
            label="Ordem DCIM"
            value={data.ordem_dcim}
            status={data.status_180}
          />
        </div>

        <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
          <DataItem label="Entrada" value={formattedData.entrada} />
          <DataItem label="Prazo" value={formattedData.prazo} />
          <DataItem label="Data prazo final" value={formattedData.prazoFinal} />
          <DataItem
            label="Executado"
            value={formattedData.executadoFormatted}
          />
          <DataItem
            label="Data conclusão"
            value={formattedData.data_conclusao}
          />
          <DataItem
            label="Ano planejamento"
            value={data.ano_plan}
            background={formattedData.backgroundColor}
          />
        </div>

        <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
          <DataItem label="Status Sap" value={data.status_ov_sap} />
          <EditableColumn
            data={editableData}
            options={options}
            onHandleChange={handleDataChange}
          />
          <DataItem label="Empreendimento" value={data.empreendimento} />
        </div>
      </div>

      <div className="w-[95%] flex justify-between items-start mb-3 self-center border border-zinc-700 border-solid px-2 rounded-md">
        <p className="h-full xl:text-lg font-semibold min-w-28 text-center border-r border-zinc-700 border-solid flex items-center justify-start">
          Observação
        </p>
        <p className="w-full xl:text-lg font-medium text-start pl-5 py-2">
          {data.observ_obra}
        </p>
      </div>

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className="text-center text-lg text-gray-700 dark:text-gray-200 mb-6">
          {success}
        </span>
      </ModalComponent>

      {error && (
        <ErrorModal
          open={true}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </>
  );
}
