import {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
} from "react";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import ConfirmationModalComponent from "@/components/details/modals/confirmationModal";
import ModalComponent from "@/components/common/Modal";
import ErrorModal from "@/components/common/ErrorModal";
import { ExecutionReportDialog } from "./executionReportDialog/executionReportDialog";
import ScheduleFormDialog from "./scheduleDialog/dialog";
import FailureModalComponent from "./failureModal";

interface ModalsManagerProps {
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
  } | null;
  handleReject: (data: {
    id: number;
    reject: boolean;
    reason: string;
    description: string;
  }) => void;
}

export interface ModalsManagerRef {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  handleDialog: (value: boolean) => void;
  handleExecutionDialog: (value: boolean) => void;
  handleRejectedModalOpen: (value: boolean) => void;
  openConfirmDeleteSchedule: (id: number) => void;
  openConfirmDeleteExecution: (id: number) => void;
}

export const ModalsManager = forwardRef<ModalsManagerRef, ModalsManagerProps>(
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
    },
    ref
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

    return (
      <>
        <ModalComponent title="Sucesso" onClose={toggleModal} open={openModal}>
          <span className="text-center text-lg text-gray-700 dark:text-gray-200 mb-6">
            {success}
          </span>
        </ModalComponent>

        <ConfirmationModalComponent
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
          rejectedSchedule={rejectedSchedule}
          handleReject={handleReject}
        />

        <ConfirmationModalComponent
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
        />

        <ExecutionReportDialog
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
  }
);

ModalsManager.displayName = "ModalsManager";

export default memo(ModalsManager);
