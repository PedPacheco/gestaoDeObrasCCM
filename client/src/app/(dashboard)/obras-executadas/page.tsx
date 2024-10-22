import PortfolioWorks from "@/components/worksComponents/portfolioWorks/MainPortfolioWorks";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import { cookies } from "next/headers";

export default async function CompletedWorks() {
  const filters = await fetchFilters({
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
  });

  const cookieStore = cookies();

  const { token, data } = await fetchData(
    `${process.env.NEXT_PUBLIC_API_URL}/obras/obras-executadas`,
    undefined,
    cookieStore.get("token")?.value,
    { cache: "no-store" }
  );

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
      url="obras-executadas"
      totalValues={25}
    />
  );
}
