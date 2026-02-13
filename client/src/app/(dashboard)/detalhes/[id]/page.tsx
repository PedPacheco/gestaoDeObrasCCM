import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { WorkDetails } from "@/components/details/workDetails/workDetails";
import { formatPercentage } from "@/utils/formatValue";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import TabPanel from "@/components/details/tabPanel/TabPanel";

dayjs.extend(utc);

interface DataResponse {
  data: Record<string, any>;
}

interface DetailsParams {
  params: Promise<{ id: string }>;
}

const FETCH_OPTIONS = { cache: "no-store" } as const;

const formatDate = (date: dayjs.Dayjs | null): string => {
  return date ? date.utc().format("DD/MM/YYYY") : "";
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
      tipoRestricao: ["EXECUÇÃO", "PROGRAMAÇÃO", "PUBLICAÇÃO"],
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
    data_conclusao: formatDate(
      data.data_conclusao ? dayjs(data.data_conclusao) : null,
    ),
    dataEmpreitamento: formatDate(
      data.data_empreitamento ? dayjs(data.data_empreitamento) : null,
    ),
    backgroundColor: getBackgroundColor(data.grupo, data.ano_plan),
    executadoFormatted: formatPercentage(data.executado) || "",
  };
}

export default async function Details({ params }: DetailsParams) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  // Buscar todos os dados em paralelo
  const [
    options,
    workData,
    executionReportData,
    rejectionsData,
    feasibilityExists,
  ] = await fetchAllData(id, token);

  // Validação de dados
  if (!workData.success) {
    return <ErrorThrower message={workData.message} />;
  }

  const { data } = workData;
  const formattedData = processWorkData(data);

  return (
    <EmotionCacheProvider>
      <div className="flex flex-col items-center w-full overflow-y-auto h-screen">
        <div className="w-full h-full flex flex-col">
          <WorkDetails
            data={data}
            idWork={Number(id)}
            formattedData={formattedData}
            options={options}
            feasibilityExists={feasibilityExists.data}
          />
          <TabPanel
            workData={data}
            id={id}
            executionReportData={executionReportData.data}
            rejectionsData={rejectionsData.data}
            feasibilityExists={feasibilityExists.data}
          />
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
