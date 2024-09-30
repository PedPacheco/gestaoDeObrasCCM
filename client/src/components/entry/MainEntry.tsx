"use client";

import { fetchData } from "@/services/fetchData";
import EntryFilters from "./EntryFilters";
import EntryTable from "./EntryTable";
import { useState } from "react";

interface MainEntryProps {
  filters: any;
  data: any;
  columnMapping: any;
  token: string;
}

export default function MainEntry({
  columnMapping,
  data,
  filters,
  token,
}: MainEntryProps) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: {
    idRegional?: string;
    idParceira?: string;
    idTipo?: string;
    idMunicipio?: string;
    idCircuito?: string;
    idGrupo?: string;
    ano?: string;
  }) {
    const response = await fetchData(
      "http://localhost:3333/entrada",
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

      <EntryTable entry={dataFiltered} columnMapping={columnMapping} />
    </>
  );
}
