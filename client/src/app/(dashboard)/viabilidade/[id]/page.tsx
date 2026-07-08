// app/obras/[id]/viabilidade/page.tsx

import { fetchData } from "@/actions/fetchData.action";
import { FeasibiltyUpload } from "@/components/feasibility/feasibilityImport";
import { cookies } from "next/headers";

interface Props {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    id_status: string;
  }>;
}

const FETCH_OPTIONS = { cache: "no-store" } as const;

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const { id_status } = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const [
    servicesData,
    filters,
    contracts,
    materials,
    files,
    feasibilityRejectionsHistoryData,
  ] = await Promise.all([
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/${id}`,
      undefined,
      token,
      FETCH_OPTIONS,
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/filtros/${id}`,
      undefined,
      token,
      FETCH_OPTIONS,
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/contratos/${id}`,
      undefined,
      token,
      FETCH_OPTIONS,
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/materiais`,
      undefined,
      token,
      FETCH_OPTIONS,
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/viabilidade/${id}`,
      undefined,
      token,
      FETCH_OPTIONS,
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/viabilidade/reprovacoes/${id}`,
      undefined,
      token,
      FETCH_OPTIONS,
    ),
  ]);

  return (
    <FeasibiltyUpload
      idWork={id}
      servicesData={servicesData.data}
      contracts={contracts.data}
      materials={materials.data}
      filters={filters.data}
      statusWork={id_status}
      existingFiles={files.data}
      feasibilityRejectionsHistoryData={feasibilityRejectionsHistoryData.data}
    />
  );
}
