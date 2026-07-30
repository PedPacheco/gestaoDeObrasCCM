// app/obras/[id]/viabilidade/page.tsx

import { fetchData } from "@/actions/fetchData.action";
import { FeasibiltyUpload } from "@/components/feasibility/feasibilityImport";
import { FeasibilityWorkflowStatus } from "@/utils/feasibilityWorkflow";
import { cookies } from "next/headers";

interface Props {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status: FeasibilityWorkflowStatus;
    ponto_a_ponto?: string;
  }>;
}

const FETCH_OPTIONS = { cache: "no-store" } as const;

export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const { status, ponto_a_ponto } = await searchParams;

  const pointByPoint = ponto_a_ponto === "true";

  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const userInfo = cookieStore.get("userInfo")?.value;

  const user = userInfo ? JSON.parse(userInfo) : null;

  const [
    servicesData,
    contracts,
    materials,
    feasibilityData,
    feasibilityRejectionsHistoryData,
  ] = await Promise.all([
    ponto_a_ponto
      ? fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/servicos/todos/${id}`,
          undefined,
          token,
          FETCH_OPTIONS,
        )
      : null,
    ponto_a_ponto
      ? fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/servicos/contratos/${id}`,
          undefined,
          token,
          FETCH_OPTIONS,
        )
      : null,
    ponto_a_ponto
      ? fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/servicos/materiais`,
          undefined,
          token,
          FETCH_OPTIONS,
        )
      : null,
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

  const userAuthorizedForApproval =
    (user.id_area === 8 &&
      user.permissao_edicao &&
      user.tipo_usuario === "INTERNO") ||
    user.is_admin;

  return (
    <FeasibiltyUpload
      idWork={id}
      servicesData={servicesData?.data ?? null}
      contracts={contracts?.data ?? null}
      materials={materials?.data ?? null}
      workflowStatus={status}
      feasibilityData={feasibilityData.data}
      pointByPoint={pointByPoint}
      isApprover={userAuthorizedForApproval}
      feasibilityRejectionsHistoryData={feasibilityRejectionsHistoryData.data}
    />
  );
}
