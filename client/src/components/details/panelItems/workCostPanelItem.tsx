import { FormatCurrency } from "@/utils/formatValue";
import DataItem from "../workDetails/dataItem";

export default function WorkCostPanelItem({ data }: Record<string, any>) {
  return (
    <div className="flex flex-col overflow-y-auto w-full h-full py-8 xl:flex-row xl:justify-around">
      <div className="flex flex-col items-center">
        <p className="text-lg mb-4 font-semibold text-center w-full">
          Valores de CAPEX
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center w-full">
          <div className="flex flex-col mr-4 mt-6">
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-bold min-w-32 px-2 lg:min-w-36 text-center xl:text-lg">
                Material
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-bold min-w-32 px-2 lg:min-w-36 text-center xl:text-lg">
                Serviço
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-bold min-w-32 px-2 lg:min-w-36 text-center xl:text-lg">
                Capex Total
              </p>
            </div>
          </div>
          <div className="flex flex-col mr-4">
            <p className="mb-2 text-end mr-14 font-semibold">Planejado</p>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mat_plan)}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mo_plan)}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mat_plan + data.capex_mo_plan)}
              </p>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="mb-2 text-center font-semibold">Pendente</p>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mat_pend)}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mo_pend)}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mat_pend + data.capex_mo_pend)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <p className="text-lg mb-4 font-semibold text-center w-full">
          Valores Mão de Obra
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center w-full">
          <div className="flex flex-col mr-4 mt-6">
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-bold min-w-32 px-2 lg:min-w-36 text-center xl:text-lg">
                Planejado
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-bold min-w-32 px-2 lg:min-w-36 text-center xl:text-lg">
                Executado
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-bold min-w-32 px-2 lg:min-w-36 text-center xl:text-lg">
                Pendente
              </p>
            </div>
          </div>

          <div className="flex flex-col mr-4">
            <p className="mb-2 text-end mr-14 font-semibold">Planejado</p>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.mo_planejada)}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {data.mo_pend !== undefined ? FormatCurrency(data.mo_pend) : ""}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mat_plan + data.capex_mo_plan)}
              </p>
            </div>
          </div>

          <div className="flex flex-col">
            <p className="mb-2 text-center font-semibold">Ponto a Ponto</p>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.moPlanejadaPontoAPonto)}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.moExecutadoPontoAPonto)}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.moPendentePontoAPonto)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center h-40">
        <p className="text-lg mb-4 font-semibold text-center w-full">
          Quantidade física
        </p>
        <div className="flex items-center justify-center mt-6">
          <div className="flex flex-col mr-4">
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-bold min-w-32 px-2 lg:min-w-36 text-center xl:text-lg">
                Planejado
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-bold min-w-32 px-2 lg:min-w-36 text-center xl:text-lg">
                Pendente
              </p>
            </div>
          </div>

          <div className="flex flex-col mr-4">
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {data.qtde_planejada}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-12 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {data.qtde_pend}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
