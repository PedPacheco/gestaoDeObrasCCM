import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainAllWorks from "@/components/worksComponents/allWorks/MainAllWorks";
import { Transform } from "@/utils/transform";

export default async function AllWorks() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("allWorksFilters")?.value;
  const token = cookieStore.get("token")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;
  let filtersValues = undefined;

  if (params) {
    const formattedSelectedItems = params.selectedItems
      ? Transform(params.selectedItems)
      : {};

    filtersValues = {
      ...formattedSelectedItems,
      page: params.page,
      limit: params.rowsPerPage,
    };
  } else {
    filtersValues = {
      page: 0,
      limit: 100,
    };
  }

  const [filters, worksData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      status: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/obras`,
      filtersValues,
      token,
      { cache: "no-store" }
    ),
  ]);

  const { data } = worksData;

  const columns = {
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
    <MainAllWorks
      data={data.data}
      filtersData={filters}
      token={token}
      columns={columns}
    />
  );
}
