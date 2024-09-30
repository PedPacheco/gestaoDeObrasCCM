import MainEntryByDate from "@/components/entryByDate/MainEntryByDate";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import dayjs from "dayjs";
import { cookies } from "next/headers";

export default async function EntryForDate() {
  const filters = await fetchFilters({
    regional: true,
    parceira: true,
    tipo: true,
    municipio: true,
    grupo: true,
    circuito: true,
  });

  const cookieStore = cookies();

  const { token, data } = await fetchData(
    `http://localhost:3333/entrada/data?data=${dayjs().format(
      "DD/MM/YYYY"
    )}&tipoFiltro=day`,
    undefined,
    cookieStore.get("token")?.value
  );

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
    <MainEntryByDate
      data={data}
      token={token}
      filters={filters}
      columnMapping={columnMapping}
    />
  );
}
