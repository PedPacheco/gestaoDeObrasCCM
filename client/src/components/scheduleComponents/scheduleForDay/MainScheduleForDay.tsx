"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";
import { exportExcel } from "@/actions/generateExcel.action";
import { TableWithPagination } from "@/components/common/TableWithPagination";
import { useUser } from "@/contexts/userContext";
import { useFeedback } from "@/hooks/useFeedback";
import { FiltersInterface } from "@/interfaces/filtersInterfaces";
import { MainInterface } from "@/interfaces/mainInterface";
import { FormatCurrency } from "@/utils/formatValue";
import { mountUrl } from "@/utils/mountUrl";
import { Transform } from "@/utils/transform";

import ScheduleForDayFilters from "./ScheduleForDayFilters";

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
  const { permissions } = useUser();

  const { showError } = useFeedback();

  const [filteredData, setFilteredData] = useState(data);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  const [isPending, startTransition] = useTransition();
  const [filteredFilters, setFilteredFilters] =
    useState<FiltersInterface>(filtersData);

  useEffect(() => {
    if (permissions?.permissao_visualizacao === "parcial") {
      const { parceira, ...rest } = filtersData;

      setFilteredFilters(rest);
    }
  }, [filtersData, permissions?.permissao_visualizacao]);

  const toggleModal = () => setOpen((prev) => !prev);

  const generateExcel = useCallback(
    async (params: Record<string, string | boolean | string | null>) => {
      const { page, ...formattedParams } = params;

      const url = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao/programacao`,
        formattedParams,
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
        showError(`Erro ao gerar a planilha: ${error.message}`);
      }
    },
    [token],
  );

  const fetchSchedule = useCallback(
    (params: Record<string, string | boolean | null>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/programacao/mensal`,
            params,
            token,
            { cache: "no-store" },
          );
          setFilteredData(response.data);
        } catch (error: any) {
          showError(error.message);
        }
      });
    },
    [token],
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);

    const currentFilters = cookies.get("scheduleForDayFilters")
      ? cookies.get("scheduleForDayFilters")
      : {};

    const newSelectedItems = {
      ...Transform(currentFilters?.selectedItems || {}),
      executado: currentFilters.executed || "false",
      pendente: currentFilters.pending || "false",
      dataInicial: currentFilters.startDate
        ? currentFilters.startDate.format("DD/MM/YYYY")
        : undefined,
      dataFinal: currentFilters.endDate
        ? currentFilters.endDate.format("DD/MM/YYYY")
        : undefined,
      page: newPage.toString(),
      ovnota: currentFilters.ovnota || undefined,
      statusPrazo: currentFilters.deadlindStatus || undefined,
    };

    fetchSchedule(newSelectedItems);
  };

  return (
    <div className="w-full flex flex-col items-center overflow-y-auto">
      <div className="my-6 w-11/12 flex flex-col">
        <ScheduleForDayFilters
          data={filteredFilters}
          openModal={toggleModal}
          generateExcel={generateExcel}
          isPending={isPending}
          setPage={setPage}
          searchFilteredData={fetchSchedule}
        />
      </div>

      <TableWithPagination
        columns={columns}
        totals={filteredData.totals}
        data={filteredData.works}
        sliceEndIndex={4}
        page={page}
        handleChangePage={handleChangePage}
      />

      <ModalComponent open={open} onClose={toggleModal} title="Valores totais">
        <div className="flex flex-col items-center justify-center xl:flex-row w-full">
          {Object.entries(columns)
            .slice(30)
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
                        ? Number(valueFormatted.toFixed(2)).toLocaleString(
                            "pt-br",
                          )
                        : valueFormatted}
                    </p>
                  </div>
                </div>
              );
            })}
        </div>
      </ModalComponent>
    </div>
  );
}
