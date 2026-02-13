import { cancelScheduleServices } from "@/actions/services";
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import { ScheduledServices } from "./scheduledServices/scheduledServices";
import { ScheduleHistory } from "./scheduleHistory";
import { ServicesAvaliable } from "./servicesAvailable";
import { ServicesContractSelect } from "./servicesContractSelect";

type ServiceContract = {
  texto_breve: string;
  material: string;
  preco: string;
  contrato: string;
  medida: string;
  turmas: { turma: string };
};

interface ServicesSectionProps {
  executionForm: any;
  servicesData: any[];
  scheduledServicesData: any[];
  serviceContractData: ServiceContract[];
  scheduledServicesHistory: any[];
  serviceFilters: any;
  selectedServices: number[];
  setSelectedServices: (services: number[]) => void;
  setOpenTeamsModal: (team: boolean) => void;
  isInsert: boolean;
  idSchedule: number | null;
  options: {
    restricao: Array<{ id: number; restricao: string }>;
  };
  onError: (error: string) => void;
  onSuccess: (success: string) => void;
}

const operations = [
  "DESATIVAÇÃO",
  "INSTALAÇÃO",
  "SUBSTITUIR APLICAR",
  "SUBSTITUIR RETIRADA",
];

const points = ["P1", "P10", "P12", "P13", "P15"];

export function ServicesSection({
  executionForm,
  servicesData,
  scheduledServicesData,
  serviceContractData,
  serviceFilters,
  scheduledServicesHistory,
  selectedServices,
  setSelectedServices,
  setOpenTeamsModal,
  isInsert,
  idSchedule,
  options,
  onSuccess,
  onError,
}: ServicesSectionProps) {
  const cancelServices = async (id: number) => {
    const response = await cancelScheduleServices(id);

    if (!response.success) {
      console.log(response.error);
      return;
    }

    console.log(response.message);
    localStorage.removeItem(`scheduled-services-validation:${idSchedule}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* LEFT SIDE — tables */}
      <div className="lg:col-span-8 space-y-6">
        {/* Serviços Disponíveis */}
        <ServicesAvaliable
          servicesData={servicesData}
          availableServices={serviceFilters.services}
          operations={serviceFilters.operations}
          points={serviceFilters.points}
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          setOpenTeamsModal={setOpenTeamsModal}
          isInsert={isInsert}
        />

        {/* Serviços Programados */}
        {!isInsert && (
          <ScheduledServices
            scheduledServicesData={scheduledServicesData}
            scheduledServicesHistory={scheduledServicesHistory}
            options={options}
            executionForm={executionForm}
            onError={onError}
            onSuccess={onSuccess}
          />
        )}
      </div>

      {/* RIGHT SIDE — Histórico + Adicionar */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Adicionar Serviços */}
        <div className="bg-white shadow rounded-xl p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            ADICIONAR SERVIÇOS
          </h2>

          <div className="space-y-4">
            <FormControl fullWidth size="small">
              <Autocomplete<ServiceContract>
                options={serviceContractData}
                getOptionLabel={(s) => s.texto_breve}
                ListboxComponent={ServicesContractSelect}
                renderOption={(props, s) => {
                  const { key, ...other } = props;

                  return (
                    <li key={key} {...other}>
                      <div className="flex flex-col">
                        <strong>{s.texto_breve}</strong>
                        <small>Material: {s.material}</small>
                        <small>Preço: {s.preco}</small>
                        <small>Contrato: {s.contrato}</small>
                        <small>Unidade: {s.medida}</small>
                        <small>Turma: {s.turmas.turma}</small>
                      </div>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Selecionar serviço"
                    size="small"
                  />
                )}
              />
            </FormControl>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField fullWidth size="small" label="CÓDIGO MATERIAL" />

              <FormControl fullWidth size="small">
                <InputLabel>PONTO</InputLabel>
                <Select defaultValue="">
                  {points.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>OPERAÇÃO</InputLabel>
                <Select defaultValue="">
                  {operations.map((op) => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <TextField fullWidth size="small" label="QTDE PLAN" />

            <Button fullWidth className="bg-blue-600 text-white">
              <PlusIcon className="w-5 h-5 mr-1" />
              ADICIONAR SERVIÇO
            </Button>
          </div>
        </div>

        {/* Histórico */}
        {!isInsert && (
          <ScheduleHistory
            cancelServices={cancelServices}
            idSchedule={idSchedule}
            scheduledServicesHistory={scheduledServicesHistory}
          />
        )}
      </div>
    </div>
  );
}
