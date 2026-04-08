import { cookies } from "next/headers";

import { fetchFilters } from "@/actions/fetchFilters.action";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import MapaObrasWrapper from "@/components/mapaObras/MapaObrasWrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MapaObrasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return <ErrorThrower message="Token não encontrado" />;
  }

  let filters = { regional: [], municipio: [], parceira: [], tipo: [], status: [] };
  try {
    filters = await fetchFilters({
      regional: true,
      municipio: true,
      parceira: true,
      tipo: true,
      status: true,
      grupo: true,
    });
  } catch {
    // filters remain empty — user can still use the map
  }

  return (
    <div
      className="w-full flex-1 overflow-hidden flex flex-col"
      style={{ height: "calc(100vh - 120px)" }}
    >
      <MapaObrasWrapper filtersData={filters} token={token} />
    </div>
  );
}
