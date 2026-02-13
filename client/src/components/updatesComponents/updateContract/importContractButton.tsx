"use client";

import ExcelJS from "exceljs";
import { useRef, useTransition } from "react";

import { ButtonComponent } from "@/components/common/Button";
import { useFeedback } from "@/hooks/useFeedback";
import { DocumentArrowDownIcon } from "@heroicons/react/20/solid";

type ContractRow = {
  ovnota: string;
  ordemDiagrama: string;
  dataEmpreitamento: string;
  tipoAds: string;
};

function excelSerialToDate(serial: number): Date {
  // Excel começa em 1900-01-01
  const utcDays = Math.floor(serial - 25569);
  const utcSeconds = utcDays * 86400;
  return new Date(utcSeconds * 1000);
}

function parseExcelDate(value: any): string {
  if (!value) return "";

  // Caso já seja Date válido
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString();
  }

  // Caso seja serial numérico do Excel
  if (typeof value === "number") {
    const parsed = excelSerialToDate(value);
    return parsed.toISOString();
  }

  // Caso seja string e Date consiga parsear
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  console.warn("Data inválida detectada:", value);
  return ""; // fallback
}

export function ImportContractButton() {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { showError, showSuccess } = useFeedback();

  const [isPending, startTransition] = useTransition();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(await file.arrayBuffer());
        const worksheet = workbook.worksheets[0];

        const sheetValues = worksheet.getSheetValues().slice(2);

        const newData: ContractRow[] = [];

        for (const row of sheetValues) {
          if (!Array.isArray(row)) continue;

          if (!row[1]) break;

          newData.push({
            ovnota: row[1]?.toString() || "",
            ordemDiagrama: row[2]?.toString() || "",
            dataEmpreitamento: parseExcelDate(row[3]),
            tipoAds: row[4]?.toString() || "",
          });
        }

        localStorage.setItem("contracts", JSON.stringify(newData));
        showSuccess("Empreitamento importado com sucesso!", () =>
          window.location.reload(),
        );
      } catch (err: any) {
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
        text="Importar Empreitamento"
        disabled={isPending}
        styled="w-72"
      />
    </>
  );
}
