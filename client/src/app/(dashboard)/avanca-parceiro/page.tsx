import { cookies } from "next/headers";
import dayjs from "dayjs";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import AvancaParceiroDashboard from "@/components/dashboard/AvancaParceiroDashboard";

export const dynamic = "force-dynamic";

export default async function AvancaParceiro() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const year = dayjs().year();
  const defaultParams = {
    dataInicial: `01/01/${year}`,
    dataFinal: `31/12/${year}`,
  };

  const [filtersData, eliminacaoRes, aderenciaRes] = await Promise.all([
    fetchFilters({ parceira: true, regional: true }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/restricao/avanca-parceira`,
      defaultParams,
      token,
      { cache: "no-store" },
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/restricao/aderencia-parceira`,
      defaultParams,
      token,
      { cache: "no-store" },
    ),
  ]);

  if (!eliminacaoRes.success) {
    return <ErrorThrower message={eliminacaoRes.message} />;
  }

  return (
    <AvancaParceiroDashboard
      initialEliminacao={eliminacaoRes.data ?? []}
      initialAderencia={aderenciaRes.success ? (aderenciaRes.data ?? []) : []}
      filtersData={filtersData}
      token={eliminacaoRes.token}
    />
  );
}
