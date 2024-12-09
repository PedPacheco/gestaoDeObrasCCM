"use client";

import nookies from "nookies";
import { useCallback, useEffect, useState } from "react";

import { MainInterface } from "@/interfaces/mainInterface";
import { fetchData } from "@/services/fetchData";

import ScheduleFilters from "./ScheduleFilters";
import ScheduleTable from "./ScheduleTable";

export default function MainSchedule({
  columns,
  data,
  filters,
  token,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);

  const fetchSchedule = useCallback(
    async (params: Record<string, string>) => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/programacao`,
        params,
        token
      );
      setDataFiltered(response.data);
    },
    [token]
  );

  useEffect(() => {
    const cookies = nookies.get();
    const params = cookies["scheduleFilters"];

    if (params) {
      fetchSchedule(JSON.parse(params));
    }
  }, [fetchSchedule]);

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <ScheduleFilters data={filters} onApplyFilters={fetchSchedule} />
      </div>

      <ScheduleTable schedule={dataFiltered} columnMapping={columns} />
    </>
  );
}
