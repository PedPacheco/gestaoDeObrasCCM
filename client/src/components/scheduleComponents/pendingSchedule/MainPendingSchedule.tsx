"use client";

import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";
import { fetchData } from "@/services/fetchData";
import { useState } from "react";
import PendingScheduleFilters from "./PendingScheduleFilters";

export default function MainPendingSchedule({
  columns,
  data,
  filters,
  token,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: Record<string, string>) {
    const response = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/pendente`,
      params,
      token
    );
    setDataFiltered(response.data);
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <PendingScheduleFilters data={filters} onApplyFilters={fetchEntry} />
      </div>

      <TableComponent data={dataFiltered.data} columns={columns} />
    </>
  );
}
