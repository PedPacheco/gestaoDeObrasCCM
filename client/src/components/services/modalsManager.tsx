import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";

import { UseExecutionServiceFormReturn } from "@/hooks/useExecutionServicesForm";
import { useFeedback } from "@/hooks/useFeedback";

import ConfirmationScheduleModalComponent from "../common/confirmationScheduleModal";
import FailureModalComponent from "../common/failureModal";
import { ExecutionReportDialog } from "../executionReport/executionReportDialog";

interface NewModalsManagerProps {
  onConfirmDelete: (id: number) => void;
  onConfirmExecutionDelete: (id: number) => void;
  onCloseDialog: () => void;
  options: any;
  rejectedSchedule: {
    id: number;
    reject: boolean;
  }[];
  handleReject: (
    data: {
      id: number;
      reject: boolean;
      reason: string;
      description: string;
    }[],
  ) => void;
  executionForm: UseExecutionServiceFormReturn;
}

export interface NewModalsManagerRef {
  handleExecutionDialog: (value: boolean) => void;
  handleRejectedModalOpen: (value: boolean) => void;
  openConfirmDeleteSchedule: (id: number) => void;
  openConfirmDeleteExecution: (id: number) => void;
}

export const NewModalsManager = forwardRef<
  NewModalsManagerRef,
  NewModalsManagerProps
>(
  (
    {
      handleReject,
      rejectedSchedule,
      onConfirmDelete,
      onConfirmExecutionDelete,
      onCloseDialog,
      executionForm,
      options,
    },
    ref,
  ) => {
    const { showSuccess } = useFeedback();

    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [openConfirmationModalExecution, setOpenConfirmationModalExecution] =
      useState(false);
    const [isRejectModalOpen, setIsRejectedModalOpen] =
      useState<boolean>(false);
    const [isExecutionDialogOpen, setIsExecutionDialogOpen] = useState(false);
    const [idSchedule, setIdSchedule] = useState<number>(0);

    useImperativeHandle(ref, () => ({
      handleRejectedModalOpen: (value: boolean) =>
        setIsRejectedModalOpen(value),
      handleExecutionDialog: (value: boolean) =>
        setIsExecutionDialogOpen(value),
      openConfirmDeleteSchedule: (id) => {
        setIdSchedule(id);
        setOpenConfirmationModal(true);
      },
      openConfirmDeleteExecution: (id) => {
        setIdSchedule(id);
        setOpenConfirmationModalExecution(true);
      },
    }));

    const handleConfirmDelete = useCallback(() => {
      onConfirmDelete(idSchedule);
      setOpenConfirmationModal(false);
      setIdSchedule(0);
    }, [idSchedule, onConfirmDelete]);

    const handleConfirmExecutionDelete = useCallback(() => {
      onConfirmExecutionDelete(idSchedule);
      setOpenConfirmationModalExecution(false);
      setIdSchedule(0);
    }, [idSchedule, onConfirmExecutionDelete]);

    const optionsFailure = options.restricao.filter(
      (restriction: any) => restriction.tipo_restricao === "REPROVADO",
    );

    return (
      <>
        <ConfirmationScheduleModalComponent
          idSchedule={idSchedule}
          message="Você deseja realmente excluir essa programação ?"
          onClose={() => setOpenConfirmationModal(false)}
          onConfirm={handleConfirmDelete}
          open={openConfirmationModal}
          title="Exclusão de programação"
        />

        <FailureModalComponent
          onClose={() => setIsRejectedModalOpen(false)}
          open={isRejectModalOpen}
          options={optionsFailure}
          rejectedSchedule={rejectedSchedule}
          handleReject={handleReject}
        />

        <ConfirmationScheduleModalComponent
          idSchedule={idSchedule}
          message="Você deseja realmente excluir esse relatório ?"
          onClose={() => setOpenConfirmationModalExecution(false)}
          onConfirm={handleConfirmExecutionDelete}
          open={openConfirmationModalExecution}
          title="Exclusão de relatório"
        />

        <ExecutionReportDialog
          open={isExecutionDialogOpen}
          onClose={onCloseDialog}
          executionForm={executionForm}
          executionReportIsInsert={false}
          onModalOpen={setIsExecutionDialogOpen}
          onSuccess={(message) => {
            showSuccess(message);
          }}
        />
      </>
    );
  },
);

NewModalsManager.displayName = "NewModalsManager";

export default memo(NewModalsManager);
