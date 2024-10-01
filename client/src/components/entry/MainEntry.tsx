"use client";

import { fetchData } from "@/services/fetchData";
import EntryFilters from "./EntryFilters";
import EntryTable from "./EntryTable";
import { useState } from "react";

interface MainEntryProps {
  filters: any;
  data: any;
  token: string;
}

export default function MainEntry({ data, filters, token }: MainEntryProps) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: Record<string, string>) {
    const response = await fetchData(
      "http://localhost:3333/entrada",
      params,
      token
    );
    setDataFiltered(response.data);
  }

  const columnMapping = {
    tipo_obra: "Tipo",
    jan: "Jan",
    fev: "Fev",
    mar: "Mar",
    abr: "Abr",
    mai: "Mai",
    jun: "Jun",
    jul: "Jul",
    ago: "Ago",
    set: "Set",
    out: "Out",
    nov: "Nov",
    dez: "Dez",
    total: "Total",
  };

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <EntryFilters data={filters} onApplyFilters={fetchEntry} />
      </div>

      <EntryTable entry={dataFiltered} columnMapping={columnMapping} />
    </>
  );
}
