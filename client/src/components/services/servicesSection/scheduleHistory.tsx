import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { LoadingComponent } from "@/components/common/Loading";
import ConfirmationScheduleModalComponent from "@/components/common/confirmationScheduleModal";
import { TableFilter } from "./servicesFilters";
import { useServicesFilters } from "@/hooks/services/useServicesFilters";
import {
  MATERIAL_OR_SERVICE_OPTIONS,
  SERVICE_OPERATIONS,
} from "@/constants/services/services";

dayjs.extend(utc);

export interface ScheduledServicesHistoryData {
  id: number;
  idProg: number;
  idServico: number;
  operacao: string;
  ponto: string;
  descricao: string;
  codigo: string;
  tipo: string;
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
  const {
    materialOrService,
    setMaterialOrService,
    setTableFilters,
    filterOptions,
    applyFilters,
  } = useServicesFilters(scheduledServicesHistory);

  const filteredServicesData = applyFilters(scheduledServicesHistory);

  const formatDate = (dateString: string) => {
    return dayjs(dateString).utc().format("DD/MM/YYYY");
  };

  const getRowClassName = (
    qtdeRealizada: number | null,
    qtdeProgramada: number,
  ) => {
    if (qtdeRealizada === 0) {
      return "border-l-yellow-500 border-solid bg-yellow-100 hover:bg-yellow-200 transition-colors";
    }

    if (qtdeRealizada === null || qtdeRealizada < qtdeProgramada) {
      return "border-l-red-500 border-solid bg-red-100 hover:bg-red-200 transition-colors";
    }

    return "border-l-green-500 border-solid bg-green-100 hover:bg-green-200 transition-colors";
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
          disabled={!isDisabled}
        >
          CANCELAR
        </Button>
      </div>

      <div className="overflow-x-auto">
        <TableFilter
          fields={[
            {
              label: "Serviço/Material",
              field: "textoBreve",
              options: filterOptions.textoBreve,
            },
            {
              label: "Equipe",
              field: "equipe",
              options: filterOptions.equipe,
              width: "w-44",
            },
            {
              label: "Operação",
              field: "operacao",
              options: SERVICE_OPERATIONS,
              width: "w-72",
            },
            {
              label: "Ponto",
              field: "ponto",
              options: filterOptions.ponto,
              width: "w-40",
            },
            {
              label: "Data Programada",
              field: "dataProgramada",
              options: filterOptions.dataProgramada,
              width: "w-44",
            },
          ]}
          onFilter={setTableFilters}
          extraFilters={
            <div className="min-w-[160px]">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Tipo
              </label>
              <FormControl fullWidth size="small">
                <Select
                  value={materialOrService}
                  onChange={(e) => setMaterialOrService(e.target.value)}
                  className="bg-white rounded-lg h-[38px]"
                >
                  {MATERIAL_OR_SERVICE_OPTIONS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          }
        />
        <TableContainer
          component={Paper}
          sx={{ height: 560, maxHeight: "100%" }}
        >
          <Table size="small" className="text-sm" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>SERVIÇO/MATERIAL</TableCell>
                <TableCell>CÓDIGO</TableCell>
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
              ) : filteredServicesData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    Nenhum histórico disponível
                  </TableCell>
                </TableRow>
              ) : (
                filteredServicesData.map((item) => (
                  <TableRow
                    key={item.id}
                    className={getRowClassName(
                      item.qtdeRealizada,
                      item.qtdeProgramada,
                    )}
                  >
                    <TableCell className="text-nowrap max-h-5">
                      {item.textoBreve}
                    </TableCell>
                    <TableCell className="text-nowrap max-h-5">
                      {item.codigo}
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
