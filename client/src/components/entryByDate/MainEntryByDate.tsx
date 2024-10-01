"use client";

import { useState } from "react";
import { TableComponent } from "../common/Table";
import EntryByDateFilters from "./EntryByDateFilters";
import { fetchData } from "@/services/fetchData";

interface MainEntryByDateProsp {
  filters: any;
  data: any;
  token: string;
}

export default function MainEntryByDate({
  data,
  filters,
  token,
}: MainEntryByDateProsp) {
  const [dataFiltered, setDataFiltered] = useState(data);

  async function fetchEntry(params: Record<string, string>) {
    const response = await fetchData(
      "http://localhost:3333/entrada/data",
      params,
      token
    );

    setDataFiltered(response.data);
  }

  const columnMapping = {
    id: "ID",
    ovnota: "Ovnota",
    pep: "Pep",
    diagrama: "Diagrama",
    ordem_dci: "Ordem DCI",
    ordem_dcd: "Ordem DCD",
    ordem_dca: "Ordem DCA",
    ordem_dcim: "Ordem DCIM",
    entrada: "Entrada",
    prazo: "Prazo",
    qtde_planejada: "Qtde Planejada",
    mo_planejada: "MO Planejada",
    observ_obra: "Observação",
    tipos: "Tipo de Obra",
    turmas: "Turma",
    municipios: "Município",
    prazo_fim: "Prazo Fim",
    total_obras: "Total Obras",
    total_mo_planejada: "Total MO Planejada",
    total_qtde_planejada: "Total Qtde Planejada",
  };

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <EntryByDateFilters data={filters} onApplyFilters={fetchEntry} />
      </div>

      <TableComponent
        data={dataFiltered.data}
        columnMapping={columnMapping}
        sliceEndIndex={3}
      />
    </>
  );
}
