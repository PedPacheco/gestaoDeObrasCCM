"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Cookies } from "react-cookie";

import { UpdateSap } from "@/actions/works";
import { ButtonComponent } from "@/components/common/Button";
import { useFeedback } from "@/hooks/useFeedback";
import { getButtonContent } from "@/utils/getButtonContent";

const cookies = new Cookies();

interface UpdateButtonProps {
  storageKey: string;
}

export function UpdateButton({ storageKey }: UpdateButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const { showError, showSuccess } = useFeedback();

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
            referencia: item.referencia,
            idMunicipio: item.municipio,
            idEmpreendimento: item.empreendimento,
            idTipo: item.tipo,
            idTurma: item.parceira,
            idCircuito: item.circuito,
            pep: item.pep,
            ordem_dci: item.dci,
            ordem_dcd: item.dcd,
            ordem_dca: item.dca,
            ordem_dcim: item.dcim,
            moPlan: item.mo_plan,
            qtdePlan: item.qtde_plan,
            anoplan: Number(item.anoplan),
          }));
        }

        const res = await UpdateSap(data, key);

        if (!res.success) {
          showError(res.error);
          return;
        }

        localStorage.removeItem(storageKey);
        cookies.remove(storageKey);

        showSuccess(res.message);

        router.refresh();
      } catch (err: any) {
        showError(err.message);
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
            : "Atualizar Notas",
        )}
        disabled={isPending}
      />
    </>
  );
}
