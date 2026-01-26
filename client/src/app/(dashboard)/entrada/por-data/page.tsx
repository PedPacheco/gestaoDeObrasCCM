import dayjs from "dayjs";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainEntryByDate from "@/components/entryComponents/entryByDate/MainEntryByDate";
import { Transform } from "@/utils/transform";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { ErrorThrower } from "@/components/common/ErrorThrower";

export const dynamic = "force-dynamic";

export default async function EntryForDate() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("entryByDateFilters")?.value;

  const params = cookieParams ? JSON.parse(cookieParams) : undefined;
  let filtersValues = undefined;

  if (params) {
    const formattedSelectedItems = Transform(params.selectedItems);

    filtersValues = {
      ...formattedSelectedItems,
      dataInicial: params.startDate,
      dataFinal: params.endDate,
    };
  } else {
    filtersValues = {
      dataInicial: dayjs().format("DD/MM/YYYY"),
      dataFinal: dayjs().format("DD/MM/YYYY"),
    };
  }

  const [filters, entryData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      circuito: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/entrada/data`,
      filtersValues,
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
  ]);

  if (!entryData.success) {
    return <ErrorThrower message={entryData.message} />;
  }

  const { token, data } = entryData;

  const columnMapping = {
    ovnota: "Ovnota",
    pep: "Pep",
    diagrama: "Diagrama",
    ordem_dci: "Ordem DCI",
    ordem_dcd: "Ordem DCD",
    ordem_dca: "Ordem DCA",
    ordem_dcim: "Ordem DCIM",
    entrada: "Entrada",
    prazo: "Prazo",
    prazo_fim: "Prazo Fim",
    qtde_planejada: "Qtde Planejada",
    mo_planejada: "MO Planejada",
    observ_obra: "Observação",
    tipo_obra: "Tipo de Obra",
    turma: "Turma",
    mun: "Município",
    total_obras: "Total Obras",
    total_mo_planejada: "Total MO Planejada",
    total_qtde_planejada: "Total Qtde Planejada",
  };

  return (
    <EmotionCacheProvider>
      <MainEntryByDate
        data={data}
        token={token}
        filtersData={filters}
        columns={columnMapping}
      />
    </EmotionCacheProvider>
  );
}
