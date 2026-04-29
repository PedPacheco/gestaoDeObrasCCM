"use client";

import { GroupSummary } from "@/types/dashboard/labor/types";
import { formatPercentage } from "@/utils/formatValue";
import { memo } from "react";
import { PerformanceBadge } from "./ui/performanceBadge";

interface GroupSummaryTableProps {
  data: GroupSummary[];
}

export const GroupSummaryTable = memo(function GroupSummaryTable({
  data,
}: GroupSummaryTableProps) {
  return (
    <section className="rounded-2xl border bg-white shadow-sm">
      <header className="border-b px-6 py-4">
        <h3 className="text-lg font-semibold">Performance por Parceira</h3>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Parceira
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Programado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Executado
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Atingimento
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {data.map((group) => (
              <tr key={group.parceira} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {group.parceira}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPercentage(group.programado)}
                </td>
                <td className="px-6 py-4 text-right">
                  {formatPercentage(group.executado)}
                </td>
                <td className="px-6 py-4 text-center">
                  <PerformanceBadge value={group.percentualMeta} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});
