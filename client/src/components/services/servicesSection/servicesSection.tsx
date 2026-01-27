import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useCallback, useEffect, useState } from "react";

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

import { ScheduledServices } from "./scheduledServices";
import { ServicesAvaliable } from "./servicesAvailable";
import { ServicesContractSelect } from "./servicesContractSelect";

dayjs.extend(utc);

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
  scheduledServicesHistory: any[];
  serviceFilters: any;
  idScheduleExisting: string | null;
  selectedServices: number[];
  setSelectedServices: (services: number[]) => void;
  setOpenTeamsModal: (team: boolean) => void;
  isInsert: boolean;
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
  scheduledServicesHistory,
  selectedServices,
  setSelectedServices,
  setOpenTeamsModal,
  isInsert,
}: ServicesSectionProps) {
  const formatDate = (dateString: string) => {
    return dayjs(dateString).utc().format("DD/MM/YYYY");
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
          <ScheduledServices scheduledServicesData={scheduledServicesData} />
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
                      <TableCell>DATA PROGRAMADA</TableCell>
                      <TableCell>PLAN</TableCell>
                      <TableCell>PROG</TableCell>
                      <TableCell>REAL</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduledServicesHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Nenhum histórico disponível
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduledServicesHistory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-nowrap">
                            {item.servicos.servicos_contratos.texto_breve}
                          </TableCell>
                          <TableCell className="text-nowrap">
                            {item.servicos.operacao}
                          </TableCell>
                          <TableCell className="text-nowrap">
                            {item.servicos.ponto}
                          </TableCell>
                          <TableCell className="text-nowrap">
                            {formatDate(item.programacoes.data_prog)}
                          </TableCell>
                          <TableCell className="text-nowrap">
                            {item.plan}
                          </TableCell>
                          <TableCell className="text-nowrap">
                            {item.prog}
                          </TableCell>
                          <TableCell className="text-nowrap">
                            {item.real}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
