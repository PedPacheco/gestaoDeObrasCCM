import MainAllWorks from "@/components/worksComponents/allWorks/MainAllWorks";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import { cookies } from "next/headers";

export default async function AllWorks() {
  const filters = await fetchFilters({
    regional: true,
    parceira: true,
    tipo: true,
    municipio: true,
    grupo: true,
    status: true,
  });

  const cookieStore = cookies();

  const { token, data } = await fetchData(
    `${process.env.NEXT_PUBLIC_API_URL}/obras`,
    undefined,
    cookieStore.get("token")?.value,
    { cache: "no-store" }
  );

  const columnMapping = {
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
      data={data}
      token={token}
      filters={filters}
      columns={columnMapping}
    />
  );
}
