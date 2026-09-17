import ConfirmationModalComponent from "@/components/common/confirmationModal";

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
      <ConfirmationModalComponent
        open={Boolean(itemToDelete)}
        onClose={onCloseDeleteItem}
        onConfirm={onDeleteItem}
        actionId={itemToDelete?.id ?? 0}
        title="Excluir serviço/material"
        message={`Deseja realmente excluir "${
          itemToDelete?.textoBreve ?? ""
        }"? Esta ação não poderá ser desfeita.`}
      />

      <ConfirmationModalComponent
        open={openDeleteAllModal}
        onClose={onCloseDeleteAll}
        onConfirm={onDeleteAll}
        actionId={workId}
        title="Excluir todos os serviços/materiais"
        message="Deseja realmente excluir todos os serviços e materiais desta obra? Esta ação não poderá ser desfeita."
      />
    </>
  );
}
