"use client";

import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { useCallback, useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";
import { exportExcel } from "@/actions/generateExcel.action";
import { TableWithPagination } from "@/components/common/TableWithPagination";
import { MainInterface } from "@/interfaces/mainInterface";
import { FormatCurrency } from "@/utils/formatValue";
import { mountUrl } from "@/utils/mountUrl";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import ScheduleForDayFilters from "./ScheduleForDayFilters";

const ErrorModal = dynamic(() => import("@/components/common/ErrorModal"), {
  ssr: false,
});
const ModalComponent = dynamic(() => import("@/components/common/Modal"), {
  ssr: false,
});

const cookies = new Cookies();

export default function MainSchduleForDay({
  columns,
  data,
  filtersData,
  token,
}: MainInterface<any>) {
  const [filteredData, setFilteredData] = useState(data);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>();
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  const toggleModal = () => setOpen((prev) => !prev);

  const generateExcel = useCallback(
    async (params: Record<string, string | boolean>) => {
      const { page, ...formattedParams } = params;

      const url = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao/programacao`,
        formattedParams
      );

      try {
        if (token) {
          const blob = await exportExcel(url, token);

          const downloadUrl = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = "Exportação Programação.xlsx";
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

  const fetchSchedule = useCallback(
    (params: Record<string, string | boolean>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/programacao/mensal`,
            params,
            token
          );
          console.log(response.data);
          setFilteredData(response.data);
        } catch (error: any) {
          setError(error.message);
        }
      });
    },
    [token]
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);

    const currentFilters = cookies.get("scheduleForDayFilters")
      ? cookies.get("scheduleForDayFilters")
      : {};

    const filtersValues = {
      ...Transform(currentFilters?.selectedItems || {}),
      data: currentFilters?.date
        ? dayjs(currentFilters?.date).format(
            currentFilters?.filterType === "day" ? "DD/MM/YYYY" : "MM/YYYY"
          )
        : "",
      tipoFiltro: currentFilters?.filterType || "",
      executado: currentFilters?.executed || "false",
      pendente: currentFilters?.pending || "false",
      page: newPage.toString(),
    };

    fetchSchedule(filtersValues);
  };

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col">
        <ScheduleForDayFilters
          data={filtersData}
          openModal={toggleModal}
          generateExcel={generateExcel}
          isPending={isPending}
          setPage={setPage}
          applyFilters={fetchSchedule}
        />
      </div>

      <TableWithPagination
        columns={columns}
        data={filteredData}
        sliceEndIndex={4}
        page={page}
        handleChangePage={handleChangePage}
      />

      <ModalComponent open={open} onClose={toggleModal} title="Valores totais">
        <div className="flex flex-col items-center justify-center xl:flex-row w-full">
          {Object.entries(columns)
            .slice(24)
            .map(([column, value]) => {
              const item = filteredData.totals;
              let valueFormatted = item[column];

              if (
                [
                  "total_mo_planejada",
                  "total_mo_exec",
                  "total_mo_suspensa",
                ].includes(column)
              ) {
                valueFormatted = FormatCurrency(item[column]);
              }

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
                      {typeof valueFormatted === "number"
                        ? Number(valueFormatted.toFixed(0)).toLocaleString(
                            "pt-br"
                          )
                        : valueFormatted}
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
