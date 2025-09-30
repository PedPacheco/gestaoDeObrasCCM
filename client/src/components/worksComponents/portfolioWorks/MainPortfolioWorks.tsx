"use client";

import dayjs from "dayjs";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";
import { exportExcel } from "@/actions/generateExcel.action";
import { TableWithPagination } from "@/components/common/TableWithPagination";
import { mountUrl } from "@/utils/mountUrl";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import PortfolioWorksFilters from "./PortfolioWorksFilters";
import { FormatCurrency } from "@/utils/formatValue";

const ErrorModal = dynamic(() => import("@/components/common/ErrorModal"), {
  ssr: false,
});
const ModalComponent = dynamic(() => import("@/components/common/Modal"), {
  ssr: false,
});

interface MainPortfolioWorksProps {
  data: any;
  filtersData: any;
  url: string;
  token: string;
  cookie: string;
  columns: Record<string, string>;
  totalValues: number;
}

const cookies = new Cookies();

export default function PortfolioWorks({
  data,
  filtersData,
  token,
  columns,
  cookie,
  totalValues,
  url,
}: MainPortfolioWorksProps) {
  const [filteredData, setFilteredData] = useState(data);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>();
  const [page, setPage] = useState(0);
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggleModal = () => setOpen((prev) => !prev);

  const generateExcel = useCallback(
    async (params: Record<string, string>) => {
      const { page, ...formattedParams } = params;

      const url = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao${pathname}`,
        formattedParams
      );

      try {
        const blob = await exportExcel(url, token);

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "Exportação obras em carteira.xlsx";
        document.body.append(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error: any) {
        setError(`Erro ao gerar a planilha: ${error.message}`);
      }
    },
    [pathname, token]
  );

  const fetchWorks = useCallback(
    (params: Record<string, string | boolean>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/obras/${url}`,
            params,
            token,
            { cache: "no-store" }
          );

          setFilteredData(response.data);
        } catch (error: any) {
          setError(error.message);
        }
      });
    },
    [token, url]
  );

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);

    const currentFilters = cookies.get(cookie) ? cookies.get(cookie) : {};

    const filtersValues = {
      ...Transform(currentFilters?.selectedItems || {}),
      page: newPage.toString(),
    };

    fetchWorks(filtersValues);
  };

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col items-center">
        <PortfolioWorksFilters
          data={filtersData}
          url={cookie}
          openModal={toggleModal}
          generateExcel={generateExcel}
          applyFilters={fetchWorks}
          isPending={isPending}
          setPage={setPage}
        />
      </div>

      <TableWithPagination
        data={filteredData}
        columns={columns}
        sliceEndIndex={6}
        handleChangePage={handleChangePage}
        page={page}
      />

      <ModalComponent open={open} onClose={toggleModal} title="Valores totais">
        <div className="flex flex-col items-center justify-center xl:flex-row w-full">
          {Object.entries(columns)
            .slice(totalValues)
            .map(([column, value]) => {
              const item = data.totals;
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
