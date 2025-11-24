import {
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  memo,
} from "react";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import ConfirmationModalComponent from "@/components/details/modals/confirmationModal";
import ErrorModal from "@/components/common/ErrorModal";
import FailureModalComponent from "../details/modals/failureModal";

interface ModalsManagerProps2 {
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

export interface ModalsManagerRef2 {
  showError: (message: string) => void;
  handleRejectedModalOpen: (value: boolean) => void;
  openConfirmDeleteSchedule: (id: number) => void;
  openConfirmDeleteExecution: (id: number) => void;
}

export const ModalsManagerV2 = forwardRef<
  ModalsManagerRef2,
  ModalsManagerProps2
>(
  (
    {
      handleReject,
      rejectedSchedule,
      onConfirmDelete,
      onConfirmExecutionDelete,
    },
    ref
  ) => {
    const [error, setError] = useState<string | null>(null);
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false);
    const [openConfirmationModalExecution, setOpenConfirmationModalExecution] =
      useState(false);
    const [isRejectModalOpen, setIsRejectedModalOpen] =
      useState<boolean>(false);
    const [idSchedule, setIdSchedule] = useState<number>(0);

    useImperativeHandle(ref, () => ({
      showError: (message) => setError(message),
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

ModalsManagerV2.displayName = "ModalsManagerV2";

export default memo(ModalsManagerV2);
