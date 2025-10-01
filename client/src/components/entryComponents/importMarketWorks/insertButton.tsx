"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { InsertWorks } from "@/actions/works";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { getButtonContent } from "@/utils/getButtonContent";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

const cookies = new Cookies();

interface InsertMarketWorksButtonProps {
  storageKey: string;
}

export function InsertMarketWorksButton({
  storageKey,
}: InsertMarketWorksButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>();

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        const localData = localStorage.getItem(storageKey);
        const parsedData = JSON.parse(localData || "[]");
        let data: any;

        if (storageKey === "marketEntryData") {
          data = parsedData.map((item: any) => ({
            obra: item.obra,
            pep: item.pep,
            diagrama: item.diagrama,
            entrada: item.entrada,
            idMunicipio: item.municipio,
            idTipo: item.tipo,
            idCircuito: item.circuito,
            prazoTexto: item.prazoTexto,
            equipeNumPedido: item.referencia,
            statusOv: item.statusOv,
            statusDiagrama: item.statusDiagrama,
            statusPep: item.statusPep,
            moCliente: item.moCliente,
            moEmpresa: item.moEmpresa,
            observacao: item.observacao,
            idParceira: item.parceira,
          }));
        } else {
          data = parsedData.map((item: any) => ({
            obra: item.obra,
            entrada: item.entrada,
            prazo: item.prazo,
            referencia: item.referencia,
            aux_gpm: item.municipio,
            aux_empreendimento: item.empreendimento,
            aux_tipo: item.tipo,
            aux_turma: item.parceira,
            aux_circuito: item.circuito,
            aux_tecnico: item.tecnico,
            anoplan: item.anoplan,
          }));
        }

        const res = await InsertWorks(data, storageKey);

        if (!res.success) {
          setError(res.error);
          return;
        }

        setSuccess(res.message);
        setOpenModal(true);
        localStorage.removeItem(storageKey);
        cookies.remove(storageKey);

        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <>
      <ButtonComponent
        onClick={handleSubmit}
        text={getButtonContent(
          isPending,
          storageKey === "marketEntryData"
            ? "Inserir obras de mercado"
            : "Inserir Notas"
        )}
        disabled={isPending}
        styled="w-64"
      />

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className=" font-semibold text-xl">{success}</span>
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
