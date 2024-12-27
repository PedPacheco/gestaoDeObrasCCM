"use client";

import { useCallback, useState } from "react";

import { exportExcel } from "@/actions/generateExcel.action";
import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";
import { mountUrl } from "@/utils/mountUrl";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import ScheduleForDayFilters from "./ScheduleForDayFilters";

export default function MainSchduleForDay({
  columns,
  data,
  filtersData,
  token,
}: MainInterface<any>) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const generateExcel = useCallback(
    async (params: Record<string, string | boolean>) => {
      const url = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao/programacao`,
        params
      );

      try {
        if (token) {
          const blob = await exportExcel(url, token);

          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = "Exportação obras em carteira.xlsx";
          document.body.append(link);
          link.click();

          document.body.removeChild(link);
          window.URL.revokeObjectURL(downloadUrl);
        }
      } catch (error: any) {
        setError(`Erro ao gerar a planilha: ${error.message}`);
      }
    },
    [token]
  );

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col">
        <ScheduleForDayFilters
          data={filtersData}
          openModal={handleOpen}
          generateExcel={generateExcel}
        />
      </div>

      <TableComponent data={data} columns={columns} sliceEndIndex={3} />

      <ModalComponent open={open} onClose={handleClose} title="Valores totais">
        <div className="flex flex-col items-center justify-center xl:flex-row w-full">
          {Object.entries(columns)
            .slice(24)
            .map(([column, value]) => {
              const item = data[1];

              return (
                <div
                  key={column}
                  className="flex flex-row py-2 xl:py-0 xl:mx-2"
                >
                  <span className="p-1 bg-[#212E3E] text-zinc-200 flex items-center">
                    <p>{value}</p>
                  </span>
                  <div className="p-2 border border-solid flex justify-center items-center">
                    <p>
                      {item
                        ? Number(item[column].toFixed(0)).toLocaleString(
                            "pt-br"
                          )
                        : 0}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
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
