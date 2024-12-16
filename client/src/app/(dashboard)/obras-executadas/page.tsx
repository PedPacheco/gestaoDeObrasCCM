import PortfolioWorks from "@/components/worksComponents/portfolioWorks/MainPortfolioWorks";
import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { cookies } from "next/headers";

export default async function CompletedWorks() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("completedWorksFilters")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;

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
      ovnotaExec: true,
      empreendimento: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/obras/obras-executadas`,
      params,
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
    <PortfolioWorks
      filters={filters}
      data={data}
      token={token}
      columns={columns}
      cookie="completedWorksFilters"
      url="obras-executadas"
      totalValues={25}
    />
  );
}
