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
    statusSap: true,
    ovnota: true,
    empreendimento: true,
  });

  const cookieStore = cookies();

  return (
    <div>
      <p>hello world</p>
    </div>
  );
}
