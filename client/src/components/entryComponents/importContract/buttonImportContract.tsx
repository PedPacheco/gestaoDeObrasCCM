"use client";

import ExcelJS from "exceljs";
import { useRef, useState, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import {
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/20/solid";

type ContractRow = {
  ovnota: string;
  ordemDiagrama: string;
  dataEmpreitamento: string;
  tipoAds: string;
};

export function ButtonImportContract() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];

        const newData: ContractRow[] = worksheet
          .getSheetValues()
          .slice(2)
          .map((row: any) => ({
            ovnota: row[1]?.toString() || "",
            ordemDiagrama: row[2]?.toString() || "",
            dataEmpreitamento: new Date(row[3]).toISOString() || "",
            tipoAds: row[4]?.toString() || "",
          }));

        localStorage.setItem("contracts", JSON.stringify(newData));
        setSuccess("Empreitamento importado com sucesso!");
        setOpenModal(true);
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  const toggleModal = () => {
    setOpenModal((prev) => !prev);
    window.location.reload();
  };

  return (
    <>
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
          onChange={handleFileChange}
          style={{ display: "none" }}
          required
        />
      </form>

      <ButtonComponent
        onClick={() => fileInputRef.current?.click()}
        startIcon={<DocumentArrowDownIcon width={25} height={25} />}
        text="Importar Empreitamento"
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
