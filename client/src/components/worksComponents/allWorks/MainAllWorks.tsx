"use client";

import { fetchData } from "@/services/fetchData";
import MainAllWorksFilters from "./allWorksFilter";
import MainAllWorksTable from "./allWorksTable";
import { useState } from "react";
import { MainInterface } from "@/interfaces/mainInterface";

export default function MainAllWorks({
  data,
  filters,
  token,
  columns,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchWorks(params: Record<string, string>) {
    const response = await fetchData(
      "http://localhost:3333/obras",
      params,
      token,
      { cache: "no-store" }
    );

    setDataFiltered(response.data);
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <MainAllWorksFilters data={filters} onApplyFilters={fetchWorks} />
      </div>

      <MainAllWorksTable columnMapping={columns} works={dataFiltered} />
    </>
  );
}
