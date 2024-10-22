"use client";

import { fetchData } from "@/services/fetchData";
import { useState } from "react";
import ScheduleForDayFilters from "./ScheduleForDayFilters";
import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";

export default function MainSchduleForDay({
  columns,
  data,
  filters,
  token,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: Record<string, string | boolean>) {
    const response = await fetchData(
      "http://localhost:3333/programacao/mensal",
      params,
      token
    );

    setDataFiltered(response.data);
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <ScheduleForDayFilters data={filters} onApplyFilters={fetchEntry} />
      </div>

      <TableComponent data={dataFiltered.data} columns={columns} />
    </>
  );
}
