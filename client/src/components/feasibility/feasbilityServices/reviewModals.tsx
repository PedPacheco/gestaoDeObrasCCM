import ConfirmationScheduleModalComponent from "@/components/common/confirmationScheduleModal";

interface ReviewModalsProps {
  itemToDelete: {
    id: number;
    textoBreve: string;
  } | null;
  openDeleteAllModal: boolean;
  workId: number;
  onCloseDeleteItem: () => void;
  onCloseDeleteAll: () => void;
  onDeleteItem: (id: number) => Promise<void>;
  onDeleteAll: () => Promise<void>;
}

export function ReviewModals({
  itemToDelete,
  openDeleteAllModal,
  workId,
  onCloseDeleteItem,
  onCloseDeleteAll,
  onDeleteItem,
  onDeleteAll,
}: ReviewModalsProps) {
  return (
    <>
      <ConfirmationScheduleModalComponent
        open={Boolean(itemToDelete)}
        onClose={onCloseDeleteItem}
        onConfirm={onDeleteItem}
        idSchedule={itemToDelete?.id ?? 0}
        title="Excluir serviço/material"
        message={`Deseja realmente excluir "${
          itemToDelete?.textoBreve ?? ""
        }"? Esta ação não poderá ser desfeita.`}
      />

      <ConfirmationScheduleModalComponent
        open={openDeleteAllModal}
        onClose={onCloseDeleteAll}
        onConfirm={onDeleteAll}
        idSchedule={workId}
        title="Excluir todos os serviços/materiais"
        message="Deseja realmente excluir todos os serviços e materiais desta obra? Esta ação não poderá ser desfeita."
      />
    </>
  );
}
