import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { NewManageSchedule } from "@/components/services/manageSchedule";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ServicosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();

  const rawCookie = cookieStore.get("form-data")?.value;
  const idStatusWorkCookie = cookieStore.get("idStatusWork")?.value;
  const statusSchedule = cookieStore.get("statusSchedule")?.value;
  const ordemDcim = cookieStore.get("ordemDcim")?.value;

  const formData = rawCookie ? JSON.parse(rawCookie) : null;

  const hasOrdemDcim = !!ordemDcim && ordemDcim.trim() !== "";

  const [
    options,
    servicesData,
    scheduledServicesData,
    serviceContractData,
    serviceTeams,
    scheduledServicesHistory,
    materialsData,
    optionsToAddItem,
  ] = await Promise.all([
    fetchFilters({
      restricao: true,
      tecnico: true,
    }),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/${id}`,
      undefined,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
    fetchData(
      `${
        process.env.NEXT_PUBLIC_API_URL
      }/servicos/selecionados/${id}?idProgramacao=${
        formData?.id ? formData.id : "1"
      }`,
      undefined,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/contratos/${id}`,
      undefined,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/equipes/${id}`,
      undefined,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/historico/${id}`,
      undefined,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/materiais`,
      undefined,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/opcoes/${id}`,
      undefined,
      cookieStore.get("token")?.value,
      { cache: "no-store" },
    ),
  ]);

  return (
    <EmotionCacheProvider>
      <NewManageSchedule
        scheduleData={formData}
        scheduledServicesData={scheduledServicesData.data}
        servicesData={servicesData.data}
        serviceContractData={serviceContractData.data}
        materialsData={materialsData.data}
        scheduledServicesHistory={scheduledServicesHistory.data}
        serviceTeams={serviceTeams.data}
        isInsert={formData?.id ? false : true}
        options={options}
        idWork={Number(id)}
        idStatusWork={Number(idStatusWorkCookie)}
        idSchedule={Number(formData?.id)}
        statusSchedule={statusSchedule || ""}
        optionsToAddItem={optionsToAddItem.data}
        hasOrdemDcim={hasOrdemDcim}
      />
    </EmotionCacheProvider>
  );
}
