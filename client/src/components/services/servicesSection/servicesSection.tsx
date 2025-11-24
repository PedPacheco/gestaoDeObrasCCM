import { PlusIcon } from "@heroicons/react/20/solid";

import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";

import { useCallback, useEffect, useState } from "react";
import { ServicesAvaliable } from "./servicesAvailable";
import { ScheduledServices } from "./scheduledServices";
import { ServicesContractSelect } from "./servicesContractSelect";
import { TeamModal } from "./teamsModal";

type ServiceContract = {
  texto_breve: string;
  material: string;
  preco: string;
  contrato: string;
  medida: string;
  turmas: { turma: string };
};

interface ServicesSectionProps {
  servicesData: any[];
  scheduledServicesData: any[];
  serviceContractData: ServiceContract[];
  serviceTeams: any[];
  serviceFilters: any;
  isInsert: boolean;
  idScheduleExisting: string | null;
}

const operations = [
  "DESATIVAÇÃO",
  "INSTALAÇÃO",
  "SUBSTITUIR APLICAR",
  "SUBSTITUIR RETIRADA",
];

const points = ["P1", "P10", "P12", "P13", "P15"];

export function ServicesSection({
  servicesData,
  scheduledServicesData,
  serviceContractData,
  serviceFilters,
  serviceTeams,
  isInsert,
  idScheduleExisting,
}: ServicesSectionProps) {
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  const [openTeamsModal, setOpenTeamsModal] = useState<boolean>(false);

  const shouldBlock =
    isInsert && idScheduleExisting && selectedServices.length === 0;

  const toggleModal = useCallback(() => {
    setOpenTeamsModal((prev) => !prev);
  }, []);

  // useEffect(() => {
  //   if (!shouldBlock) return;

  //   const handler = (event: BeforeUnloadEvent) => {
  //     event.preventDefault();
  //     event.returnValue = "";
  //   };

  //   const handleBack = (e: PopStateEvent) => {
  //     const confirmLeave = confirm(
  //       "Existem alterações não salvas. Deseja sair?"
  //     );
  //     if (!confirmLeave) {
  //       window.history.pushState(null, "", window.location.href);
  //     }
  //   };

  //   window.history.pushState(null, "", window.location.href);

  //   window.addEventListener("beforeunload", handler);
  //   window.addEventListener("popstate", handleBack);

  //   return () => {
  //     window.removeEventListener("beforeunload", handler);
  //     window.removeEventListener("popstate", handleBack);
  //   };
  // }, [shouldBlock]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* LEFT SIDE — tables */}
      <div className="lg:col-span-7 space-y-6">
        {/* Serviços Disponíveis */}
        <ServicesAvaliable
          servicesData={servicesData}
          availableServices={serviceFilters.services}
          operations={serviceFilters.operations}
          points={serviceFilters.points}
          selectedServices={selectedServices}
          setSelectedServices={setSelectedServices}
          setOpenTeamsModal={setOpenTeamsModal}
        />

        {/* Serviços Programados */}
        <ScheduledServices scheduledServicesData={scheduledServicesData} />

        {idScheduleExisting && (
          <TeamModal
            onClose={toggleModal}
            open={openTeamsModal}
            teams={serviceTeams}
            idSchedule={idScheduleExisting}
            selectedServices={selectedServices}
          />
        )}
      </div>

      {/* RIGHT SIDE — Histórico + Adicionar */}
      <div className="lg:col-span-5 flex flex-col gap-6">
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
        <div className="bg-white shadow rounded-xl p-4 sm:p-6 min-h-[480px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">
              HISTÓRICO DAS PROGRAMAÇÕES
            </h2>
            <Button
              variant="outlined"
              className="border-gray-300 text-gray-600"
            >
              CANCELAR
            </Button>
          </div>

          <div className="overflow-x-auto">
            <TableContainer component={Paper} sx={{ height: 480 }}>
              <Table size="small" className="text-sm h-full">
                <TableHead>
                  <TableRow>
                    <TableCell>SERVIÇO</TableCell>
                    <TableCell>OPERAÇÃO</TableCell>
                    <TableCell>PONTO</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      Nenhum histórico disponível
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
