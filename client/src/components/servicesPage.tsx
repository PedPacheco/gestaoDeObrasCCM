"use client";

import { ChevronUpIcon, PlusIcon } from "@heroicons/react/20/solid";
import {
  ArrowUpTrayIcon,
  ChevronDownIcon,
  FunnelIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";

export function ServicesPageComponent() {
  const [selectedDate, setSelectedDate] = useState("2025-11-12");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [progress, setProgress] = useState("0");
  const [observation, setObservation] = useState("");

  // Serviço e Equipamentos
  const [serviceType, setServiceType] = useState("LV");
  const [chi, setChi] = useState("0");
  const [equipmentToDisable, setEquipmentToDisable] = useState("");
  const [dpNumber, setDpNumber] = useState("");

  const [selectedServices, setSelectedServices] = useState([]);
  const [scheduledServices, setScheduledServices] = useState([]);
  const [serviceFilter, setServiceFilter] = useState("");
  const [operationFilter, setOperationFilter] = useState("");
  const [pointFilter, setPointFilter] = useState("");

  // Controle de expansão das seções
  const [isBasicInfoExpanded, setIsBasicInfoExpanded] = useState(true);
  const [isServiceEquipmentExpanded, setIsServiceEquipmentExpanded] =
    useState(true);
  const [isTeamsExpanded, setIsTeamsExpanded] = useState(true);

  const availableServices = [
    {
      id: 1,
      code: "11.1 - SA",
      name: "RAMAL DE LIGACAO",
      operations: ["DESATIVAÇÃO", "INSTALAÇÃO"],
    },
    {
      id: 2,
      code: "11.1 - SR",
      name: "RAMAL DE LIGACAO",
      operations: ["DESATIVAÇÃO", "INSTALAÇÃO"],
    },
    {
      id: 3,
      code: "13.4",
      name: "REFAZER PASSEIO",
      operations: ["SUBSTITUIR APLICAR"],
    },
    {
      id: 4,
      code: "2.3-I",
      name: "ATERRAMENTO COM MAIS DE UMA HASTE",
      operations: ["SUBSTITUIR RETIRADA"],
    },
  ];

  const operations = [
    "DESATIVAÇÃO",
    "INSTALAÇÃO",
    "SUBSTITUIR APLICAR",
    "SUBSTITUIR RETIRADA",
  ];
  const points = ["P1", "P10", "P12", "P13", "P15"];
  const serviceTypes = ["LV", "MT", "BT"];

  const serviceData = [
    {
      obra: "14472083",
      codigo: "71001013",
      servico: "8.6 - D - ESTRUTURA SECUNDARIA",
      operacao: "DESATIVAÇÃO",
      ponto: "P1",
      plan: 1.0,
      valorUnit: 134.82,
      valorPlan: 134.82,
    },
    {
      obra: "14472081",
      codigo: "71001014",
      servico: "8.6 - I - ESTRUTURA SECUNDARIA",
      operacao: "INSTALAÇÃO",
      ponto: "P1",
      plan: 1.0,
      valorUnit: 167.66,
      valorPlan: 167.66,
    },
    {
      obra: "14472081",
      codigo: "71001013",
      servico: "8.6 - D - ESTRUTURA SECUNDARIA",
      operacao: "DESATIVAÇÃO",
      ponto: "P10",
      plan: 1.0,
      valorUnit: 134.82,
      valorPlan: 134.82,
    },
    {
      obra: "14472081",
      codigo: "71001014",
      servico: "8.6 - I - ESTRUTURA SECUNDARIA",
      operacao: "INSTALAÇÃO",
      ponto: "P10",
      plan: 1.0,
      valorUnit: 167.66,
      valorPlan: 167.66,
    },
    {
      obra: "14472081",
      codigo: "71001013",
      servico: "8.6 - D - ESTRUTURA SECUNDARIA",
      operacao: "DESATIVAÇÃO",
      ponto: "P12",
      plan: 1.0,
      valorUnit: 134.82,
      valorPlan: 134.82,
    },
    {
      obra: "14472081",
      codigo: "71006322",
      servico: "2.3-I-ATERRAMENTO COM MAIS DE UMA HASTE",
      operacao: "INSTALAÇÃO",
      ponto: "P12",
      plan: 1.0,
      valorUnit: 348.96,
      valorPlan: 348.96,
    },
  ];

  const handleAddService = () => {
    console.log("Adicionar serviço");
  };

  const handleSaveScheduling = () => {
    const schedulingData = {
      date: selectedDate,
      startTime,
      endTime,
      progress,
      observation,
      serviceType,
      chi,
      equipmentToDisable,
      dpNumber,
    };
    console.log("Salvar programação:", schedulingData);
  };

  const handleCancel = () => {
    console.log("Cancelar");
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Nova Programação
      </h1>

      <div className="space-y-6">
        {/* Informações Básicas */}
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() => setIsBasicInfoExpanded(!isBasicInfoExpanded)}
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50"
          >
            <h2 className="text-xl font-semibold text-gray-700">
              Informações Básicas
            </h2>
            {isBasicInfoExpanded ? (
              <ChevronDownIcon width={24} height={24} />
            ) : (
              <ChevronUpIcon width={24} height={24} />
            )}
          </button>

          {isBasicInfoExpanded && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Programação <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horário Fim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progresso Programado:
                </label>
                <input
                  type="text"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observação da Programação
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Serviço e Equipamentos */}
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() =>
              setIsServiceEquipmentExpanded(!isServiceEquipmentExpanded)
            }
            className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50"
          >
            <h2 className="text-xl font-semibold text-gray-700">
              Serviço e Equipamentos
            </h2>
            {isServiceEquipmentExpanded ? (
              <ChevronUpIcon width={24} height={24} />
            ) : (
              <ChevronDownIcon width={24} height={24} />
            )}
          </button>

          {isServiceEquipmentExpanded && (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Serviço
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {serviceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Equipamento a ser desligado
                  </label>
                  <input
                    type="text"
                    value={equipmentToDisable}
                    onChange={(e) => setEquipmentToDisable(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CHI
                  </label>
                  <input
                    type="text"
                    value={chi}
                    onChange={(e) => setChi(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número DP
                  </label>
                  <input
                    type="text"
                    value={dpNumber}
                    onChange={(e) => setDpNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={handleCancel}
            className="px-8 py-3 bg-gray-700 text-white rounded hover:bg-gray-800 font-medium"
          >
            CANCELAR
          </button>
          <button
            onClick={handleSaveScheduling}
            className="px-8 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
          >
            SALVAR PROGRAMAÇÃO
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Seção Esquerda - Serviços */}
          <div className="lg:col-span-7 space-y-6">
            {/* Serviços Disponíveis */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  SERVIÇOS DISPONÍVEIS PARA PROGRAMAÇÃO
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                    <TrashIcon width={24} height={24} />
                    EXCLUIR SERVIÇOS
                  </button>
                  <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-sm flex items-center gap-2">
                    <ArrowUpTrayIcon width={24} height={24} />
                    IMPORTAR SERVIÇOS
                  </button>
                </div>
              </div>

              {/* Filtros */}
              <div className="bg-gray-100 p-4 rounded mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      SERVIÇO
                    </label>
                    <select
                      value={serviceFilter}
                      onChange={(e) => setServiceFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Selecionar...</option>
                      {availableServices.map((service) => (
                        <option key={service.id} value={service.code}>
                          {service.code} - {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      OPERAÇÃO
                    </label>
                    <select
                      value={operationFilter}
                      onChange={(e) => setOperationFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Selecionar...</option>
                      {operations.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      PONTO
                    </label>
                    <select
                      value={pointFilter}
                      onChange={(e) => setPointFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Selecionar...</option>
                      {points.map((point) => (
                        <option key={point} value={point}>
                          {point}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      &nbsp;
                    </label>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center justify-center gap-1">
                        <FunnelIcon width={24} height={24} />
                        APLICAR
                      </button>
                      <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm flex items-center justify-center gap-1">
                        <XMarkIcon width={24} height={24} />
                        LIMPAR
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de Serviços */}
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        OBRA
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        CÓDIGO
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        SERVIÇO
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        OPERAÇÃO
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        PONTO
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-700">
                        PLAN
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-700">
                        VALOR UNIT
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-700">
                        VALOR PLAN.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceData.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-2 py-2">
                          <input type="checkbox" className="rounded" />
                        </td>
                        <td className="px-2 py-2">{row.obra}</td>
                        <td className="px-2 py-2">{row.codigo}</td>
                        <td className="px-2 py-2">{row.servico}</td>
                        <td className="px-2 py-2">{row.operacao}</td>
                        <td className="px-2 py-2">{row.ponto}</td>
                        <td className="px-2 py-2 text-right">
                          {row.plan.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {row.valorUnit.toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-right">
                          {row.valorPlan.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Serviços Programados */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                SERVIÇOS PROGRAMADOS
              </h2>
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left">
                        <input type="checkbox" className="rounded" />
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        OBRA
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        CÓDIGO
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        SERVIÇO
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        OPERAÇÃO
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        PONTO
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-700">
                        PLAN
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-700">
                        TOTAL REAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan={8}
                        className="px-2 py-12 text-center text-gray-500"
                      >
                        Nenhum serviço programado
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Seção Direita */}
          <div className="lg:col-span-5 space-y-6">
            {/* Histórico */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  HISTÓRICO DAS PROGRAMAÇÕES
                </h2>
                <button className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-sm">
                  CANCELAR PROGRAMAÇÃO
                </button>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        SERVIÇO
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        OPERAÇÃO
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        PONTO
                      </th>
                      <th className="px-2 py-2 text-left font-semibold text-gray-700">
                        DATA PROG
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-700">
                        PLAN
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-700">
                        PROG
                      </th>
                      <th className="px-2 py-2 text-right font-semibold text-gray-700">
                        REAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-2 py-12 text-center text-gray-500"
                      >
                        Nenhum histórico disponível
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Adicionar Serviços */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                ADICIONAR SERVIÇOS
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SELECIONAR SERVIÇO
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                    <option value="">Selecionar...</option>
                    {availableServices.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.code} - {service.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CÓDIGO MATERIAL
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PONTO
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecionar...</option>
                      {points.map((point) => (
                        <option key={point} value={point}>
                          {point}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OPERAÇÃO
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500">
                      <option value="">Selecionar...</option>
                      {operations.map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QTDE PLAN
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleAddService}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                >
                  <PlusIcon width={24} height={24} />
                  ADICIONAR SERVIÇO
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
      </div>
    </div>
  );
}
