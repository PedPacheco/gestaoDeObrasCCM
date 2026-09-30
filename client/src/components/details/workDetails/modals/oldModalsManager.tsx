import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";

import ErrorModal from "@/components/common/ErrorModal";
import ModalComponent from "@/components/common/Modal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import { OldExecutionReportDialog } from "./oldExecutionReportDialog/oldExecutionReportDialog";
import ScheduleFormDialog from "./scheduleDialog/dialog";
import ConfirmationScheduleModalComponent from "@/components/common/confirmationScheduleModal";
import FailureModalComponent from "@/components/common/failureModal";

interface OldModalsManagerProps {
  idWork: any;
  totalExec: number;
  statusWork: number;
  options: any;
  scheduleForm: any;
  isInsert: boolean;
  executionReportIsInsert: boolean;
  onCloseDialog: () => void;
  onConfirmDelete: (id: number) => void;
  onConfirmExecutionDelete: (id: number) => void;
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
  scheduleStatus: string;
}

export interface OldModalsManagerRef {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  handleDialog: (value: boolean) => void;
  handleExecutionDialog: (value: boolean) => void;
  handleRejectedModalOpen: (value: boolean) => void;
  openConfirmDeleteSchedule: (id: number) => void;
  openConfirmDeleteExecution: (id: number) => void;
}

export const OldModalsManager = forwardRef<
  OldModalsManagerRef,
  OldModalsManagerProps
>(
  (
    {
      idWork,
      statusWork,
      options,
      scheduleForm,
      isInsert,
      executionReportIsInsert,
      handleReject,
      rejectedSchedule,
      onCloseDialog,
      onConfirmDelete,
      onConfirmExecutionDelete,
      totalExec,
      scheduleStatus,
    },
    ref,
  ) => {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [openConfirmationModalExecution, setOpenConfirmationModalExecution] =
      useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
    const [isExecutionDialogOpen, setIsExecutionDialogOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectedModalOpen] =
      useState<boolean>(false);
    const [idSchedule, setIdSchedule] = useState<number>(0);

    useImperativeHandle(ref, () => ({
      showSuccess: (message) => {
        setSuccess(message);
        setOpenModal(true);
      },
      showError: (message) => setError(message),
      handleDialog: (value: boolean) => setIsDialogOpen(value),
      handleExecutionDialog: (value: boolean) =>
        setIsExecutionDialogOpen(value),
      handleRejectedModalOpen: (value: boolean) =>
        setIsRejectedModalOpen(value),
      openConfirmDeleteSchedule: (id) => {
        setIdSchedule(id);
        setOpenConfirmationModal(true);
      },
      openConfirmDeleteExecution: (id) => {
        setIdSchedule(id);
        setOpenConfirmationModalExecution(true);
      },
    }));

    const toggleModal = useCallback(() => {
      setOpenModal((prev) => !prev);
    }, []);

    const closeError = useCallback(() => setError(null), []);

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
        <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
          <span className="text-center text-lg text-gray-700 dark:text-gray-200 mb-6">
            {success}
          </span>
        </ModalComponent>

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

        <ScheduleFormDialog
          open={isDialogOpen}
          onClose={onCloseDialog}
          idWork={idWork}
          isInsert={isInsert}
          onError={setError}
          onSuccess={(message) => {
            setSuccess(message);
            setOpenModal(true);
          }}
          options={options}
          scheduleForm={scheduleForm}
          statusWork={statusWork}
          onModalOpen={setOpenModal}
          onExecutionDialogOpen={setIsExecutionDialogOpen}
          scheduleStatus={scheduleStatus}
        />

        <OldExecutionReportDialog
          open={isExecutionDialogOpen}
          onClose={onCloseDialog}
          idWork={idWork}
          isInsert={isInsert}
          executionReportIsInsert={executionReportIsInsert}
          onError={setError}
          onSuccess={(message) => {
            setSuccess(message);
            setOpenModal(true);
          }}
          scheduleForm={scheduleForm}
          onModalOpen={setOpenModal}
          totalExec={totalExec}
        />

        {error && (
          <ErrorModal
            open={true}
            message={error}
            onClose={closeError}
            icon={<ExclamationCircleIcon width={48} height={48} />}
          />
        )}
      </>
    );
  },
);

OldModalsManager.displayName = "OldModalsManager";

export default memo(OldModalsManager);
