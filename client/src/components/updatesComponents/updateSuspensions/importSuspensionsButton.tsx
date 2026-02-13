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
import { useFeedback } from "@/hooks/useFeedback";

type SuspensionRow = {
  ovnota: string;
  motivo: string;
};

export function ImportSuspensionsButton() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showError, showSuccess } = useFeedback();
  const [isPending, startTransition] = useTransition();

  const resetFileInputs = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];

        const newData: SuspensionRow[] = [];
        const values = worksheet.getSheetValues().slice(2);

        for (const row of values) {
          if (!Array.isArray(row)) continue;

          const ovnota = row[1]?.toString().trim();
          const motivo = row[2]?.toString().trim();

          if (!ovnota) break;
          if (!motivo)
            throw new Error(
              `O motivo da supensão da obra ${ovnota} não foi enviado`,
            );

          newData.push({
            ovnota,
            motivo,
          });
        }

        localStorage.setItem("suspensions", JSON.stringify(newData));
        showSuccess("Suspensões importado com sucesso!", () => {
          window.location.reload();
        });
        resetFileInputs();
      } catch (err: any) {
        resetFileInputs();
        showError(err.message);
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
        text="Importar Motivos das Suspensões"
        disabled={isPending}
      />
    </>
  );
}
