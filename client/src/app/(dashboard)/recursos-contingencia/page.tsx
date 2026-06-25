import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import { MainContingencia } from "@/components/contingencia/MainContingencia";

import { EmotionCacheProvider } from "@/theme/emotionCache";
import { fetchFilters } from "@/actions/fetchFilters.action";

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
  total: number;
  recentDates: RecentResponse[];
  totalMaoObra: number;
  totalEquipe: number;
  porcentagemCedida: number | null;
  capacidadeMes: number | null;
  parceira: CountItem[];
  maoObra: CountItem[];
  equipe: CountItem[];
  csd: CountItem[];
}

export default async function RecursosContingencia() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const [optionsPartner, dashboard] = await Promise.all([
    fetchFilters({
      parceira: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/recursos-contingencia/dashboard`,
      undefined,
      token,
      { cache: "no-store" },
    ),
  ]);

  if (!dashboard.success) {
    return <ErrorThrower message={dashboard.message} />;
  }

  return (
    <EmotionCacheProvider>
      <MainContingencia data={dashboard.data} optionsPartner={optionsPartner} />
    </EmotionCacheProvider>
  );
}
