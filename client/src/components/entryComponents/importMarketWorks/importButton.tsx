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

interface ImportButtonProps {
  storageKey: string;
}

export function ImportButton({ storageKey }: ImportButtonProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iw38InputRef = useRef<HTMLInputElement>(null);
  const cn52nInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [iw38File, setIw38File] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);

  const toggleModal = () => setOpenModal((prev) => !prev);

  const handleClick = () => {
    const inputRef =
      storageKey === "marketEntryData" ? fileInputRef : iw38InputRef;
    inputRef.current?.click();
  };

  const resetFileInputs = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (iw38InputRef.current) iw38InputRef.current.value = "";
    if (cn52nInputRef.current) cn52nInputRef.current.value = "";
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

        const res = await InsertAuxiliaryBaseMarket(data, storageKey);

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
    const file = e.target.files?.[0];
    if (!file) return;
    setIw38File(file);
    setTimeout(() => cn52nInputRef.current?.click(), 100);
  };

  const handleCN52NSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cn52nFile = e.target.files?.[0];
    if (!cn52nFile || !iw38File) return;

    const allSkippedNotes = new Set<string>();
    let insertedCounts = 0;

    startTransition(async () => {
      try {
        const workbook1 = new ExcelJS.Workbook();
        const workbook2 = new ExcelJS.Workbook();
        await workbook1.xlsx.load(await iw38File.arrayBuffer());
        await workbook2.xlsx.load(await cn52nFile.arrayBuffer());

        const iw38Sheet = workbook1.worksheets[0];
        const cn52nSheet = workbook2.worksheets[0];

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

        const cn52nData = cn52nSheet
          .getSheetValues()
          .slice(2)
          .map((row: any) => ({
            diagrama_rede: row[2],
            ctg_item: row[8],
            um_registro: row[10],
            texto_material: row[5],
            qtd_necess: row[12],
            preco_mi: row[11],
            material: row[4],
            def_proj: row[3],
          }));

        const groupData = groupNoteDate(iw38Data);

        const batches = createBatches(groupData, cn52nData, 500);

        for (const batch of batches) {
          const res = await InsertAuxiliaryBaseMarket(batch, storageKey);

          insertedCounts += res.insertedCount || 0;

          res.skippedNotes?.forEach((n) => allSkippedNotes.add(n));
        }

        if (insertedCounts === 0) {
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
        setIw38File(null);
        resetFileInputs();

        router.refresh();
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  return (
    <>
      {storageKey === "marketEntryData" ? (
        <form
          ref={formRef}
          name="form-mercado"
          encType="multipart/form-data"
          className="flex flex-col items-center gap-4"
        >
          <input
            type="file"
            name="file"
            accept=".xlsx"
            ref={fileInputRef}
            onChange={handleSingleFileChange}
            style={{ display: "none" }}
            required
          />
        </form>
      ) : (
        <>
          <input
            type="file"
            accept=".xlsx"
            ref={iw38InputRef}
            onChange={handleIW38Select}
            style={{ display: "none" }}
          />
          <input
            type="file"
            accept=".xlsx"
            ref={cn52nInputRef}
            onChange={handleCN52NSelect}
            style={{ display: "none" }}
          />
        </>
      )}

      <ButtonComponent
        onClick={handleClick}
        startIcon={<DocumentArrowDownIcon width={25} height={25} />}
        text={getButtonContent(
          isPending,
          storageKey === "marketEntryData"
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
