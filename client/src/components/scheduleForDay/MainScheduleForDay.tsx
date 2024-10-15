"use client";

import { fetchData } from "@/services/fetchData";
import { useState } from "react";
import { TableComponent } from "../common/Table";
import ScheduleForDayFilters from "./ScheduleForDayFilters";

interface MainSchduleByDateProps {
  filters: any;
  data: any;
  token: string;
  columns: Record<string, string>;
}

export default function MainSchduleForDay({
  columns,
  data,
  filters,
  token,
}: MainSchduleByDateProps) {
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

      <TableComponent
        data={dataFiltered.data}
        columnMapping={columns}
        sliceEndIndex={1}
      />
    </>
  );
}
