"use client";

import ExcelJS from "exceljs";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { InsertCapex } from "@/actions/insertAuxiliaryBase";

export function ImportCapexButton() {
  const cn52nInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleClick = () => {
    cn52nInputRef.current?.click();
  };

  const resetFileInputs = () => {
    if (cn52nInputRef.current) cn52nInputRef.current.value = "";
  };

  function createMaterialBatches(materialData: any[], batchSize: number = 150) {
    const batches: any[][] = [];
    let currentBatch: any[] = [];

    for (const material of materialData) {
      if (currentBatch.length >= batchSize) {
        batches.push(currentBatch);
        currentBatch = [];
      }
      currentBatch.push(material);
    }

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  const handleCN52NSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cn52nFile = e.target.files?.[0];
    if (!cn52nFile) return;

    startTransition(async () => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await cn52nFile.arrayBuffer());

        const cn52nSheet = workbook.worksheets[0];

        const cn52nData = cn52nSheet
          .getSheetValues()
          .slice(2)
          .map((row: any) => ({
            diagrama_rede: row[2].toString(),
            def_proj: row[3],
            material: row[4].toString(),
            texto_material: row[5],
            centro: row[6],
            deposito: row[7],
            ctg_item: row[8],
            elemento_pep: row[9],
            um_registro: row[10],
            preco_mi: row[11],
            qtd_necess: row[12],
            qtd_retirada: row[13],
            qtd_faltante: row[15],
            relevancia_calculo: row[17],
          }));

        const batches = createMaterialBatches(cn52nData);

        for (const batch of batches) {
          await InsertCapex(batch);
        }

        resetFileInputs();

        setSuccess("Materiais e Serviços M.O importados com sucesso");
        setOpenModal(true);
        resetFileInputs();

        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <>
      <input
        type="file"
        accept=".xlsx"
        ref={cn52nInputRef}
        onChange={handleCN52NSelect}
        style={{ display: "none" }}
      />

      <ButtonComponent
        onClick={handleClick}
        startIcon={<DocumentArrowDownIcon width={25} height={25} />}
        text="Importar Arquivo CN52N"
        disabled={isPending}
        styled="w-72"
      />

      <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
        <span className="font-semibold text-xl">{success}</span>
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
