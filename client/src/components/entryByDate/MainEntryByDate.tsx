"use client";

import { useState } from "react";
import { TableComponent } from "../common/Table";
import EntryByDateFilters from "./EntryByDateFilters";
import { fetchData } from "@/services/fetchData";

interface MainEntryByDateProsp {
  filters: any;
  data: any;
  token: string;
  columnMapping: Record<string, string>;
}

export default function MainEntryByDate({
  data,
  filters,
  token,
  columnMapping,
}: MainEntryByDateProsp) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: {
    idRegional?: string;
    idParceira?: string;
    idTIpo?: string;
    idMunicipio?: string;
    idGrupo?: string;
    data?: string;
    tipoFiltro: string;
  }) {
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

      <TableComponent data={dataFiltered.data} columnMapping={columnMapping} />
    </>
  );
}
