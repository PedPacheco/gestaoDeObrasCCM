import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import MainGoals from "@/components/goalsComponents/MainGoals";
import { Transform } from "@/utils/transform";
import dayjs from "dayjs";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

export default async function RdaGoals() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("rdaGoalsFilters")?.value;
  const token = cookieStore.get("token")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  if (params) {
    params = { ...Transform(params), anoPlan: null, rda: true, btzero: false };
  } else {
    params = {
      ano: dayjs().year().toString(),
      anoPlan: null,
      rda: true,
      btzero: false,
    };
  }

  const [filters, rdaGoalsData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
      empreendimento: true,
    }),

    fetchData(`${process.env.NEXT_PUBLIC_API_URL}/metas`, params, token, {
      cache: "no-store",
    }),
  ]);

  const { data } = rdaGoalsData;

  const columns = {
    regional: "Regional",
    tipo_obra: "Tipo de obra",
    turma: "Contratada",
    anocalc: "Ano",
    empreendimento: "Empreendimento",
    teste: "Teste",
    jan: "Jan",
    fev: "Fev",
    mar: "Mar",
    abr: "Abr",
    mai: "Mai",
    jun: "Jun",
    jul: "Jul",
    ago: "Ago",
    set: "Set",
    out: "Out",
    nov: "Nov",
    dez: "Dez",
    total: "Total",
    carteira: "Carteira",
  };

  return (
    <EmotionCacheProvider>
      <MainGoals
        columns={columns}
        data={data}
        filtersData={filters}
        token={token}
        typeGoals="rda"
      />
    </EmotionCacheProvider>
  );
}
