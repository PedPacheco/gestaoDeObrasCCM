"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { UpdateSap } from "@/actions/works";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { getButtonContent } from "@/utils/getButtonContent";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

const cookies = new Cookies();

interface UpdateButtonProps {
  storageKey: string;
}

export function UpdateButton({ storageKey }: UpdateButtonProps) {
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
        const key =
          storageKey === "marketUpdatesData"
            ? "atualizar-ov"
            : "atualizar-nota";

        if (storageKey === "marketUpdatesData") {
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
          }));
        } else {
          data = parsedData.map((item: any) => ({
            obra: item.obra,
            entrada: item.entrada,
            prazo: item.prazo,
            referencia: item.referencia,
            idMunicipio: item.municipio,
            idEmpreendimento: item.empreendimento,
            idTipo: item.tipo,
            idTurma: item.parceira,
            idCircuito: item.circuito,
            anoPlan: item.anoplan,
            pep: item.pep,
            ordem_dci: item.dci,
            ordem_dcd: item.dcd,
            ordem_dca: item.dca,
            ordem_dcim: item.dcim,
            moPlan: item.mo_plan,
            qtdePlan: item.qtde_plan,
            capexMatPlan: item.capex_mat_plan,
            capexMoPlan: item.capex_mo_plan,
          }));
        }

        const res = await UpdateSap(data, key, "marketEntryData");

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
          storageKey === "marketUpdatesData"
            ? "Atualizar obras de mercado"
            : "Atualizar Notas"
        )}
        disabled={isPending}
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
