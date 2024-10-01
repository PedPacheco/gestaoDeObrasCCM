import PortfolioWorks from "@/components/portfolioWorks/MainPortfolioWorks";
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

  return <PortfolioWorks data={data} token={token} filters={filters} />;
}
