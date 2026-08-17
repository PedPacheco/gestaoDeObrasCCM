import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import NewTabPanel from "@/components/details/tabPanel/newTabPanel";
import { WorkDetails } from "@/components/details/workDetails/workDetails";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { formatPercentage } from "@/utils/formatValue";
import OldTabPanel from "@/components/details/tabPanel/oldTabPanel";

dayjs.extend(utc);

interface DataResponse {
  data: Record<string, any>;
}

interface DetailsParams {
  params: Promise<{ id: string }>;
}

const FETCH_OPTIONS = { cache: "no-store" } as const;

const formatDate = (date: dayjs.Dayjs): string => {
  return date.utc().format("DD/MM/YYYY");
};

const calculateDeadline = (entrada: dayjs.Dayjs, prazo: number) => {
  return entrada.add(prazo, "day");
};

const getBackgroundColor = (grupo: number, anoPlan: number): string => {
  if (grupo !== 2) return "";
  return anoPlan === dayjs().year()
    ? "bg-green-600 text-zinc-100"
    : "bg-red-600 text-zinc-100";
};

// Função para buscar dados em paralelo
async function fetchAllData(id: string, token?: string) {
  return Promise.all([
    fetchFilters({
      restricao: true,
      tipoRestricao: ["EXECUÇÃO", "PROGRAMAÇÃO", "PUBLICAÇÃO", "REPROVADO"],
      tecnico: true,
      municipio: true,
      parceira: true,
      circuito: true,
      status: true,
      empreendimento: true,
      tipo: true,
    }),
    fetchData<DataResponse>(
      `${process.env.NEXT_PUBLIC_API_URL}/obras/${id}`,
      undefined,
      token,
      FETCH_OPTIONS,
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-execucao/${id}`,
      undefined,
      token,
      FETCH_OPTIONS,
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/reprovacoes/${id}`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/restricao/publicacoes/${id}`,
      undefined,
      token,
      FETCH_OPTIONS,
    ),
  ]);
}

// Função para processar dados da obra
function processWorkData(data: any) {
  const entrada = data.entrada ? dayjs(data.entrada) : dayjs();
  const prazo = data.prazo || 0;
  const prazoFinal = calculateDeadline(entrada, prazo);

  return {
    entrada: formatDate(entrada),
    prazo: prazo.toString(),
    prazoFinal: formatDate(prazoFinal),
    data_conclusao: data.data_conclusao
      ? formatDate(dayjs(data.data_conclusao))
      : null,
    dataEmpreitamento: data.data_empreitamento
      ? formatDate(dayjs(data.data_empreitamento))
      : null,
    dataViabilidade: data.data_envio
      ? formatDate(dayjs(data.data_envio))
      : null,
    backgroundColor: getBackgroundColor(data.grupo, data.ano_plan),
    executadoFormatted: formatPercentage(data.executado) || "",
    totalProgramado: formatPercentage(data.totalProgramado) || ""
  };
}

export default async function Details({ params }: DetailsParams) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const userInfo = cookieStore.get("userInfo")?.value;

  const user = userInfo ? JSON.parse(userInfo) : null;

  // Buscar todos os dados em paralelo
  const [
    options,
    workData,
    executionReportData,
    rejectionsData,
    feasibilityData,
    publicationRestriction,
  ] = await fetchAllData(id, token);

  // Validação de dados
  if (!workData.success) {
    return <ErrorThrower message={workData.message} />;
  }

  const { data } = workData;
  const formattedData = processWorkData(data);

  const userPermissionToEdit =
    (user.tipo_usuario === "PARCEIRO" && user.id_turma === 2) ||
    (user.tipo_usuario === "INTERNO" && user.id_regional === 1) ||
    user.is_admin;

  const useNewFlow = data.programacao_ponto_a_ponto && userPermissionToEdit;

  const tabPanelProps = {
    workData: data,
    options,
    id,
    executionReportData: executionReportData.data,
    rejectionsData: rejectionsData.data,
    feasibilityData: feasibilityData.data,
    publicationRestrictionData: publicationRestriction.data,
  };

  return (
    <EmotionCacheProvider>
      <div className="flex flex-col items-center w-full overflow-y-auto h-screen">
        <div className="w-full h-full flex flex-col">
          <WorkDetails
            data={data}
            idWork={data.id}
            formattedData={formattedData}
            options={options}
          />
          {useNewFlow ? (
            <NewTabPanel {...tabPanelProps} />
          ) : (
            <OldTabPanel {...tabPanelProps} />
          )}
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
