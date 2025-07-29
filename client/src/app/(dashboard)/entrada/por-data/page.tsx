import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainEntryByDate from "@/components/entryComponents/entryByDate/MainEntryByDate";
import { Transform } from "@/utils/transform";

export const dynamic = "force-dynamic";

export default async function EntryForDate() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("entryByDateFilters")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;
  let filtersValues = undefined;

  if (params) {
    const formattedSelectedItems = Transform(params.selectedItems);

    filtersValues = {
      ...formattedSelectedItems,
      data: params.date
        ? params.filterType === "day"
          ? dayjs(params.date).format("DD/MM/YYYY")
          : dayjs(params.date).format("MM/YYYY")
        : "",
      tipoFiltro: params.filterType,
    };
  } else {
    filtersValues = {
      tipoFiltro: "day",
      data: dayjs().format("DD/MM/YYYY"),
    };
  }

  const [filters, entryData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      circuito: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/entrada/data`,
      filtersValues,
      cookieStore.get("token")?.value
    ),
  ]);

  const { token, data } = entryData;

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
    prazo_fim: "Prazo Fim",
    qtde_planejada: "Qtde Planejada",
    mo_planejada: "MO Planejada",
    observ_obra: "Observação",
    tipos: "Tipo de Obra",
    turmas: "Turma",
    municipios: "Município",
    total_obras: "Total Obras",
    total_mo_planejada: "Total MO Planejada",
    total_qtde_planejada: "Total Qtde Planejada",
  };

  return (
    <MainEntryByDate
      data={data}
      token={token}
      filtersData={filters}
      columns={columnMapping}
    />
  );
}
