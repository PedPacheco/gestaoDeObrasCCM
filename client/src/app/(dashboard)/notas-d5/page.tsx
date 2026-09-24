import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Transform } from "@/utils/transform";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import D5NotesMain from "@/components/d5Notes/d5NotesMain";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function D5NotesPage() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("d5NotesFilters")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  const filtersValues = {
    ...Transform(params?.selectedItems || {}),
    page: "0",
  };

  const [filters, worksData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      status: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/notas-d5`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
  ]);

  if (!worksData.success) {
    return <ErrorThrower message={worksData.message} />;
  }

  const { data, token } = worksData;

  const columnMapping = {
    id: "ID",
    nota_d5: "Nota D5",
    obra: "Ov/Nota",
    ordemDiagrama: "Ordem/Diagrama",
    regional: "Regional",
    municipio: "Municipio",
    parceira: "Parceira",
    tipoObra: "Tipo",
    criado_em: "Criado em",
    conclusao_nota: "Data de conclusão",
    status: "Status da Nota",
    tme_abertura: "TME Abertura",
    tme_executado: "TME Executado",
    validacao_anual: "Validação Anual",
    mo_planejada: "MO Plan",
  };

  return (
    <EmotionCacheProvider>
      <D5NotesMain
        data={data.d5Notes}
        token={token}
        cookie="d5NotesFilters"
        columns={columnMapping}
        filtersData={filters}
        totals={data.totals}
      />
    </EmotionCacheProvider>
  );
}
