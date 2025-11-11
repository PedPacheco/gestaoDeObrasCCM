import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { MainExecutionCapacity } from "@/components/executionCapacity/mainExecutionCapacity";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExecutionCapacity() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("executionCapacityFilters")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  const filtersValues = {
    ...params?.selectedItems,
    year: "2025",
  };

  const [filters, executionCapacityData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/capacidade-execucao`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
  ]);

  const columns = {
    regional: "Regional",
    parceira: "Parceira",
    ano: "Ano",
    equipe: "Equipe",
    tipo: "Tipo",
    qtd_equipes_rfp: "RFP",
    jan: "Janeiro",
    fev: "Fevereiro",
    mar: "Março",
    abr: "Abril",
    mai: "Maio",
    jun: "Junho",
    jul: "Julho",
    ago: "Agosto",
    set: "Setembro",
    out: "Outubro",
    nov: "Novembro",
    dez: "Dezembro",
  };

  const { token, data } = executionCapacityData;

  return (
    <EmotionCacheProvider>
      <MainExecutionCapacity
        columns={columns}
        data={data}
        token={token}
        filtersData={filters}
      />
    </EmotionCacheProvider>
  );
}
