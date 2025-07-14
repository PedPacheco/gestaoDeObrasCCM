import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { cookies } from "next/headers";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import TabPanel from "@/components/details/TabPanel";
import { WorkDetails } from "@/components/details/workDetails/workDetails";
import { formatPercentage } from "@/utils/formatValue";

dayjs.extend(utc);

interface DataResponse {
  data: Record<string, any>;
}

export default async function Details({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();

  const [options, workData, executionReportData] = await Promise.all([
    fetchFilters({
      restricao: true,
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
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
    fetchData(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-execucao/${id}`,
      undefined,
      cookieStore.get("token")?.value,
      { cache: "no-store" }
    ),
  ]);

  const { token, data } = workData;

  const entrada = data.entrada && dayjs(data.entrada);
  const prazo = data.prazo;
  const prazoFinal = entrada.add(prazo, "day");

  const data_conclusao =
    data.data_conclusao &&
    dayjs(data.data_conclusao).utc().format("DD/MM/YYYY");

  const dataEmpreitamento =
    data.data_empreitamento &&
    dayjs(data.data_empreitamento).utc().format("DD/MM/YYYY");

  const backgroundColor =
    data.grupo !== 2
      ? ""
      : data.ano_plan === dayjs().year()
      ? "bg-green-600"
      : "bg-red-600 text-zinc-100";

  const formattedData = {
    entrada: entrada.format("DD/MM/YYYY"),
    prazo,
    prazoFinal: prazoFinal.format("DD/MM/YYYY"),
    data_conclusao,
    dataEmpreitamento,
    backgroundColor,
    executadoFormatted: formatPercentage(data.executado) || "",
  };

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full mt-6 flex flex-col">
        <WorkDetails
          data={data}
          idWork={Number(id)}
          formattedData={formattedData}
          options={options}
        />
        <TabPanel
          workData={data}
          options={options}
          executionReportData={executionReportData.data}
        />
      </div>
    </div>
  );
}
