"use client";

import { fetchData } from "@/services/fetchData";
import { useState } from "react";
import { TableComponent } from "../common/Table";
import PortfolioWorksFilters from "./PortfolioWorksFilters";
import ModalComponent from "../common/Modal";

interface MainPortfolioWorksProps {
  data: any;
  filters: any;
  token: string;
}

export default function PortfolioWorks({
  data,
  filters,
  token,
}: MainPortfolioWorksProps) {
  const [dataFiltered, setDataFiltered] = useState(data);
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  async function fetchWorks(params: Record<string, string>) {
    console.log(params);
    const response = await fetchData(
      "http://localhost:3333/obras/obras-carteira",
      params,
      token,
      { cache: "no-store" }
    );

    setDataFiltered(response.data);
  }

  const columnMapping = {
    id: "ID",
    ovnota: "Ovnota",
    ordemdiagrama: "Ordem DCI/Diagrama",
    ordem_dcd: "Ordem DCD",
    ordem_dci: "Ordem DCI",
    ordem_dca: "Ordem DCA",
    ordem_dcim: "Ordem DCIM",
    status_ov_sap: "Status SAP",
    pep: "Pep",
    executado: "Executado",
    mun: "Municipio",
    turma: "Parceira",
    entrada: "Entrada",
    prazo: "Prazo",
    prazo_fim: "Prazo Fim",
    abrev_regional: "Regional",
    tipo_obra: "Tipo",
    qtde_planejada: "Qtde planejada",
    contagem_ocorrencias: "!",
    qtde_pend: "Qtde pendente",
    circuito: "Circuito",
    mo_planejada: "MO planejada",
    first_data_prog: "Data programada",
    status: "Status",
    hora_ini: "Hora início",
    hora_ter: "Hora término",
    tipo_servico: "Tipo serviço",
    chi: "Chi",
    conjunto: "Conjunto",
    equipe_linha_morta: "Equipe linha morta",
    equipe_linha_viva: "Equipe linha viva",
    equipe_regularizacao: "Equipe regularização",
    data_empreitamento: "Data empreitamento",
    empreendimento: "Empreendimento",
    total_obras: "Total de obras",
    total_mo_planejada: "Total MO planejada",
    total_mo_executada: "Total MO executada",
    total_mo_suspensa: "Total MO suspensa",
    total_qtde_planejada: "Total QTDE planejada",
    total_qtde_pend: "Total QTDE pend",
  };

  return (
    <>
      <div className="my-6 w-11/12 flex flex-col items-center">
        <PortfolioWorksFilters
          data={filters}
          onApplyFilters={fetchWorks}
          openModal={handleOpen}
        />
      </div>

      <TableComponent
        data={dataFiltered.data}
        columnMapping={columnMapping}
        sliceEndIndex={6}
      />

      <ModalComponent open={open} onClose={handleClose} title="Valores totais">
        <div className="flex flex-row justify-between">
          {Object.entries(columnMapping)
            .slice(34)
            .map(([column, value]) => {
              const item = dataFiltered.data[1];

              return (
                <div key={column} className="flex flex-row">
                  <span className="p-2 bg-[#212E3E] text-zinc-200">
                    <p>{value}</p>
                  </span>
                  <div className="p-2 border border-solid ml-1">
                    <p>{item[column]?.toFixed(0)}</p>
                  </div>
                </div>
              );
            })}
        </div>
      </ModalComponent>
    </>
  );
}
