"use client";

import dynamic from "next/dynamic";

import { useCallback, useMemo, useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";

import { useFeedback } from "@/hooks/useFeedback";

import { Transform } from "@/utils/transform";
import D5NotesFilters from "./d5NotesFilters";
import { D5NotesTable } from "./d5NotesTable";

const ModalComponent = dynamic(() => import("@/components/common/Modal"), {
  ssr: false,
});

interface MainPortfolioWorksProps {
  data: any;
  filtersData: any;
  token: string;
  cookie: string;
  columns: Record<string, string>;
  totals: {totalNotas: number, totalMoPlanejado: number}
}

const cookies = new Cookies();

export default function D5NotesMain({
  data,
  token,
  columns,
  cookie,
  filtersData,
  totals
}: MainPortfolioWorksProps) {
  const { showError } = useFeedback();

  const [filteredData, setFilteredData] = useState(data);
  // const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);

  const [isPending, startTransition] = useTransition();

  // const toggleModal = () => setOpen((prev) => !prev);

  // const generateExcel = useCallback(
  //   async (params: Record<string, string>) => {
  //     const { page, ...formattedParams } = params;

  //     const exportUrl = mountUrl(
  //       `${process.env.NEXT_PUBLIC_API_URL}/exportacao${pathname}`,
  //       formattedParams,
  //     );

  //     try {
  //       const response = await exportExcel(exportUrl, token);

  //       if (!response.success) {
  //         showError(response.message);
  //         return;
  //       }

  //       const downloadUrl = window.URL.createObjectURL(response.data);
  //       const link = document.createElement("a");
  //       link.href = downloadUrl;
  //       link.download =
  //         pathname === "/obras-executadas"
  //           ? "Exportação obras executadas"
  //           : "Exportação obras em carteira";

  //       document.body.append(link);
  //       link.click();
  //       document.body.removeChild(link);
  //       window.URL.revokeObjectURL(downloadUrl);
  //     } catch (error: any) {
  //       showError(`Erro ao gerar a planilha: ${error.message}`);
  //     }
  //   },
  //   [pathname, showError, token],
  // );

  const fetchWorks = useCallback(
    (params: Record<string, string | boolean>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/notas-d5`,
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
    [showError, token],
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);

    const currentFilters = cookies.get(cookie) ?? {};

    fetchWorks({
      ...Transform(currentFilters?.selectedItems || {}),
      page: newPage.toString(),
    });
  };

  return (
    <div className="flex w-full flex-col items-center overflow-y-auto">
      <div className="my-6 w-11/12">
        <D5NotesFilters
          data={filtersData}
          url={cookie}
          filtersData={filtersData}
          searchFilteredData={fetchWorks}
          isPending={isPending}
        />
      </div>

      <D5NotesTable
        data={filteredData ?? []}
        totals={totals}
        columns={columns}
        handleChangePage={handleChangePage}
        page={page}
        getRowKey={(item) => item.id}
      />
    </div>
  );
}
