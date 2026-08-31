"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { InsertPublicationRestrictions } from "@/actions/restrictions";
import { UpdateWork } from "@/actions/works";
import { ButtonComponent } from "@/components/common/Button";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import ModalComponent from "@/components/common/Modal";
import { useUser } from "@/contexts/userContext";
import { useFeedback } from "@/hooks/useFeedback";
import {
  FeasibilityWorkflowStatus,
  getFeasibilityWorkflowStatus,
} from "@/utils/feasibilityWorkflow";
import {
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  PencilSquareIcon,
} from "@heroicons/react/20/solid";
import {
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material";

import DataItem, { SummaryDataItem } from "./dataItem";
import { EditableColumn } from "./editableColumn";

dayjs.extend(customParseFormat);

const RestrictionDrawer = dynamic(
  () =>
    import("@/components/restrictionsComponents/scheduleRestrictions/RestrictionDrawer"),
  { ssr: false },
);

interface WorkDetailsProps {
  data: WorkData;
  formattedData: FormattedData;
  idWork: number;
  options: any;
}

interface WorkData {
  ovnota: string;
  tipos: string;
  municipios: string;
  referencia: string;
  circuitos: string;
  conjunto: string;
  pep: string;
  status_pep: string;
  diagrama: string;
  status_diagrama: string;
  ordem_dci: string;
  status_170: string;
  ordem_dcd: string;
  status_190: string;
  ordem_dca: string;
  status_150: string;
  ordem_dcim: string;
  status_180: string;
  executado: number;
  ano_plan: string;
  empreendimento: string;
  id_status: number;
  id_turma: string;
  idRegional: number;
  status_ov_sap: string;
  observ_obra: string;
  data_viabilidade: string;
  prazo_viabilidade: string;
  viabilidade_aprovada: boolean;
  programacao_ponto_a_ponto: boolean;
  id: string;
}

interface FormattedData {
  entrada: string;
  prazo: string;
  prazoFinal: string;
  data_conclusao: string | null;
  dataViabilidade: string | null;
  dataEmpreitamento: string | null;
  backgroundColor: string;
  executadoFormatted: string;
  totalProgramado: string;
}

interface EditableData {
  data_empreitamento: string | null;
  id_status: number;
  id_turma: string;
  observ_obra: string;
}

const SUSPENSION_OPTIONS = [
  "CHI - Conjunto crítico",
  "Falta de aprovação de orgão externo",
  "Sem acesso ao local da obra",
  "Impedimento de terceiros",
  "Fora do plano atual",
  "Condição climática",
  "Falta de manobras devido contigencia no COI",
  "Priorização de atendimento emergencial e urgências",
  "Necessario desapropriação de terreno",
  "Risco à vida observado posteriormente a viabilidade",
  "A pedido do cliente",
  "Obra executada por CSD",
  "Transferida para CSD",
] as const;

const RESTRICTED_STATUS_IDS = [3, 4, 42];
const SUSPENDED_STATUS_ID = 4;

function useModals() {
  const [openSuspensionModal, setOpenSuspensionModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  return {
    openModal,
    setOpenModal,
    openSuspensionModal,
    setOpenSuspensionModal,
    toggleSuspensionModal: useCallback(
      () => setOpenSuspensionModal((prev) => !prev),
      [],
    ),
    drawerOpen,
    setDrawerOpen,
  };
}

function formatDateForSubmit(value?: string): string {
  if (!value) {
    return dayjs().format("YYYY-MM-DD");
  }

  const parsed = dayjs(value, "DD/MM/YYYY", true);

  return parsed.isValid()
    ? parsed.format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");
}

function hasRestrictedAccess(statusId: number, permission?: string): boolean {
  return RESTRICTED_STATUS_IDS.includes(statusId) && permission === "PARCEIRA";
}

export function WorkDetails({
  data,
  idWork,
  formattedData,
  options,
}: WorkDetailsProps) {
  const { dataViabilidade } = formattedData;
  const {
    id_status,
    prazo_viabilidade,
    viabilidade_aprovada,
    programacao_ponto_a_ponto,
  } = data;

  const workflowStatus = getFeasibilityWorkflowStatus(
    id_status,
    dataViabilidade,
    prazo_viabilidade,
    viabilidade_aprovada,
  );

  const FEASIBILITY_ACTION_LABEL: Record<typeof workflowStatus, string> = {
    adicao: "Importar Arquivos de Viabilidade",
    aprovacao: "Acompanhar Aprovação",
    aprovado: "Ver Viabilidade",
  };

  const FEASIBILITY_ACTION_COLOR: Record<typeof workflowStatus, string> = {
    adicao: "",
    aprovacao: "bg-amber-50 text-amber-600",
    aprovado: "bg-green-50 text-green-700",
  };

  const FEASIBILITY_ACTION_ICON: Record<FeasibilityWorkflowStatus, ReactNode> =
    {
      adicao: <PencilSquareIcon className="h-4 w-4" />,
      aprovacao: <ClockIcon className="h-4 w-4" />,
      aprovado: <CheckCircleIcon className="h-4 w-4" />,
    };

  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [changedFields, setChangedFields] =
    useState<Record<string, string | null>>();

  const [editableData, setEditableData] = useState<EditableData>({
    data_empreitamento: formattedData.dataEmpreitamento,
    id_status: data.id_status,
    id_turma: data.id_turma,
    observ_obra: data.observ_obra,
  });

  const router = useRouter();

  const { permissions } = useUser();
  const modals = useModals();
  const { showError, showSuccess } = useFeedback();

  const publicationRestrictions = useMemo(
    () =>
      options.restricao.filter((r: any) => r.tipo_restricao === "PUBLICAÇÃO"),
    [options.restricao],
  );

  const canShowPublicationButton = useMemo(
    () =>
      isMounted &&
      (permissions?.is_admin || [7].includes(permissions?.id_area ?? -1)) &&
      data.executado > 0,
    [isMounted, permissions, data.executado],
  );

  const isSaveDisabled = useMemo(
    () =>
      isPending || !changedFields || Object.keys(changedFields).length === 0,
    [isPending, changedFields],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleDataChange = useCallback(
    (field: string, value: string) => {
      setEditableData((prev) => ({ ...prev, [field]: value }));

      const formattedValue =
        field === "data_empreitamento" ? formatDateForSubmit(value) : value;

      setChangedFields((prev) => ({ ...prev, [field]: formattedValue }));

      if (field === "id_status" && Number(value) === SUSPENDED_STATUS_ID) {
        modals.setOpenSuspensionModal(true);
      }
    },
    [modals],
  );

  const handleSubmit = useCallback(() => {
    startTransition(async () => {
      try {
        const payload = {
          ...changedFields,
          ...(Number(editableData.id_status) === SUSPENDED_STATUS_ID && {
            reasonSuspension: suspensionReason,
          }),
        };

        const response = await UpdateWork(payload, idWork);

        if (!response.success) {
          showError(response.error || "Erro ao salvar alterações");
          return;
        }

        setChangedFields(undefined);
        showSuccess(response.message);
        modals.setOpenModal(true);
      } catch {
        showError("Erro de conexão. Tente novamente.");
      }
    });
  }, [
    changedFields,
    editableData.id_status,
    suspensionReason,
    idWork,
    modals,
    showError,
    showSuccess,
  ]);

  const handleSavePublicationRestriction = useCallback(
    async (restrictions: any[]) => {
      modals.setDrawerOpen(false);

      startTransition(async () => {
        try {
          const response = await InsertPublicationRestrictions(restrictions);

          if (!response.success) {
            showError(response.error || "Erro ao salvar alterações");
            return;
          }

          showSuccess(response.message);
          modals.setOpenModal(true);
        } catch (err: any) {
          showError(err.message);
        }
      });
    },
    [modals, showError, showSuccess],
  );

  if (hasRestrictedAccess(data.id_status, permissions?.tipo_usuario)) {
    return <ErrorThrower message="Nível de permissão insuficiente" />;
  }

  return (
    <>
      <div className="w-full flex justify-between items-center my-4 px-2 md:px-8">
        <p className="text-2xl font-extrabold">Informações gerais</p>

        <div className="flex gap-4">
          {canShowPublicationButton && (
            <ButtonComponent
              onClick={() => modals.setDrawerOpen(true)}
              text="Adicionar restrição publicação"
              styled="px-6 py-7"
            />
          )}

          {isMounted && (
            <div className="gap-3 self-center rounded-md px-4">
              <ButtonComponent
                startIcon={FEASIBILITY_ACTION_ICON[workflowStatus]}
                text={FEASIBILITY_ACTION_LABEL[workflowStatus]}
                styled={FEASIBILITY_ACTION_COLOR[workflowStatus]}
                onClick={() =>
                  router.push(
                    `/viabilidade/${idWork}?status=${workflowStatus}&ponto_a_ponto=${programacao_ponto_a_ponto}`,
                  )
                }
                disabled={
                  !permissions?.permissao_edicao &&
                  [42, 43, 45, 46].includes(id_status)
                }
              />
            </div>
          )}

          <ButtonComponent
            text={isPending ? "Salvando..." : "Salvar alterações"}
            styled="px-6 py-7"
            onClick={handleSubmit}
            disabled={isSaveDisabled}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 md:px-4 w-full">
        <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
          <DataItem label="Ov/Nota" value={data.ovnota} />
          <DataItem label="Tipo" value={data.tipos} />
          <DataItem label="Municipio" value={data.municipios} />
          <DataItem label="Referência" value={data.referencia} />
          <DataItem label="Circuitos" value={data.circuitos} />
          <DataItem label="Conjunto" value={data.conjunto} />
        </div>

        <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
          <DataItem label="Pep" value={data.pep} status={data.status_pep} />
          <DataItem
            label="Diagrama"
            value={data.diagrama}
            status={data.status_diagrama}
          />
          <DataItem
            label="Ordem DCI"
            value={data.ordem_dci}
            status={data.status_170}
          />
          <DataItem
            label="Ordem DCD"
            value={data.ordem_dcd}
            status={data.status_190}
          />
          <DataItem
            label="Ordem DCA"
            value={data.ordem_dca}
            status={data.status_150}
          />
          <DataItem
            label="Ordem DCIM"
            value={data.ordem_dcim}
            status={data.status_180}
          />
        </div>

        <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
          <DataItem label="Entrada" value={formattedData.entrada} />
          <DataItem label="Prazo" value={formattedData.prazo} />
          <DataItem label="Data prazo final" value={formattedData.prazoFinal} />

          <div className="max-w-96 w-[342px] xl:w-full xl:max-w-[90%] flex gap-2 mb-3">
            <div className="flex-1">
              <SummaryDataItem
                label="Programado"
                value={formattedData.totalProgramado}
              />
            </div>

            <div className="flex-1">
              <SummaryDataItem
                label="Executado"
                value={formattedData.executadoFormatted}
              />
            </div>
          </div>

          <DataItem
            label="Data conclusão"
            value={formattedData.data_conclusao}
          />
          <DataItem
            label="Ano planejamento"
            value={data.ano_plan}
            background={formattedData.backgroundColor}
          />
        </div>

        <div className="flex flex-col items-start md:items-center col-start-2 col-end-3 md:col-start-auto md:col-end-auto">
          <DataItem label="Status Sap" value={data.status_ov_sap} />
          <EditableColumn
            data={editableData}
            options={options}
            onHandleChange={handleDataChange}
            EditSuspension={
              Number(editableData.id_status) === SUSPENDED_STATUS_ID &&
              suspensionReason ? (
                <Tooltip title="Editar motivo da suspensão">
                  <IconButton
                    onClick={modals.toggleSuspensionModal}
                    color="primary"
                    size="small"
                  >
                    <PencilIcon
                      className="text-blue-600"
                      width={25}
                      height={25}
                    />
                  </IconButton>
                </Tooltip>
              ) : null
            }
          />

          <DataItem
            label="Viabilidade"
            value={formattedData.dataViabilidade}
            status={data.prazo_viabilidade}
          />

          <DataItem label="Empreendimento" value={data.empreendimento} />
        </div>
      </div>

      <div className="w-[95%] flex justify-between items-start mb-3 self-center border border-zinc-700 border-solid px-2 rounded-md">
        <p className="h-full xl:text-lg font-semibold min-w-28 text-center border-r border-zinc-700 border-solid flex items-center justify-start">
          Observação
        </p>
        <textarea
          value={editableData.observ_obra || ""}
          onChange={(e) => handleDataChange("observ_obra", e.target.value)}
          disabled={
            (permissions?.id_area === 8 && !permissions?.permissao_edicao) ||
            permissions?.id_area !== 8
          }
          className="flex-1 h-full min-w-32 lg:min-w-36 font-medium text-xl text-center p-2 bg-transparent focus:outline-none"
        />
      </div>

      <RestrictionDrawer
        open={modals.drawerOpen}
        onClose={() => modals.setDrawerOpen(false)}
        data={null}
        onSave={handleSavePublicationRestriction}
        restrictionsValues={publicationRestrictions}
        idWork={Number(data.id)}
        idParceira={Number(data.id_turma)}
        isInsert={true}
      />

      <ModalComponent
        title="Motivo da Suspensão"
        onClose={modals.toggleSuspensionModal}
        open={modals.openSuspensionModal}
      >
        <Select
          value={suspensionReason}
          onChange={(e: SelectChangeEvent<string>) =>
            setSuspensionReason(e.target.value)
          }
          className="w-3/5"
          sx={{
            ".MuiSelect-select": {
              textAlign: "center",
              fontSize: "1rem",
              padding: "6px 0",
            },
          }}
          MenuProps={{
            PaperProps: {
              style: { maxHeight: 400 },
            },
          }}
        >
          {SUSPENSION_OPTIONS.map((value, idx) => (
            <MenuItem key={idx} value={value}>
              {value}
            </MenuItem>
          ))}
        </Select>
        <div className="mt-4 flex justify-end">
          <ButtonComponent
            text="Confirmar"
            onClick={modals.toggleSuspensionModal}
          />
        </div>
      </ModalComponent>
    </>
  );
}
