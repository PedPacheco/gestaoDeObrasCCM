"use client";

import DataItem from "../dataItem";

export default function PanelItemLaborCosts({ data }: Record<string, any>) {
  return (
    <div className="flex flex-col items-center h-full w-full">
      <div className="flex flex-col items-center">
        <p className="text-lg mb-4 font-semibold text-start w-full">
          Valores mão de obra
        </p>
        <DataItem label="MO plan" value={data.mo_planejada?.toFixed(2)} />
        <DataItem label="MO final" value={data.mo_final?.toFixed(2)} />
      </div>
      <div className="flex flex-col items-center">
        <p className="text-lg mb-4 font-semibold text-start w-full">
          Valores de quantidade
        </p>
        <DataItem label="MO plan" value={data.qtde_planejada?.toFixed(2)} />
        <DataItem label="MO Pend" value={data.qtde_pend?.toFixed(2)} />
      </div>
      <div className="flex flex-col items-center">
        <p className="text-lg mb-4 font-semibold text-start w-full">
          Valores Capex
        </p>
        <div className="flex flex-col justify-between items-center w-full">
          <div className="flex flex-col">
            <p className="mb-2 text-center">PLAN</p>
            <DataItem
              label="Capex MAT"
              value={data.capex_mat_plan?.toFixed(2)}
            />
            <DataItem label="Capex MO" value={data.capex_mo_plan?.toFixed(2)} />
            <DataItem
              label="Capex Total"
              value={data.capex_mo_plan?.toFixed(2)}
            />
          </div>
          <div className="flex flex-col">
            <p className="mb-2 text-center">PEND</p>
            <DataItem
              label="Capex MAT"
              value={data.capex_mat_pend?.toFixed(2)}
            />
            <DataItem label="Capex MO" value={data.capex_mo_pend?.toFixed(2)} />
            <DataItem
              label="Capex Total"
              value={data.capex_mo_pend?.toFixed(2)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
