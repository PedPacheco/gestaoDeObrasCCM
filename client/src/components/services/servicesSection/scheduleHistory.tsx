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
import ConfirmationScheduleModalComponent from "@/components/common/confirmationScheduleModal";

dayjs.extend(utc);

export interface ScheduledServicesHistoryData {
  id: number;
  idProg: number;
  idServico: number;
  operacao: string;
  ponto: string;
  descricao: string;
  dataProgramada: string;
  qtdeProgramada: number;
  qtdePlanejada: number | null;
  qtdeViabilizado: number | null;
  qtdeAdicional: number | null;
  qtdeRealizada: number | null;
  equipe: string;
}

interface ScheduleHistoryProps {
  idSchedule: number | null;
  cancelServices: (id: number) => void;
  scheduledServicesHistory: ScheduledServicesHistoryData[];
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

  console.log(scheduledServicesHistory);

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
          // disabled={!isDisabled}
        >
          CANCELAR
        </Button>
      </div>

      <div className="overflow-x-auto">
        <TableContainer
          component={Paper}
          sx={{ height: 560, maxHeight: "100%" }}
        >
          <Table size="small" className="text-sm" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>SERVIÇO</TableCell>
                <TableCell>EQUIPE</TableCell>
                <TableCell>OPERAÇÃO</TableCell>
                <TableCell>PONTO</TableCell>
                <TableCell>DATA PROGRAMADA</TableCell>
                <TableCell>PLAN</TableCell>
                <TableCell>VIABILIZADO</TableCell>
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
                      {item.descricao}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.equipe}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.operacao}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.ponto}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {formatDate(item.dataProgramada)}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.qtdePlanejada}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.qtdeViabilizado}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.qtdeAdicional}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.qtdeProgramada}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.qtdeRealizada}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {idSchedule && (
        <ConfirmationScheduleModalComponent
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
