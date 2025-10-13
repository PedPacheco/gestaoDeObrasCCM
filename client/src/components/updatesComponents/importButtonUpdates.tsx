"use client";

import ExcelJS from "exceljs";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

import { InsertAuxiliaryBaseMarket } from "@/actions/insertAuxiliaryBase";
import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { createBatches, groupNoteDate } from "@/utils/creationNoteBatches";
import { getButtonContent } from "@/utils/getButtonContent";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";

interface ImportButtonUpdatesProps {
  storageKey: string;
}

export function ImportButtonUpdates({ storageKey }: ImportButtonUpdatesProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iw38InputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleClick = () => {
    const inputRef =
      storageKey === "marketUpdatesData" ? fileInputRef : iw38InputRef;
    inputRef.current?.click();
  };

  const resetFileInputs = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (iw38InputRef.current) iw38InputRef.current.value = "";
  };

  const handleSingleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];

        const data = worksheet
          .getSheetValues()
          .slice(2)
          .map((row: any) => ({
            obra: row[1].toString(),
            pep: row[2],
            diagrama: row[3].toString(),
            entrada: row[15],
            gpm: row[4],
            tipo: row[5],
            circuito: row[6],
            prazoTexto: row[7],
            statusOv: row[9],
            statusDiagrama: row[10],
            statusPep: row[11],
            equipeNumPedido: row[12],
            moCliente: row[13],
            moEmpresa: row[14],
          }));

        const res = await InsertAuxiliaryBaseMarket(data, storageKey, "update");

        if (!res.success) {
          resetFileInputs();
          throw new Error(res.message);
        }

        setSuccess(res.message);
        setOpenModal(true);
        resetFileInputs();

        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const handleIW38Select = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("entrou");
    const iw38File = e.target.files?.[0];
    if (!iw38File) return;

    const allSkippedNotes = new Set<string>();

    startTransition(async () => {
      try {
        const workbook1 = new ExcelJS.Workbook();
        await workbook1.xlsx.load(await iw38File.arrayBuffer());

        const iw38Sheet = workbook1.worksheets[0];

        const iw38Data = iw38Sheet
          .getSheetValues()
          .slice(2)
          .map((row: any) => ({
            campo_ordenacao: String(row[4]),
            pep: row[8],
            tipo_de_ordem: row[1],
            conjunto: row[6],
            texto_breve: row[5],
            grp_plnj_pm: row[9],
            ordem: row[3],
            denominacao: row[17],
          }));

        const groupData = groupNoteDate(iw38Data);

        console.log(groupData);

        const res = await InsertAuxiliaryBaseMarket(
          groupData,
          storageKey,
          "update"
        );

        if (res.insertedCount === 0) {
          resetFileInputs();
          throw new Error("Nenhuma obra foi inserida");
        }

        resetFileInputs();
        const skippedNotesArr = Array.from(allSkippedNotes);

        let message: string = "";
        if (skippedNotesArr.length) {
          message += `\nNotas ignoradas: ${skippedNotesArr.join(", ")}`;
        }

        setSuccess(message);
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
      <form
        ref={formRef}
        name="form-mercado"
        encType="multipart/form-data"
        className="flex flex-col items-center gap-4"
      >
        {storageKey === "marketUpdatesData" ? (
          <input
            type="file"
            name="file"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={handleSingleFileChange}
            style={{ display: "none" }}
            required
          />
        ) : (
          <input
            type="file"
            accept=".xlsx"
            ref={iw38InputRef}
            onChange={handleIW38Select}
            style={{ display: "none" }}
          />
        )}
      </form>

      <ButtonComponent
        onClick={handleClick}
        startIcon={<DocumentArrowDownIcon width={25} height={25} />}
        text={getButtonContent(
          isPending,
          storageKey === "marketUpdatesData"
            ? "Importar obras de mercado"
            : "Importar Notas"
        )}
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
