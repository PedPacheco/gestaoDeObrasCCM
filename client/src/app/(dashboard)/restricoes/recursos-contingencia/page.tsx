import { fetchData } from "@/actions/fetchData.action";
import { ErrorThrower } from "@/components/common/ErrorThrower";

import { fetchFilters } from "@/actions/fetchFilters.action";
import { ContingencyMain } from "@/components/contingency/contingencyMain";
import { EmotionCacheProvider } from "@/theme/emotionCache";
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

export interface ContingencyDashboardData {
  partners: CountItem[];
  laborTypes: CountItem[];
  teamTypes: CountItem[];
  csds: CountItem[];
  recentAnswers: { date: string; name: string | null }[];
  monthlyCapacity: { capacity: number | null; value: number | null }[];
  emergencyTeams: { value: number | null; quantity: number | null }[];
  allocatedPercentage: number;
}

export default async function ContingencyResources() {
  const cookieStore = await cookies();

  const [partnerOptions, dashboard] = await Promise.all([
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
      <ContingencyMain
        data={data}
        partnerOptions={partnerOptions}
        token={token}
      />
    </EmotionCacheProvider>
  );
}
