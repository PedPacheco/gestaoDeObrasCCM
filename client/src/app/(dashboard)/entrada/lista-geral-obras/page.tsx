import MainAllWorks from "@/components/allWorks/MainAllWorks";
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
    "http://localhost:3333/obras",
    undefined,
    cookieStore.get("token")?.value,
    { cache: "no-store" }
  );

  return <MainAllWorks data={data} token={token} filters={filters} />;
}
