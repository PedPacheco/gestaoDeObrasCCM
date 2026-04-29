"use client";

import { DailySummary } from "@/types/dashboard/labor/types";
import { memo } from "react";
import { PerformanceBadge } from "./ui/performanceBadge";
import { formatPercentage } from "@/utils/formatValue";

interface DailySummaryTableProps {
  data: DailySummary[];
}

export const DailySummaryTable = memo(function DailySummaryTable({
  data,
}: DailySummaryTableProps) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <header className="border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Resumo Diário</h3>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Data
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Programado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Executado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Meta
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Performance
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((item) => (
              <tr key={item.data} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                  {item.data}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPercentage(item.programado)}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPercentage(item.executado)}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPercentage(item.meta)}
                </td>
                <td className="px-6 py-4 text-center">
                  <PerformanceBadge value={item.percentualMeta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});
