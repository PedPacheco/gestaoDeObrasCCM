import { fetchData } from "@/actions/fetchData.action";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import { MainContingencia } from "@/components/contingencia/MainContingencia";

import { EmotionCacheProvider } from "@/theme/emotionCache";
import { fetchFilters } from "@/actions/fetchFilters.action";
import dayjs from "dayjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export interface CountItem {
  name: string;
  value: number;
}

export interface RecentResponse {
  date: string;
  nome: string | null;
}

export interface ContingencyDashboardInterface {
  recentDates: RecentResponse[];
  porcentagemCedida: number;
  capacidadeMes: {
    ano: string;
    mes: number;
    capacidade: number;
    valor: number;
  }[];
  equipesEmergencia: {
    ano: number;
    mes: number;
    quantidade: number;
    valor: number;
  }[];
  parceira: CountItem[];
  maoObra: CountItem[];
  equipe: CountItem[];
  csd: CountItem[];
}

export default async function RecursosContingencia() {
  const cookieStore = await cookies();

  const [optionsPartner, dashboard] = await Promise.all([
    fetchFilters({
      parceira: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/recursos-contingencia/dashboard`,
      {
        dataInicial: dayjs().startOf("month").format("DD/MM/YYYY"),
        dataFinal: dayjs().endOf("month").format("DD/MM/YYYY"),
      },
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
  ]);

  if (!dashboard.success) {
    return <ErrorThrower message={dashboard.message} />;
  }

  const { token, data } = dashboard;

  return (
    <EmotionCacheProvider>
      <MainContingencia
        data={data}
        optionsPartner={optionsPartner}
        token={token}
      />
    </EmotionCacheProvider>
  );
}
