"use client";

import nookies from "nookies";
import { useCallback, useEffect, useState } from "react";

import ModalComponent from "@/components/common/Modal";
import { TableComponent } from "@/components/common/Table";
import { fetchData } from "@/services/fetchData";

import PortfolioWorksFilters from "./PortfolioWorksFilters";
import { mountUrl } from "@/utils/mountUrl";
import { usePathname } from "next/navigation";
import ErrorModal from "@/components/common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

interface MainPortfolioWorksProps {
  data: any;
  filters: any;
  token: string;
  columns: Record<string, string>;
  url: string;
  totalValues: number;
}

export default function PortfolioWorks({
  data,
  filters,
  token,
  columns,
  url,
  totalValues,
}: MainPortfolioWorksProps) {
  const [dataFiltered, setDataFiltered] = useState(data);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>();
  const pathname = usePathname();

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const generateExcel = useCallback(
    async (params: Record<string, string>) => {
      const url = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao/${pathname}`,
        params
      );

      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorResponse = await response.json();
          const errorMessage = errorResponse?.message;
          setError(`Erro ao gerar a planilha: ${errorMessage}`);
          return;
        }

        const blob = await response.blob();

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "Exportação obras em carteira.xlsx";
        document.body.append(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error: any) {
        setError(error.message);
      }
    },
    [pathname, token]
  );

  const fetchWorks = useCallback(
    async (params: Record<string, string>) => {
      try {
        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/obras/${url}`,
          params,
          token,
          { cache: "no-store" }
        );

        setDataFiltered(response.data);
      } catch (error: any) {
        setError(error.message);
      }
    },
    [token, url]
  );

  useEffect(() => {
    const cookies = nookies.get();
    const params = cookies["portfolioWorksFilters"];

    if (params) {
      fetchWorks(JSON.parse(params));
    }
  }, [fetchWorks]);

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col items-center">
        <PortfolioWorksFilters
          data={filters}
          onApplyFilters={fetchWorks}
          openModal={handleOpen}
          generateExcel={generateExcel}
        />
      </div>

      <TableComponent
        data={dataFiltered.data}
        columns={columns}
        sliceEndIndex={6}
      />

      <ModalComponent open={open} onClose={handleClose} title="Valores totais">
        <div className="flex flex-col items-center justify-center xl:flex-row w-full">
          {Object.entries(columns)
            .slice(totalValues)
            .map(([column, value]) => {
              const item = dataFiltered.data[1];

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
