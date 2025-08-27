import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import PortfolioWorks from "@/components/worksComponents/portfolioWorks/MainPortfolioWorks";
import { Transform } from "@/utils/transform";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

export default async function CompletedWorks() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("completedWorksFilters")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;

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

  const [filters, worksCompletedData] = await Promise.all([
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
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/obras/obras-executadas`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
  ]);

  const { token, data } = worksCompletedData;

  const columns = {
    id: "ID",
    ovnota: "Ovnota",
    ordemdiagrama: "Ordem DCI/Diagrama",
    ordem_dcd: "Ordem DCD",
    ordem_dci: "Ordem DCI",
    ordem_dca: "Ordem DCA",
    ordem_dcim: "Ordem DCIM",
    pep: "Pep",
    status_ov_sap: "Status SAP",
    mun: "Municipio",
    abrev_regional: "Regional",
    tipo_obra: "Tipo",
    turma: "Parceira",
    executado: "Executado",
    circuito: "Circuito",
    conjunto: "Conjunto",
    status: "Status",
    entrada: "Entrada",
    prazo: "Prazo",
    prazo_fim: "Prazo Fim",
    mo_planejada: "MO planejada",
    qtde_planejada: "Qtde planejada",
    qtde_pend: "Qtde pendente",
    contagem_ocorrencias: "!",
    observ_obra: "Observação da obra",
    total_obras: "Total de obras",
    total_mo_planejada: "Total MO planejada",
    total_qtde_planejada: "Total QTDE planejada",
  };

  return (
    <EmotionCacheProvider>
      <PortfolioWorks
        filtersData={filters}
        data={data}
        token={token}
        columns={columns}
        cookie="completedWorksFilters"
        totalValues={26}
        url="obras-executadas"
      />
    </EmotionCacheProvider>
  );
}
