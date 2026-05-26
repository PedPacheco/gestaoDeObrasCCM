"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";
import { exportExcel } from "@/actions/generateExcel.action";
import { TableWithPagination } from "@/components/common/TableWithPagination";
import { useUser } from "@/contexts/userContext";
import { useMapFilter } from "@/contexts/mapFilterContext";
import { FiltersInterface } from "@/types/filtersInterfaces";
import { FormatCurrency } from "@/utils/formatValue";
import { mountUrl } from "@/utils/mountUrl";
import { Transform } from "@/utils/transform";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import PortfolioWorksFilters from "./PortfolioWorksFilters";

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
  const { permissions } = useUser();
  const { setOvnotas } = useMapFilter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [filteredFilters, setFilteredFilters] =
    useState<FiltersInterface>(filtersData);

  useEffect(() => {
    if (permissions?.tipo_usuario === "PARCEIRO") {
      const { parceira, ...rest } = filtersData;

      const suspensionRemoved = rest.status?.filter(
        (item: { id: number }) => item.id !== 4,
      );

      setFilteredFilters({ ...rest, status: suspensionRemoved });
    }
  }, [filtersData, permissions?.tipo_usuario]);

  const toggleModal = () => setOpen((prev) => !prev);

  const generateExcel = useCallback(
    async (params: Record<string, string>) => {
      const { page, ...formattedParams } = params;

      const exportUrl = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao${pathname}`,
        formattedParams,
      );

      try {
        const blob = await exportExcel(exportUrl, token);

        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download =
          pathname === "/obras-executadas"
            ? "Exportação obras executadas"
            : "Exportação obras em carteira";

        document.body.append(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error: any) {
        setError(`Erro ao gerar a planilha: ${error.message}`);
      }
    },
    [pathname, token],
  );

  const fetchWorks = useCallback(
    (params: Record<string, string | boolean>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/obras/${url}`,
            params,
            token,
            { cache: "no-store" },
          );

          setFilteredData(response.data);
          setOvnotas(response.data?.works ?? []);
        } catch (error: any) {
          setError(error.message);
        }
      });
    },
    [token, url, setOvnotas],
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);

    const currentFilters = cookies.get(cookie) ?? {};

    fetchWorks({
      ...Transform(currentFilters?.selectedItems || {}),
      page: newPage.toString(),
    });
  };

  const totals = useMemo(() => filteredData?.totals ?? {}, [filteredData]);

  return (
    <div className="flex w-full flex-col items-center overflow-y-auto">
      <div className="my-6 w-11/12">
        <PortfolioWorksFilters
          data={filteredFilters}
          url={cookie}
          openModal={toggleModal}
          generateExcel={generateExcel}
          searchFilteredData={fetchWorks}
          isPending={isPending}
          setPage={setPage}
        />
      </div>

      <TableWithPagination
        data={filteredData?.works ?? []}
        totals={totals}
        columns={columns}
        sliceEndIndex={6}
        handleChangePage={handleChangePage}
        page={page}
      />

      <ModalComponent open={open} onClose={toggleModal} title="Valores totais">
        <div className="flex w-full flex-col items-center justify-center xl:flex-row">
          {Object.entries(columns)
            .slice(totalValues)
            .map(([column, label]) => {
              let valueFormatted = totals[column];

              if (
                [
                  "total_mo_planejada",
                  "total_mo_exec",
                  "total_mo_pend",
                ].includes(column)
              ) {
                valueFormatted = FormatCurrency(totals[column]);
              }

              return (
                <div
                  key={column}
                  className="flex flex-row py-2 xl:mx-2 xl:py-0"
                >
                  <span className="flex items-center bg-[#212E3E] p-1 text-zinc-200">
                    <p>{label}</p>
                  </span>

                  <div className="flex items-center justify-center border border-solid p-2">
                    <p>
                      {typeof valueFormatted === "number"
                        ? Number(valueFormatted.toFixed(0)).toLocaleString(
                            "pt-BR",
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
          open
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </div>
  );
}
