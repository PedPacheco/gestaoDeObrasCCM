import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import { MainContingencia } from "@/components/contingencia/MainContingencia";
import { ContingencyDashboard } from "@/components/contingencia/types";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

export default async function RecursosContingencia() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const dashboard = await fetchData(
    `${process.env.NEXT_PUBLIC_API_URL}/recursos-contingencia/dashboard`,
    undefined,
    token,
    { cache: "no-store" },
  );

  if (!dashboard.success) {
    return <ErrorThrower message={dashboard.message} />;
  }

  return (
    <EmotionCacheProvider>
      <MainContingencia data={dashboard.data as ContingencyDashboard} />
    </EmotionCacheProvider>
  );
}
