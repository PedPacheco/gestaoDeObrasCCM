import DataItem from "@/components/details/dataItem";
import TabPanel from "@/components/details/TabPanel";
import { fetchData } from "@/actions/fetchData.action";
import dayjs from "dayjs";
import { cookies } from "next/headers";
import { formatPercentage } from "@/utils/formatValue";
import { fetchFilters } from "@/actions/fetchFilters.action";

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
    data.data_conclusao && dayjs(data.data_conclusao).format("DD/MM/YYYY");

  const dataEmpreitamento =
    data.data_empreitamento &&
    dayjs(data.data_empreitamento).format("DD/MM/YYYY");

  const backgroundColor =
    data.grupo !== 2
      ? ""
      : data.ano_plan === dayjs().year()
      ? "bg-green-600"
      : "bg-red-600 text-zinc-100";

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="w-full mt-6 flex flex-col">
        <p className="text-2xl mb-4 font-extrabold ml-2 md:ml-8">
          Informações gerais
        </p>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 md:px-4 w-full">
          <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
            <DataItem label="Ov/Nota" value={data.ovnota} />
            <DataItem label="Tipo" value={data.tipos} />
            <DataItem label="Municipio" value={data.municipios} />
            <DataItem label="Referência" value={data.referencia} />
            <DataItem label="Circuitos" value={data.circuitos} />
            <DataItem label="Conjunto" value={data.conjunto} />
          </div>
          <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
            <DataItem label="Pep" value={data.pep} status={data.status_pep} />
            <DataItem
              label="Diagrama"
              value={data.diagrama}
              status={data.status_diagrama}
            />
            <DataItem
              label="Ordem DCI"
              value={data.ordem_dci}
              status={data.status_170}
            />
            <DataItem
              label="Ordem DCD"
              value={data.ordem_dcd}
              status={data.status_190}
            />
            <DataItem
              label="Ordem DCA"
              value={data.ordem_dca}
              status={data.status_150}
            />
            <DataItem
              label="Ordem DCIM"
              value={data.ordem_dcim}
              status={data.status_180}
            />
          </div>
          <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
            <DataItem label="Entrada" value={entrada.format("DD/MM/YYYY")} />
            <DataItem label="Prazo" value={prazo} />
            <DataItem
              label="Data prazo final"
              value={prazoFinal.format("DD/MM/YYYY")}
            />
            <DataItem label="Data empreitamento" value={dataEmpreitamento} />
            <DataItem label="Tipo ADS" value={data.tipo_ads} />

            <DataItem
              label="Ano planejamento"
              value={data.ano_plan}
              background={backgroundColor}
            />
          </div>
          <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
            <DataItem label="Parceira" value={data.turmas} />
            <DataItem label="Status Sap" value={data.status_ov_sap} />
            <DataItem label="Status" value={data.status} />
            <DataItem label="Empreendimento" value={data.empreendimento} />
            <DataItem
              label="Executado"
              value={formatPercentage(data.executado) || ""}
            />
            <DataItem label="Data conclusão" value={data_conclusao} />
          </div>
        </div>

        <div className="w-[95%] flex justify-between items-start mb-3 self-center border border-zinc-700 border-solid px-2 rounded-md">
          <p className="h-full xl:text-lg font-semibold min-w-28 text-center border-r border-zinc-700 border-solid flex items-center justify-start">
            Observação
          </p>
          <p className="w-full xl:text-lg font-medium text-start pl-5 py-2">
            {data.observ_obra}
          </p>
        </div>

        <TabPanel
          workData={data}
          options={options}
          executionReportData={executionReportData.data}
        />
      </div>
    </div>
  );
}
