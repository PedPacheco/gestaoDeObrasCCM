import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import PortfolioWorks from "@/components/worksComponents/portfolioWorks/MainPortfolioWorks";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Transform } from "@/utils/transform";
import { ErrorThrower } from "@/components/common/ErrorThrower";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorksInPortfolio() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("portfolioWorksFilters")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  const filtersValues = {
    ...Transform(params?.selectedItems || {}),
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
      empreendimento: true,
      statusSap: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/obras/obras-carteira`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
  ]);

  if (!worksData.success) {
    return <ErrorThrower message={worksData.message} />;
  }

  const { data, token } = worksData;

  const filteredStatus = filters.status.filter(
    (item: { id: number }) => ![2, 3].includes(item.id),
  );

  const columnMapping = {
    id: "ID",
    ovnota: "Ovnota",
    ordem_principal: "Ordem DCI/Diagrama",
    ordem_dcd: "Ordem DCD",
    ordem_dca: "Ordem DCA",
    ordem_dcim: "Ordem DCIM",
    status_ov_sap: "Status SAP",
    pep: "Pep",
    mun: "Municipio",
    turma: "Parceira",
    prazo: "Prazo",
    prazo_fim: "Prazo Fim",
    status_prazo: "Status prazo",
    ano_plan: "Ano do Plano",
    abrev_regional: "Regional",
    tipo_obra: "Tipo",
    qtde_planejada: "Qtde plan",
    qtde_pend: "Qtde pend",
    contagem_ocorrencias: "!",
    total_prog: "Total Programado",
    total_exec: "Total Executado",
    total_pend: "Total Pendente",
    total_equipe_lm: "Total Equipe LM",
    total_equipe_lv: "Total Equipe LV",
    total_equipe_reg: "Total Equipe Reg",
    circuito: "Circuito",
    mo_planejada: "MO Plan",
    mo_final: "MO Executada",
    mo_pend: "MO Pendente",
    status: "Status da Obra",
    conjunto: "Conjunto",
    data_empreitamento: "Data empreitamento",
    empreendimento: "Empreendimento",
    total_obras: "Total de obras",
    total_mo_planejada: "Total MO planejada",
    total_mo_exec: "Total MO executada",
    total_mo_pend: "Total MO Pendente",
    total_qtde_planejada: "Total QTDE planejada",
    total_qtde_pend: "Total QTDE pend",
  };

  return (
    <EmotionCacheProvider>
      <PortfolioWorks
        data={data}
        token={token}
        filtersData={{ ...filters, status: filteredStatus }}
        cookie="portfolioWorksFilters"
        columns={columnMapping}
        totalValues={33}
        url="obras-carteira"
      />
    </EmotionCacheProvider>
  );
}
