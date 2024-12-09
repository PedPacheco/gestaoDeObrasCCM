"use client";

import nookies from "nookies";
import { useCallback, useEffect, useState } from "react";

import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";
import { fetchData } from "@/services/fetchData";

import PendingScheduleFilters from "./PendingScheduleFilters";

export default function MainPendingSchedule({
  columns,
  data,
  filters,
  token,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);

  const fetchSchedule = useCallback(
    async (params: Record<string, string>) => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/programacao/pendente`,
        params,
        token
      );
      setDataFiltered(response.data);
    },
    [token]
  );

  useEffect(() => {
    const cookies = nookies.get();
    const params = cookies["pendingScheduleFilters"];

    if (params) {
      fetchSchedule(JSON.parse(params));
    }
  }, [fetchSchedule]);

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <PendingScheduleFilters data={filters} onApplyFilters={fetchSchedule} />
      </div>

      <TableComponent data={dataFiltered.data} columns={columns} />
    </>
  );
}
