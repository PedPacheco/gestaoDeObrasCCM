"use client";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { deleteFeasibilityFiles } from "@/actions/feasibility";
import { InsertPublicationRestrictions } from "@/actions/restrictions";
import { UpdateWork } from "@/actions/works";
import { ButtonComponent } from "@/components/common/Button";
import { ErrorThrower } from "@/components/common/ErrorThrower";
import ModalComponent from "@/components/common/Modal";
import { useUser } from "@/contexts/userContext";
import { useFeedback } from "@/hooks/useFeedback";
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  PencilIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import {
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  Tooltip,
} from "@mui/material";

import DataItem from "./dataItem";
import { EditableColumn } from "./editableColumn";
import { FeasibiltyUpload } from "./feasibilityImportModal";

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
  feasibilityExists: any[];
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
  tipo_ads: string;
  observ_obra: string;
  id: string;
}

interface FormattedData {
  entrada: string;
  prazo: string;
  prazoFinal: string;
  data_conclusao: string;
  dataEmpreitamento: string;
  backgroundColor: string;
  executadoFormatted: string;
}

interface EditableData {
  data_empreitamento: string;
  id_status: number;
  id_turma: string;
  tipo_ads: string;
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
  const [openModal, setOpenModal] = useState(false);
  const [openSuspensionModal, setOpenSuspensionModal] = useState(false);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  return {
    openModal,
    setOpenModal,
    openConfirmModal,
    setOpenConfirmModal,
    toggleModal: useCallback(() => setOpenModal((prev) => !prev), []),
    openSuspensionModal,
    setOpenSuspensionModal,
    toggleSuspensionModal: useCallback(
      () => setOpenSuspensionModal((prev) => !prev),
      [],
    ),
    openUploadModal,
    setOpenUploadModal,
    drawerOpen,
    setDrawerOpen,
  };
}

function formatDateForSubmit(value: string): string | null {
  if (!value) return null;
  const parsed = dayjs(value, "DD/MM/YYYY", true);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : value;
}

function hasRestrictedAccess(statusId: number, permission?: string): boolean {
  return RESTRICTED_STATUS_IDS.includes(statusId) && permission === "parcial";
}

export function WorkDetails({
  data,
  idWork,
  formattedData,
  options,
  feasibilityExists,
}: WorkDetailsProps) {
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const [hasFilesFeasibility, setHasFilesFeasibility] =
    useState<boolean>(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [changedFields, setChangedFields] =
    useState<Record<string, string | null>>();

  const [editableData, setEditableData] = useState<EditableData>({
    data_empreitamento: formattedData.dataEmpreitamento,
    id_status: data.id_status,
    id_turma: data.id_turma,
    tipo_ads: data.tipo_ads,
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
    () => isMounted && permissions?.permissao_publicacao && data.executado > 0,
    [isMounted, permissions?.permissao_publicacao, data.executado],
  );

  const canEditObservation = useMemo(
    () =>
      permissions?.permissao_visualizacao !== "parcial" &&
      permissions?.permissao !== "Sem permissão",
    [permissions],
  );

  const isSaveDisabled = useMemo(
    () =>
      isPending || !changedFields || Object.keys(changedFields).length === 0,
    [isPending, changedFields],
  );

  useEffect(() => {
    setHasFilesFeasibility(!!feasibilityExists?.length);
    setIsMounted(true);
  }, [feasibilityExists]);

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

  const handleUploadSuccess = useCallback(() => {
    setHasFilesFeasibility(true);
    modals.setOpenUploadModal(false);

    showSuccess("Arquivos enviados com sucesso!");
    modals.setOpenModal(true);

    router.refresh();
  }, [modals, router, showSuccess]);

  const handleFeasibilityFilesDelete = () => {
    startTransition(async () => {
      try {
        const response = await deleteFeasibilityFiles(idWork);

        if (!response.success) {
          showError("Erro ao excluir viabilidade");
          return;
        }

        showSuccess(response.message);
        modals.setOpenModal(true);

        router.refresh();
      } catch (error: any) {
        showError(error.message);
      } finally {
        modals.setOpenConfirmModal(false);
      }
    });
  };

  if (
    hasRestrictedAccess(data.id_status, permissions?.permissao_visualizacao)
  ) {
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

          {!hasFilesFeasibility && isMounted ? (
            <ButtonComponent
              text="Importar Arquivos de Viabilidade"
              styled="bg-blue-600 hover:bg-blue-700 px-6 py-7"
              onClick={() => modals.setOpenUploadModal(true)}
            />
          ) : (
            <div className="flex items-center gap-2 self-center border border-green-800 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-md">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
              <p className="text-green-700 dark:text-green-400 font-semibold">
                Viabilidade Importada
              </p>

              {feasibilityExists?.map((file: any, i: number) => {
                const url = `${process.env.NEXT_PUBLIC_API_URL}/uploads/viabilidade/${file.caminho_arquivo}`;

                return (
                  <Tooltip key={i} title={`${file.caminho_arquivo}`}>
                    <IconButton>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xl hover:scale-110 transition-transform "
                      >
                        <DocumentTextIcon
                          width={30}
                          height={30}
                          className="text-green-600"
                        />
                      </a>
                    </IconButton>
                  </Tooltip>
                );
              })}

              <IconButton
                onClick={() => modals.setOpenConfirmModal(true)}
                className="w-10 h-10 text-zinc-600"
              >
                <XMarkIcon />
              </IconButton>
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
          <DataItem
            label="Executado"
            value={formattedData.executadoFormatted}
          />
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
          disabled={!canEditObservation}
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
        idRegional={data.idRegional}
        isInsert={true}
      />

      <FeasibiltyUpload
        open={modals.openUploadModal}
        onClose={() => modals.setOpenUploadModal(false)}
        idWork={data.id}
        onUploadSuccess={handleUploadSuccess}
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

      <ModalComponent
        title="Confirmar exclusão"
        open={modals.openConfirmModal}
        onClose={() => modals.setOpenConfirmModal(false)}
      >
        <div className="flex flex-col items-center gap-6">
          <ExclamationCircleIcon
            width={48}
            height={48}
            className="text-red-500"
          />

          <span className="text-center text-lg text-gray-700 dark:text-gray-200">
            Tem certeza que deseja excluir esta viabilidade?
            <br />
            <strong>Essa ação não poderá ser desfeita.</strong>
          </span>

          <div className="flex gap-4">
            <ButtonComponent
              text="Confirmar Exclusão"
              styled="min-w-32"
              onClick={handleFeasibilityFilesDelete}
              disabled={isPending}
            />
          </div>
        </div>
      </ModalComponent>
    </>
  );
}
