"use client";

import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { exportExcel } from "@/actions/generateExcel.action";
import { TableComponent } from "@/components/common/Table";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { MainInterface } from "@/interfaces/mainInterface";
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

export default function MainSchduleForDay({
  columns,
  data,
  filtersData,
  token,
}: MainInterface<any>) {
  const { filters, saveFilters } = useSaveFilters("scheduleForDayFilters");
  const [filteredData, setFilteredData] = useState(data);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>();
  const [page, setPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  const toggleModal = () => setOpen((prev) => !prev);

  useEffect(() => {
    const totalPages = Math.ceil(filteredData.totalRecords / 200);

    if (page >= totalPages && totalPages > 0) {
      setPage(0);
    }
  }, [filteredData.totalRecords, page]);

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

  const fetchSchedule = useCallback(
    (params: Record<string, string | boolean>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/programacao/mensal`,
            params,
            token
          );
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

    const filtersValues = {
      ...Transform(filters?.selectedItems || {}),
      data: filters?.date
        ? dayjs(filters?.date).format(
            filters?.filterType === "day" ? "DD/MM/YYYY" : "MM/YYYY"
          )
        : dayjs().format("MM/YYYY"),
      tipoFiltro: filters?.filterType || "month",
      executado: filters?.executed || "false",
      page: newPage.toString(),
    };

    saveFilters({ ...filters });
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
          applyFilters={fetchSchedule}
        />
      </div>

      <TableComponent
        data={filteredData}
        columns={columns}
        sliceEndIndex={3}
        page={page}
        handleChangePage={handleChangePage}
      />

      <ModalComponent open={open} onClose={toggleModal} title="Valores totais">
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
