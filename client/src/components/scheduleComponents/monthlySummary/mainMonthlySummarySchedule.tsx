"use client";

import { useState } from "react";
import { fetchData } from "@/services/fetchData";
import dayjs from "dayjs";
import { MonthlySummaryScheduleFilters } from "./monthlySummaryScheduleFilters";
import { MonthlySummaryScheduleTable } from "./monthlySummaryScheduleTable";

export interface Filters {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  grupo: { id: string; grupo: string }[];
}

interface MainMonthlySummaryScheduleProps {
  dataFirstSummary: any;
  dataSecondSummary: any;
  filters: Filters;
  columnsFirstSummary: Record<string, string>;
  columnsSecondSummary: Record<string, string>;
  token: string;
}

export function MainMonthlySummarySchedule({
  columnsFirstSummary,
  columnsSecondSummary,
  dataFirstSummary,
  dataSecondSummary,
  filters,
  token,
}: MainMonthlySummaryScheduleProps) {
  const [dataFirstSummaryFiltered, setDataFirstSummaryFiltered] =
    useState(dataFirstSummary);
  const [dataSecondSummaryFiltered, setDataSecondSummaryFiltered] =
    useState(dataSecondSummary);

  async function fetchMonthlySummary(
    endpoint: string,
    params: Record<string, string | boolean>
  ) {
    const url = `${
      process.env.NEXT_PUBLIC_API_URL
    }${endpoint}?date=${dayjs().format("MM/YYYY")}`;

    return await fetchData(url, undefined, token, {
      cache: "no-store",
    });
  }

  async function fetchSummary(params: Record<string, string | boolean>) {
    const [dataFirstSummary, dataSecondSummary] = await Promise.all([
      fetchMonthlySummary("/programacao/resumo-mensal", params),
      fetchMonthlySummary("/programacao/resumo-mensal-2", params),
    ]);

    setDataFirstSummaryFiltered(dataFirstSummary);
    setDataSecondSummaryFiltered(dataSecondSummary);
  }

  return (
    <>
      <div className="my-6 w-full flex flex-col px-8">
        <MonthlySummaryScheduleFilters
          data={filters}
          onApplyFilters={fetchSummary}
        />
      </div>

      <div className="w-full max-h-[680px] flex flex-col xl:flex-row px-8">
        <MonthlySummaryScheduleTable
          columns={columnsFirstSummary}
          data={dataFirstSummaryFiltered}
        />

        <MonthlySummaryScheduleTable
          columns={columnsSecondSummary}
          data={dataSecondSummaryFiltered}
        />
      </div>
    </>
  );
}
