"use client";

import { useCallback, useState, useTransition } from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";

import { useFeedback } from "@/hooks/useFeedback";

import { Transform } from "@/utils/transform";
import D5NotesFilters from "./d5NotesFilters";
import { D5NotesTable } from "./d5NotesTable";
import { Typography } from "@mui/material";
import { ButtonComponent } from "../common/Button";
import { mountUrl } from "@/utils/mountUrl";
import { exportExcel } from "@/actions/generateExcel.action";

interface MainPortfolioWorksProps {
  data: any;
  filtersData: any;
  token: string;
  cookie: string;
  columns: Record<string, string>;
  totals: { total: number; totalMoPlanejada: number };
}

const cookies = new Cookies();

export default function D5NotesMain({
  data,
  token,
  columns,
  cookie,
  filtersData,
  totals,
}: MainPortfolioWorksProps) {
  const { showError } = useFeedback();

  const [filteredData, setFilteredData] = useState(data);
  const [filteredTotals, setFilteredTotals] = useState(totals);
  const [page, setPage] = useState(0);

  const [isPending, startTransition] = useTransition();

  const generateExcel = useCallback(
    async (params: Record<string, string | string[] | boolean>) => {
      const exportUrl = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao/notas-d5`,
        params,
      );

      try {
        const response = await exportExcel(exportUrl, token);

        if (!response.success) {
          showError(response.message);
          return;
        }

        const downloadUrl = window.URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "Exportação Notas D5";

        document.body.append(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error: any) {
        showError(`Erro ao gerar a planilha: ${error.message}`);
      }
    },
    [showError, token],
  );

  const fetchWorks = useCallback(
    (params: Record<string, string | string[] | boolean>) => {
      startTransition(async () => {
        try {
          const response = await fetchData(
            `${process.env.NEXT_PUBLIC_API_URL}/notas-d5`,
            params,
            token,
            { cache: "no-store" },
          );

          setFilteredData(response.data.d5Notes);
          setFilteredTotals(response.data.totals);
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
      <div className="flex items-start gap-4 mx-auto w-11/12 py-6">
        <D5NotesFilters
          data={filtersData}
          url={cookie}
          page={page}
          searchFilteredData={fetchWorks}
          generateExcel={generateExcel}
          isPending={isPending}
        />
      </div>

      <D5NotesTable
        data={filteredData ?? []}
        totals={filteredTotals}
        variant="notas"
        columns={columns}
        handleChangePage={handleChangePage}
        page={page}
        getRowKey={(item) => item.id}
      />
    </div>
  );
}
