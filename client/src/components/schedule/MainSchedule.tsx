"use client";

import Schedule from "@/app/(dashboard)/programacao/page";
import { fetchData } from "@/services/fetchData";
import { useState } from "react";
import ScheduleFilters from "./ScheduleFilters";
import ScheduleTable from "./ScheduleTable";

interface MainScheduleProps {
  filters: any;
  data: any;
  token: string;
  columns: Record<string, string>;
}

export default function MainSchedule({
  columns,
  data,
  filters,
  token,
}: MainScheduleProps) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: Record<string, string>) {
    const response = await fetchData(
      "http://localhost:3333/programacao",
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
