import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { LoadingComponent } from "@/components/common/Loading";
import { useState } from "react";
import ConfirmationModalComponent from "@/components/common/confirmationModal";

dayjs.extend(utc);

interface ScheduleHistoryProps {
  idSchedule: number | null;
  cancelServices: (id: number) => void;
  scheduledServicesHistory: any[];
  isDisabled: boolean;
  isPending: boolean;
  openConfirmationModal: boolean;
  setOpenConfirmationModal: (confirmation: boolean) => void;
}

export function ScheduleHistory({
  cancelServices,
  idSchedule,
  scheduledServicesHistory,
  isDisabled,
  isPending,
  openConfirmationModal,
  setOpenConfirmationModal,
}: ScheduleHistoryProps) {
  const formatDate = (dateString: string) => {
    return dayjs(dateString).utc().format("DD/MM/YYYY");
  };

  return (
    <div className="bg-white shadow rounded-xl p-4 sm:p-6 min-h-[480px]">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          HISTÓRICO DAS PROGRAMAÇÕES
        </h2>
        <Button
          variant="outlined"
          onClick={() => {
            setOpenConfirmationModal(true);
          }}
          // disabled={isDisabled}
        >
          CANCELAR
        </Button>
      </div>

      <div className="overflow-x-auto">
        <TableContainer component={Paper} sx={{ height: 560 }}>
          <Table size="small" className="text-sm" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>SERVIÇO</TableCell>
                <TableCell>EQUIPE</TableCell>
                <TableCell>OPERAÇÃO</TableCell>
                <TableCell>PONTO</TableCell>
                <TableCell>DATA PROGRAMADA</TableCell>
                <TableCell>PLAN</TableCell>
                <TableCell>ADICIONAL</TableCell>
                <TableCell>PROG</TableCell>
                <TableCell>REAL</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <LoadingComponent color="text-black" />
                  </TableCell>
                </TableRow>
              ) : scheduledServicesHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Nenhum histórico disponível
                  </TableCell>
                </TableRow>
              ) : (
                scheduledServicesHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-nowrap max-h-5">
                      {item.servicos.servicos_contratos.texto_breve}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.equipes.equipe}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.servicos.operacao}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.servicos.ponto}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {formatDate(item.programacoes.data_prog)}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.plan}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.adicional}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.prog}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.real}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {idSchedule && (
        <ConfirmationModalComponent
          idSchedule={idSchedule}
          message="Você deseja realmente cancelar essa programação ?"
          onClose={() => setOpenConfirmationModal(false)}
          onConfirm={cancelServices}
          open={openConfirmationModal}
          title="Exclusão de programação"
        />
      )}
    </div>
  );
}
