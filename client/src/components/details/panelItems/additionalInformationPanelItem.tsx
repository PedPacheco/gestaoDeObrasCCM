"use client";

import dayjs from "dayjs";

export default function AdditionalInformationPanelItem({
  data,
}: Record<string, any>) {
  const dataEmpreitamento = dayjs(data.data_empreitamento).format("DD/MM/YYYY");

  return (
    <div className="flex flex-col py-4">
      <div className="flex flex-col h-full w-full pb-4 justify-around lg:flex-row">
        <div className="flex flex-col items-center h-20">
          <p className="text-lg mb-4 font-semibold text-center w-full">
            Tipo ADS
          </p>
          <p>{data.tipo_ads}</p>
        </div>
        <div className="flex flex-col items-center h-20">
          <p className="text-lg mb-4 font-semibold text-center w-full">
            Data empreitamento
          </p>
          <p>{dataEmpreitamento}</p>
        </div>
        <div className="flex flex-col items-center h-20">
          <p className="text-lg mb-4 font-semibold text-center w-full">
            Empreendimento
          </p>
          <p>{data.Empreendimento}</p>
        </div>
        <div className="flex flex-col items-center h-20">
          <p className="text-lg mb-4 font-semibold text-center w-full">
            Ano Planejamento
          </p>
          <p>2024</p>
        </div>
      </div>
      <div className="h-48">
        <p className="text-lg mb-4 font-semibold text-center w-full">
          Observação da obra
        </p>
        <p>{data.observ_obra}</p>
      </div>
    </div>
  );
}
