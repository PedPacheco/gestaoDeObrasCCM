interface ValidationOfScheduledServicesProps {
  validationSummary: {
    completo: number;
    reprogramar: number;
    semRealizacao: number;
  };
}

export function ValidationOfScheduledServices({
  validationSummary,
}: ValidationOfScheduledServicesProps) {
  return (
    <>
      <div className="px-[30px] py-[15px] bg-[#f8f9fa] border-t border-[#e0e0e0] flex gap-[25px] flex-wrap text-[13px]">
        <strong className="text-[#2c3e50] font-semibold">
          Legenda dos Status:
        </strong>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-black/10 bg-[#27ae60]"></div>
          <span>
            <strong>Verde:</strong> Serviço/Material completo - (Real ≥
            Planejado)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-black/10 bg-[#e74c3c]"></div>
          <span>
            <strong>Vermelho:</strong> Serviços/Materiais que necessitam de
            reprogramação - (0 &lt; Real &lt; Planejado) Ou Realização não
            informada
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border border-black/10 bg-[#f39c12]"></div>
          <span>
            <strong>Amarelo:</strong> Serviços/Materiais que não serem mais
            executados - (Real = 0)
          </span>
        </div>
      </div>

      <div className="mt-6 p-5 bg-gray-100 rounded-lg border-t border-gray-300">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-semibold text-gray-800">📊</span>
          <span className="text-base font-semibold text-gray-800">
            Resumo da Validação
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-md border-l-4 border-l-green-500 shadow-sm">
            <h4 className="text-xs uppercase text-gray-600 mb-2 tracking-wide">
              ✓ Serviços Completos
            </h4>
            <div className="text-3xl font-bold text-green-600">
              {validationSummary.completo}
            </div>
          </div>
          <div className="bg-white p-4 rounded-md border-l-4 border-l-red-500 shadow-sm">
            <h4 className="text-xs uppercase text-gray-600 mb-2 tracking-wide">
              ⚠ Necessitam Reprogramação
            </h4>
            <div className="text-3xl font-bold text-red-600">
              {validationSummary.reprogramar}
            </div>
          </div>
          <div className="bg-white p-4 rounded-md border-l-4 border-l-yellow-500 shadow-sm">
            <h4 className="text-xs uppercase text-gray-600 mb-2 tracking-wide">
              ⊘ Sem Realização
            </h4>
            <div className="text-3xl font-bold text-yellow-600">
              {validationSummary.semRealizacao}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
