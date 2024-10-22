import PortfolioWorks from "@/components/worksComponents/portfolioWorks/MainPortfolioWorks";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import { cookies } from "next/headers";

export default async function WorksInPortfolio() {
  const filters = await fetchFilters({
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
  });

  const cookieStore = cookies();

  const { token, data } = await fetchData(
    `${process.env.NEXT_PUBLIC_API_URL}/obras/obras-carteira`,
    undefined,
    cookieStore.get("token")?.value,
    { cache: "no-store" }
  );

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
    qtde_pend: "Qtde pendente",
    contagem_ocorrencias: "!",
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
    <PortfolioWorks
      data={data}
      token={token}
      filters={filters}
      columns={columnMapping}
      url="obras-carteira"
      totalValues={34}
    />
  );
}
