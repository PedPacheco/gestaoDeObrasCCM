"use client";

import { fetchData } from "@/services/fetchData";
import MainAllWorksFilters from "./allWorksFilter";
import MainAllWorksTable from "./allWorksTable";
import { useState } from "react";

interface MainAllWorksProps {
  data: any;
  filters: any;
  token: string;
}

export default function MainAllWorks({
  data,
  filters,
  token,
}: MainAllWorksProps) {
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

  const columnMapping = {
    ovnota: "Ovnota",
    ordemdiagrama: "Ordem",
    status_ov_sap: "OV",
    pep: "Pep",
    diagrama: "Diagrama",
    ordem_dci: "Ordem DCI",
    ordem_dcd: "Ordem DCD",
    ordem_dca: "Ordem DCA",
    ordem_dcim: "Ordem DCIM",
    mun: "Mun",
    tipo: "Tipo",
    entrada: "Entrada",
    prazo_fim: "Prazo",
    qtde_planejada: "Qtde",
    mo_planejada: "MO Plan",
    mo_acertada: "MO Acert",
    turma: "Parceira",
    executado: "% Exec",
    data_conclusao: "Data exec",
    last_data_prog: "Data prog",
    status: "Status",
    observ_obra: "Observação",
    referencia: "Referência",
  };

  return (
    <>
      <div className="my-6 w-4/5 flex flex-col">
        <MainAllWorksFilters data={filters} onApplyFilters={fetchWorks} />
      </div>

      <MainAllWorksTable columnMapping={columnMapping} works={dataFiltered} />
    </>
  );
}
