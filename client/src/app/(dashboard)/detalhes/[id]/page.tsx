import DataItem from "@/components/details/dataItem";
import TabPanel from "@/components/details/TabPanel";
import { fetchData } from "@/services/fetchData";
import dayjs from "dayjs";
import { cookies } from "next/headers";

interface DataResponse {
  data: Record<string, any>;
}

export default async function Details({ params }: { params: { id: string } }) {
  const cookieStore = cookies();

  const { token, data } = await fetchData<DataResponse>(
    `http://localhost:3333/obras/${params.id}`,
    undefined,
    cookieStore.get("token")?.value
  );

  const entrada = dayjs(data.data.entrada);
  const prazo = data.data.prazo;
  const data_conclusao =
    data.data.data_conclusao === null
      ? ""
      : dayjs(data.data.data_conclusao).format("DD/MM/YYYY");

  console.log(data.data.data_conclusao);

  const prazoFinal = entrada.add(prazo, "day");

  return (
    <div className="flex flex-col items-center w-full h-full overflow-y-auto">
      <div className="w-full h-full mt-6 flex flex-col">
        <p className="lg:text-xl xl:text-2xl mb-4 font-semibold ml-2 md:ml-8">
          Informações gerais
        </p>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 mb-4 md:px-10">
          <div className="flex flex-col items-start col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
            <DataItem label="Ov/Nota" value={data.data.ovnota} />
            <DataItem
              label="Pep"
              value={data.data.pep}
              status={data.data.status_pep}
            />
            <DataItem
              label="Diagrama"
              value={data.data.diagrama}
              status={data.data.status_diagrama}
            />
            <DataItem label="Status Sap" value={data.data.status_ov_sap} />
            <DataItem label="Status" value={data.data.status} />
          </div>
          <div className="flex flex-col items-start col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
            <DataItem
              label="Ordem DCI"
              value={data.data.ordem_dci}
              status={data.data.status_170}
            />
            <DataItem
              label="Ordem DCD"
              value={data.data.ordem_dcd}
              status={data.data.status_190}
            />
            <DataItem
              label="Ordem DCA"
              value={data.data.ordem_dca}
              status={data.data.status_150}
            />
            <DataItem
              label="Ordem DCIM"
              value={data.data.ordem_dcim}
              status={data.data.status_180}
            />
            <DataItem label="Tipo" value={data.data.tipos} />
          </div>
          <div className="flex flex-col items-start col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
            <DataItem label="Entrada" value={entrada.format("DD/MM/YYYY")} />
            <DataItem label="Prazo" value={prazo} />
            <DataItem
              label="Data prazo final"
              value={prazoFinal.format("DD/MM/YYYY")}
            />
            <DataItem label="Data conclusão" value={data_conclusao} />
            <DataItem label="Executado" value={data.data.executado} />
          </div>
          <div className="flex flex-col items-start col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
            <DataItem label="Parceira" value={data.data.turmas} />
            <DataItem label="Municipio" value={data.data.municipios} />
            <DataItem label="referencia" value={data.data.referencia} />
            <DataItem label="Circuitos" value={data.data.circuitos} />
            <DataItem label="Conjunto" value={data.data.conjunto} />
          </div>
        </div>

        <TabPanel />
      </div>
    </div>
  );
}