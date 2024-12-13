"use client";

import nookies from "nookies";
import { useCallback, useEffect, useState } from "react";

import { MainInterface } from "@/interfaces/mainInterface";
import { fetchData } from "@/services/fetchData";

import MainAllWorksFilters from "./allWorksFilter";
import MainAllWorksTable from "./allWorksTable";

export default function MainAllWorks({
  data,
  filters,
  token,
  columns,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);

  const fetchWorks = useCallback(
    async (params: Record<string, string>) => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/obras`,
        params,
        token,
        { cache: "no-store" }
      );

      setDataFiltered(response.data);
    },
    [token]
  );

  useEffect(() => {
    const cookies = nookies.get();
    const params = cookies["allWorksFilters"];

    if (params) {
      fetchWorks(JSON.parse(params));
    }
  }, [fetchWorks]);

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <MainAllWorksFilters data={filters} onApplyFilters={fetchWorks} />
      </div>

      <MainAllWorksTable columnMapping={columns} works={dataFiltered} />
    </>
  );
}
