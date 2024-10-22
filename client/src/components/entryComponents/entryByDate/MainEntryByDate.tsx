"use client";

import { useState } from "react";
import EntryByDateFilters from "./EntryByDateFilters";
import { fetchData } from "@/services/fetchData";
import { TableComponent } from "@/components/common/Table";
import { MainInterface } from "@/interfaces/mainInterface";

export default function MainEntryByDate({
  data,
  filters,
  token,
  columns,
}: MainInterface<any>) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: Record<string, string>) {
    const response = await fetchData(
      "http://localhost:3333/entrada/data",
      params,
      token
    );

    setDataFiltered(response.data);
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <EntryByDateFilters data={filters} onApplyFilters={fetchEntry} />
      </div>

      <TableComponent
        data={dataFiltered.data}
        columns={columns}
        sliceEndIndex={3}
      />
    </>
  );
}
