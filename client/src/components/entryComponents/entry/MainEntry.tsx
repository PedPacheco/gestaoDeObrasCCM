"use client";

import { fetchData } from "@/services/fetchData";
import EntryFilters from "./EntryFilters";
import EntryTable from "./EntryTable";
import { useState } from "react";
import { MainInterface } from "@/interfaces/mainInterface";

export interface EntryFiltersType {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio: { id: string; municipio: string }[];
  grupo: { id: string; grupo: string }[];
  circuito: { id: string; circuito: string }[];
}

export default function MainEntry({
  data,
  filters,
  token,
  columns,
}: MainInterface<EntryFiltersType>) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: Record<string, string>) {
    const response = await fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/entrada`,
      params,
      token
    );
    setDataFiltered(response.data);
  }

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <EntryFilters data={filters} onApplyFilters={fetchEntry} />
      </div>

      <EntryTable data={dataFiltered.data} columns={columns} />
    </>
  );
}
