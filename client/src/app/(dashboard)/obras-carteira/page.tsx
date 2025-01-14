import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import PortfolioWorks from "@/components/worksComponents/portfolioWorks/MainPortfolioWorks";
import { Transform } from "@/utils/transform";

export default async function WorksInPortfolio() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("portfolioWorksFilters")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  const filtersValues = {
    ...Transform(params?.selectedItems || {}),
    data: params?.date
      ? dayjs(params?.date).format(
          params?.filterType === "day" ? "DD/MM/YYYY" : "MM/YYYY"
        )
      : "",
    tipoFiltro: params?.filterType || "",
    page: "0",
  };

  const [filters, worksData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      circuito: true,
      conjunto: true,
      status: true,
      ovnota: true,
      empreendimento: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/obras/obras-carteira`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
  ]);

  const { token, data } = worksData;

  const columnMapping = {
    id: "ID",
    ovnota: "Ovnota",
    ordemdiagrama: "Ordem DCI/Diagrama",
    ordem_dcd: "Ordem DCD",
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
    qtde_planejada: "Qtde plan",
    qtde_pend: "Qtde pend",
    contagem_ocorrencias: "!",
    circuito: "Circuito",
    mo_planejada: "MO Plan",
    first_data_prog: "Data programada",
    status: "Status",
    hora_ini: "Hora início",
    hora_ter: "Hora término",
    tipo_servico: "Tipo serviço",
    chi: "Chi",
    conjunto: "Conjunto",
    equipe_linha_morta: "Equipe LM",
    equipe_linha_viva: "Equipe LV",
    equipe_regularizacao: "Equipe Reg",
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
    <PortfolioWorks
      data={data}
      token={token}
      filtersData={filters}
      cookie="portfolioWorksFilters"
      columns={columnMapping}
      totalValues={34}
      url="obras-carteira"
    />
  );
}
