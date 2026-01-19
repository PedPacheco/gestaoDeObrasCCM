import { cookies } from "next/headers";

import { fetchFilters } from "@/actions/fetchFilters.action";
import { ErrorDashboard } from "@/components/reportErrors/errorDashboard";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export type TabItem = {
  id: string;
  label: string;
  icon:
    | "ExclamationCircleIcon"
    | "ArrowTrendingUpIcon"
    | "ExclamationTriangleIcon"
    | "DocumentIcon"
    | "CalendarDateRangeIcon";
  count: number;
};

export default async function ErrorsReportPage() {
  const cookieStore = await cookies();
  const cookieParams = cookieStore.get("errorsReportFilter")?.value;
  const token = cookieStore.get("token")?.value;

  let params = cookieParams ? JSON.parse(cookieParams) : undefined;

  const filters = await fetchFilters({
    regional: true,
  });

  return (
    <EmotionCacheProvider>
      <ErrorDashboard
        regionalValues={filters.regional}
        token={token || ""}
        initialParams={params}
      />
    </EmotionCacheProvider>
  );
}
