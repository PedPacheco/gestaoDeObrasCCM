"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { deleteD5NoteSchedule, RejectedD5Schedules } from "@/actions/d5Notes";
import { ButtonComponent } from "@/components/common/Button";
import ConfirmationScheduleModalComponent from "@/components/common/confirmationScheduleModal";
import { useFeedback } from "@/hooks/useFeedback";

import D5ScheduleFormDialog from "./modal/d5ScheduleFormDialog";
import SchedulesD5NotePanelItem from "./schedulesD5NotePanelItem";
import { useRouter } from "next/navigation";
import RejectSchedulesModal from "./rejectSchedulesModal";

// Ajuste o caminho acima conforme a localização real do seu hook.

export type schedulesDataType = {
  id: number;
  id_nota_d5: number;
  criado_em: string;
  data_prog: string;
  hora_ini: string;
  hora_ter: string;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_execucao: string | null;
  observacao_programacao: string | null;
  usuarioCriador: string | null;
  usuarioModificador: string | null;
  restricao: string;
  tecnico: string;
  responsavel_restricao: string | null;
  idTecnico: number;
  idRestricao: number;
  caminhos_arquivos: string[];
  reprovada: boolean;
};

export type RejectD5SchedulePayload = {
  id: number;
  reason: string;
  description: string;
};

type ScheduleOption = {
  id: number;
  tecnico: string;
};

export type RestrictionOption = {
  id: number;
  restricao: string;
  tipo_restricao: string;
  responsabilidade: string;
};

interface D5NotesPanelProps {
  schedulesData: schedulesDataType[];
  d5NoteId: number;
  options: {
    tecnico: ScheduleOption[];
    restricao: RestrictionOption[];
  };
}

export function D5NotesPanel({
  schedulesData,
  d5NoteId,
  options,
}: D5NotesPanelProps) {
  const { showError, showSuccess } = useFeedback();

  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const [openRejectionModal, setOpenRejectionModal] = useState(false);
  const [openDeletionModal, setOpenDeletionModal] = useState(false);
  const [openScheduleForm, setOpenScheduleForm] = useState(false);

  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(
    null,
  );

  const [selectedSchedule, setSelectedSchedule] = useState<
    schedulesDataType | undefined
  >(undefined);

  const [schedulesToBeRejected, setSchedulesToBeRejected] = useState<
    Set<number>
  >(new Set());

  useEffect(() => {
    setSchedulesToBeRejected(new Set());
  }, [schedulesData]);

  const selectedCount = schedulesToBeRejected.size;
  const hasSelection = selectedCount > 0;

  const handleDeleteSchedule = useCallback((idSchedule: number) => {
    setSelectedScheduleId(idSchedule);
    setOpenDeletionModal(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (selectedScheduleId === null) return;

    startTransition(async () => {
      const result = await deleteD5NoteSchedule(selectedScheduleId, d5NoteId);

      if (!result.success) {
        showError(
          result.error ??
            result.message ??
            "Não foi possível eliminar a programação.",
        );
        return;
      }

      handleCloseDeletionModal();
      showSuccess(result.message ?? "Programação eliminada com sucesso.");
      router.refresh();
    });
  }, [selectedScheduleId, d5NoteId, showError, showSuccess]);

  const handleCloseDeletionModal = useCallback(() => {
    setOpenDeletionModal(false);
    setSelectedScheduleId(null);
  }, []);

  const handleCloseScheduleForm = useCallback(() => {
    setOpenScheduleForm(false);
    setSelectedSchedule(undefined);
  }, []);

  const handleEditSchedule = useCallback(
    (idSchedule: number) => {
      const schedule = schedulesData.find((item) => item.id === idSchedule);

      if (!schedule) {
        showError("Não foi possível encontrar a programação selecionada.");
        return;
      }

      setSelectedSchedule(schedule);
      setOpenScheduleForm(true);
    },
    [schedulesData, showError],
  );

  const handleNewSchedule = useCallback(() => {
    setSelectedSchedule(undefined);
    setOpenScheduleForm(true);
  }, []);

  const handleOpenRejectionModal = () => {
    if (!hasSelection) {
      showError("Selecione pelo menos uma programação para reprovar.");
      return;
    }
    setOpenRejectionModal(true);
  };

  return (
    <>
      <div className="flex h-[620px] min-w-0 flex-1 flex-col shadow-lg">
        {/* Cabeçalho */}
        <div className="flex justify-end items-center gap-2 shrink-0 border-b border-solid border-zinc-300">
          <div className="px-2 py-2">
            <ButtonComponent
              onClick={handleOpenRejectionModal}
              text="Reprovar programações"
            />
          </div>
          <div className="px-2 py-2">
            <ButtonComponent
              onClick={handleNewSchedule}
              text="Nova programação"
            />
          </div>
        </div>

        {/* Tabela */}
        <div className="relative min-h-0 min-w-0 flex-1">
          <SchedulesD5NotePanelItem
            data={schedulesData}
            onDelete={handleDeleteSchedule}
            onEdit={handleEditSchedule}
            schedulesToBeRejected={schedulesToBeRejected}
            setSchedulesToBeRejected={setSchedulesToBeRejected}
          />
        </div>
      </div>

      <RejectSchedulesModal
        open={openRejectionModal}
        onClose={() => setOpenRejectionModal(false)}
        options={options.restricao}
        selectedIds={schedulesToBeRejected}
        onConfirm={async (payload) => {
          const response = await RejectedD5Schedules(d5NoteId, payload);

          if (!response.success) {
            showError(response.error);
          }

          showSuccess("Programações reprovadas com sucesso.");
          setSchedulesToBeRejected(new Set());
          startTransition(() => router.refresh());
        }}
      />

      {/* Modal de confirmação da eliminação */}
      {selectedScheduleId !== null && (
        <ConfirmationScheduleModalComponent
          idSchedule={selectedScheduleId}
          message="Deseja realmente eliminar esta programação?"
          onClose={handleCloseDeletionModal}
          onConfirm={handleConfirmDelete}
          open={openDeletionModal}
          title="Eliminação de programação"
        />
      )}

      {/* Modal de inserção/edição */}
      <D5ScheduleFormDialog
        open={openScheduleForm}
        onClose={handleCloseScheduleForm}
        d5NoteId={d5NoteId}
        schedule={selectedSchedule}
        options={options}
        onError={showError}
        onSuccess={(message) => {
          handleCloseScheduleForm();
          showSuccess(message);
        }}
      />
    </>
  );
}
