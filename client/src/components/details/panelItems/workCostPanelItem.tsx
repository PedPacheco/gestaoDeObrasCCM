import { FormatCurrency } from "@/utils/formatValue";
import DataItem from "../workDetails/dataItem";

export default function WorkCostPanelItem({ data }: Record<string, any>) {
  return (
    <div className="flex flex-col max-h-[320px] overflow-y-auto w-full py-8 xl:flex-row xl:justify-around">
      <div className="flex flex-col items-center">
        <p className="text-lg mb-4 font-semibold text-center w-full">
          Valores de CAPEX
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center w-full">
          <div className="flex flex-col mr-4">
            <p className="mb-2 text-end mr-14 font-semibold">Planejado</p>
            <DataItem
              label="Material"
              value={FormatCurrency(data.capex_mat_plan)}
            />
            <DataItem
              label="Serviço"
              value={FormatCurrency(data.capex_mo_plan)}
            />
            <DataItem
              label="CAPEX Total"
              value={FormatCurrency(data.capex_mo_plan)}
            />
          </div>
          <div className="flex flex-col">
            <p className="mb-2 text-center font-semibold">Pendente</p>
            <div className="flex items-center justify-between mb-3 h-14 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mat_pend)}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-14 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mo_pend)}
              </p>
            </div>
            <div className="flex items-center justify-between mb-3 h-14 border border-zinc-700 border-solid px-2 rounded-md bg-zinc-200">
              <p className="flex-1 font-medium min-w-32 px-2 lg:min-w-36 text-center">
                {FormatCurrency(data.capex_mo_pend)}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center h-40">
        <p className="text-lg mb-4 font-semibold text-center w-full">
          Valores de Mão de obra
        </p>
        <DataItem label="Planejado" value={FormatCurrency(data.mo_planejada)} />
        <DataItem
          label="Final"
          value={
            data.mo_final !== undefined ? FormatCurrency(data.mo_final) : ""
          }
        />
      </div>
      <div className="flex flex-col items-center h-40">
        <p className="text-lg mb-4 font-semibold text-center w-full">
          Quantidade física
        </p>
        <DataItem label="Planejado" value={data.qtde_planejada} />
        <DataItem label="Pendente" value={data.qtde_pend} />
      </div>
    </div>
  );
}
