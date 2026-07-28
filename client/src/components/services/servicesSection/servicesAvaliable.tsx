import { useRouter } from "next/navigation";
import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useTransition,
} from "react";

import { applyAdditonalPlanServices } from "@/actions/services";
import { ButtonComponent } from "@/components/common/Button";
import { LoadingComponent } from "@/components/common/Loading";
import { useFeedback } from "@/hooks/useFeedback";
import { FormatCurrency } from "@/utils/formatValue";
import {
  ArrowUpTrayIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/20/solid";
import {
  Box,
  Button,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import { TableFilter } from "./servicesFilters";
import { TeamModal } from "./teamsModal";

interface ServicesAvaliableProps {
  servicesData: any[];
  setServicesData: Dispatch<SetStateAction<any[]>>;
  setScheduledServices: Dispatch<SetStateAction<any[]>>;
  isInsert: boolean;
  statusSchedule?: string;
  teams: any[];
  onError: (error: string) => void;
  onSuccess: (success: string, onClose?: () => void) => void;
}

const serviceColumns = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "tipo", label: "TIPO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "numero_operacao", label: "N° DA OPERAÇÃO" },
  { key: "descricao_operacao", label: "DESCRIÇÃO DA OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "qtdePlanejada", label: "PLAN" },
  { key: "viabilizado", label: "VIABILIZADO" },
  { key: "qtdeAdicional", label: "ADICIONAL" },
  { key: "qtdeRealizada", label: "REAL" },
  { key: "valorUnit", label: "VALOR UNIT" },
  { key: "valorTotal", label: "VALOR TOTAL" },
];

export function NewServicesAvaliable({
  servicesData,
  setServicesData,
  setScheduledServices,
  statusSchedule,
  teams,
  onError,
  onSuccess,
}: ServicesAvaliableProps) {
  const [filteredServicesData, setFilteredServicesData] = useState<any[]>([]);
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [openTeamsModal, setOpenTeamsModal] = useState(false);

  const [isPending, startTransition] = useTransition();

  const { showError } = useFeedback();

  const router = useRouter();

  const allSelected = selectedServices.length === filteredServicesData.length;

  const isDisabled = statusSchedule
    ? ["Concluído", "Cancelado", "Parcial"].includes(statusSchedule)
    : false;

  useEffect(() => {
    setFilteredServicesData(servicesData);
  }, [servicesData]);

  const updateServiceQuantity = (id: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    setFilteredServicesData((prev: any) =>
      prev.map((item: any) =>
        item.id === id
          ? { ...item, qtdeAdicional: value === "" ? null : value }
          : item,
      ),
    );
  };

  const applyAdditional = async () => {
    const data = filteredServicesData.map((service) => ({
      id: service.id,
      additional:
        service.qtdeAdicional == null || service.qtdeAdicional === ""
          ? null
          : Number(service.qtdeAdicional),
    }));

    const response = await applyAdditonalPlanServices(data);

    if (!response.success) {
      onError(response.error);
      return;
    }

    startTransition(() => {});

    if (response.message) {
      onSuccess(response.message, () => router.refresh());
    }
  };

  const handleAddClick = () => {
    if (selectedServices.length === 0) {
      showError("Nenhum serviço selecionado.");
      return;
    }

    if (
      selectedServices.find(
        (item) => item.qtdePlanejada === 0 && item.qtdeAdicional === null,
      )
    ) {
      showError("Serviço selecionado sem valores para execução");
      return;
    }

    setOpenTeamsModal(true);
  };

  const handleTeamConfirm = (team: any) => {
    setScheduledServices((prev: any[]) => {
      // adiciona equipa aos serviços selecionados
      const selectedWithTeam = selectedServices.map((service: any) => ({
        ...service,
        idTeam: team.id,
        equipe: team.equipe,
        prog: service.prog ?? null,
        additional: service.additional ?? null,
      }));

      // junta com os já programados
      const merged = [...prev, ...selectedWithTeam];

      // remove duplicados por id (mantém o último, ou seja, o recém-adicionado)
      const map = new Map<number | string, any>();
      merged.forEach((item) => map.set(item.id, item));

      return Array.from(map.values());
    });

    const selectedIds = new Set(selectedServices.map((s: any) => s.id));
    setServicesData((prev: any[]) =>
      prev.filter((service: any) => !selectedIds.has(service.id)),
    );

    setOpenTeamsModal(false);
    setSelectedServices([]); // opcional: limpa seleção após adicionar
  };

  const isDisableAfterChangeData = filteredServicesData.some((item) => {
    const original = servicesData.find((service) => service.id === item.id);

    return original?.qtdeAdicional !== item.qtdeAdicional;
  });

  return (
    <>
      <Paper className="flex h-full min-h-0 flex-col p-6">
        {/* Header com botões */}
        <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between">
          <Typography className="text-xl font-semibold text-gray-700">
            SERVIÇOS DISPONÍVEIS PARA PROGRAMAÇÃO
          </Typography>
          <div className="flex gap-2">
            <Button
              variant="outlined"
              startIcon={<TrashIcon className="h-5 w-5 text-gray-700" />}
              className="border-blue-600 text-blue-600"
            >
              EXCLUIR SERVIÇOS
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowUpTrayIcon className="h-5 w-5 text-gray-700" />}
              className="border-blue-600 text-blue-600"
            >
              IMPORTAR SERVIÇOS
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="shrink-0">
          <TableFilter
            data={servicesData}
            fields={[
              {
                label: "SERVIÇO",
                field: "textoBreve",
                options: Array.from(
                  new Set(servicesData.map((item) => item.textoBreve)),
                ),
              },
              {
                label: "FAMILIA",
                field: "descricao_operacao",
                options: Array.from(
                  new Set(servicesData.map((item) => item.descricao_operacao)),
                ),
              },
              {
                label: "OPERAÇÃO",
                field: "operacao",
                options: Array.from(
                  new Set(servicesData.map((item) => item.operacao)),
                ),
                width: "w-1/6",
              },
              {
                label: "PONTO",
                field: "ponto",
                options: Array.from(
                  new Set(servicesData.map((item) => item.ponto)),
                ),
                width: "w-32",
              },
            ]}
            onFilter={setFilteredServicesData}
          />
        </div>

        {/* Tabela — cresce para preencher todo o espaço restante */}
        <TableContainer
          component={Paper}
          sx={{ flex: 1, minHeight: 0, overflow: "auto" }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  padding="checkbox"
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 3, // maior que o stickyHeader padrão (z-index 2)
                    backgroundColor: "background.paper",
                  }}
                >
                  <Checkbox
                    checked={allSelected}
                    indeterminate={
                      selectedServices.length > 0 &&
                      selectedServices.length < filteredServicesData.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedServices(
                          filteredServicesData.map((s) => ({
                            ...s,
                            prog: s.viabilizado + Number(s.qtdeAdicional),
                            additional: s.qtdeAdicional,
                          })),
                        );
                      } else {
                        setSelectedServices([]);
                      }
                    }}
                  />
                </TableCell>
                {serviceColumns.map((header, index) => (
                  <TableCell key={index} className="text-nowrap">
                    {header.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <LoadingComponent color="text-black" />
                  </TableCell>
                </TableRow>
              ) : (
                filteredServicesData?.map((row, index) => (
                  <TableRow
                    key={index}
                    hover
                    selected={selectedServices.includes(index)}
                    className="cursor-pointer"
                  >
                    <TableCell
                      padding="checkbox"
                      sx={{
                        position: "sticky",
                        left: 0,
                        zIndex: 1,
                        backgroundColor: "background.paper",
                      }}
                    >
                      <Checkbox
                        checked={selectedServices.some(
                          (item: any) => item.id === row.id,
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedServices([
                              ...selectedServices,
                              {
                                ...row,
                                prog:
                                  row.viabilizado + Number(row.qtdeAdicional),
                                qtdeAdicional: row.qtdeAdicional,
                              },
                            ]);
                          } else {
                            setSelectedServices(
                              selectedServices.filter(
                                (selected: any) => selected.id !== row.id,
                              ),
                            );
                          }
                        }}
                      />
                    </TableCell>

                    {serviceColumns.map((col, index) => {
                      let value = row[col.key];

                      if (col.key === "qtdeAdicional") {
                        return (
                          <TableCell key={index}>
                            <input
                              type="text"
                              className="w-16 rounded border px-2 py-1 text-right"
                              value={value || ""}
                              onChange={(e) =>
                                updateServiceQuantity(row.id, e.target.value)
                              }
                            />
                          </TableCell>
                        );
                      }

                      if (["valorUnit", "valorTotal"].includes(col.key)) {
                        value = FormatCurrency(value);
                      }

                      return (
                        <TableCell key={index} className="text-nowrap">
                          {value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Botões de ação */}
        <Box className="mt-4 flex justify-end">
          <ButtonComponent
            startIcon={<PlusIcon className="h-5 w-5 text-white" />}
            styled="!mr-4 rounded px-4 px-2 !text-sm "
            onClick={applyAdditional}
            disabled={!isDisableAfterChangeData}
            text="Aplicar Adicional"
          />

          <ButtonComponent
            startIcon={<PlusIcon className="h-5 w-5 " />}
            styled="rounded px-4 px-2 !text-sm"
            onClick={handleAddClick}
            disabled={isDisabled}
            text="Adicionar à programação"
          />
        </Box>
      </Paper>

      <TeamModal
        open={openTeamsModal}
        onClose={() => setOpenTeamsModal(false)}
        onConfirm={handleTeamConfirm}
        teams={teams}
      />
    </>
  );
}
