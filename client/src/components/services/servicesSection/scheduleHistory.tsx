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

dayjs.extend(utc);

interface ScheduleHistoryProps {
  idSchedule: number | null;
  cancelServices: (id: number) => void;
  scheduledServicesHistory: any[];
}

export function ScheduleHistory({
  cancelServices,
  idSchedule,
  scheduledServicesHistory,
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
          className="border-gray-300 text-gray-600"
          onClick={() => {
            if (idSchedule) {
              cancelServices(idSchedule);
            }
          }}
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
                    <TableCell className="text-nowrap">{item.plan}</TableCell>
                    <TableCell className="text-nowrap">{item.prog}</TableCell>
                    <TableCell className="text-nowrap">{item.real}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  );
}
