"use client";

import { fetchData } from "@/services/fetchData";
import { useState } from "react";
import ScheduleFilters from "./ScheduleFilters";
import ScheduleTable from "./ScheduleTable";
import { MainInterface } from "@/interfaces/mainInterface";

export default function MainSchedule({
  columns,
  data,
  filters,
  token,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: Record<string, string>) {
    const response = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao`,
      params,
      token
    );
    setDataFiltered(response.data);
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <ScheduleFilters data={filters} onApplyFilters={fetchEntry} />
      </div>

      <ScheduleTable schedule={dataFiltered} columnMapping={columns} />
    </>
  );
}
