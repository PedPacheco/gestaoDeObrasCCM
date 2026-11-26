"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import { deleteD5NoteSchedule, RejectedD5Schedules } from "@/actions/d5Notes";
import ConfirmationScheduleModalComponent from "@/components/common/confirmationScheduleModal";
import { useFeedback } from "@/hooks/useFeedback";

import {
  D5NotesRejectionsDataType,
  RestrictionOption,
  schedulesDataType,
  TechnicianOption,
} from "@/types/d5Notes";
import { useRouter } from "next/navigation";
import D5TabActions, { TAB_REJECTED, TAB_SCHEDULES } from "./d5TabsActions";
import D5ScheduleFormDialog from "./modal/d5ScheduleFormDialog";
import RejectionsD5NotePanelItem from "./rejectionsD5NotePanelItem";
import RejectSchedulesModal from "./rejectSchedulesModal";
import SchedulesD5NotePanelItem from "./schedulesD5NotePanelItem";

interface D5NotesPanelProps {
  schedulesData: schedulesDataType[];
  rejectionsData: D5NotesRejectionsDataType[];
  d5NoteId: number;
  options: {
    tecnico: TechnicianOption[];
    restricao: RestrictionOption[];
  };
}

const TAB_STORAGE_KEY = "d5NotesPanelTab";

export function D5NotesPanel({
  schedulesData,
  rejectionsData,
  d5NoteId,
  options,
}: D5NotesPanelProps) {
  const { showError, showSuccess } = useFeedback();
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Inicia sempre em "Programações"; o valor salvo é lido após a montagem
  // para evitar divergência de hidratação (SSR x localStorage).
  const [tabValue, setTabValue] = useState<number>(TAB_SCHEDULES);

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

  // Restaura a aba salva
  useEffect(() => {
    const saved = Number(localStorage.getItem(TAB_STORAGE_KEY));
    if (saved === TAB_SCHEDULES || saved === TAB_REJECTED) {
      setTabValue(saved);
    }
  }, []);

  useEffect(() => {
    setSchedulesToBeRejected(new Set());
  }, [schedulesData]);

  const hasSelection = schedulesToBeRejected.size > 0;

  const handleCloseDeletionModal = useCallback(() => {
    setOpenDeletionModal(false);
    setSelectedScheduleId(null);
  }, []);

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
  }, [
    selectedScheduleId,
    d5NoteId,
    showSuccess,
    showError,
    router,
    handleCloseDeletionModal,
  ]);

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

  const handleOpenRejectionModal = useCallback(() => {
    if (!hasSelection) {
      showError("Selecione pelo menos uma programação para reprovar.");
      return;
    }
    setOpenRejectionModal(true);
  }, [hasSelection, showError]);

  const handleChangeTab = useCallback(
    (_: React.SyntheticEvent, newValue: number) => {
      if (newValue !== TAB_SCHEDULES && newValue !== TAB_REJECTED) return;

      setTabValue(newValue);
      setSchedulesToBeRejected(new Set()); // seleção não deve vazar entre abas
      localStorage.setItem(TAB_STORAGE_KEY, String(newValue));
    },
    [],
  );

  return (
    <>
      <div className="flex h-[620px] min-w-0 flex-1 flex-col overflow-hidden shadow-lg">
        {/* Abas + ações (ações só na aba Programações) */}
        <D5TabActions
          valueTab={tabValue}
          handleChange={handleChangeTab}
          onNewSchedule={handleNewSchedule}
          onRejectSchedules={handleOpenRejectionModal}
          schedulesCount={schedulesData.length}
          rejectedCount={rejectionsData.length}
        />

        {/* Tabela */}
        <div
          role="tabpanel"
          className="relative min-h-0 min-w-0 flex-1 overflow-hidden"
        >
          {tabValue === TAB_SCHEDULES ? (
            <SchedulesD5NotePanelItem
              data={schedulesData}
              onDelete={handleDeleteSchedule}
              onEdit={handleEditSchedule}
              schedulesToBeRejected={schedulesToBeRejected}
              setSchedulesToBeRejected={setSchedulesToBeRejected}
            />
          ) : (
            <RejectionsD5NotePanelItem data={rejectionsData} />
          )}
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
            return;
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
