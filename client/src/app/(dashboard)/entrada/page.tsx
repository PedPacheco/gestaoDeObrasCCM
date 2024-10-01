import MainEntry from "@/components/entry/MainEntry";
import { fetchData } from "@/services/fetchData";
import { fetchFilters } from "@/services/fetchFilters";
import { cookies } from "next/headers";

export default async function Entry() {
  const filters = await fetchFilters({
    regional: true,
    parceira: true,
    tipo: true,
    municipio: true,
    grupo: true,
    circuito: true,
  });

  const cookieStore = cookies();

  const { token, data } = await fetchData(
    `http://localhost:3333/entrada?ano=${new Date().getFullYear()}`,
    undefined,
    cookieStore.get("token")?.value
  );

  return <MainEntry data={data} filters={filters} token={token} />;
}
