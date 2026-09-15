"use client";

import ModalComponent from "@/components/common/Modal";
import { ButtonComponent } from "@/components/common/Button";
import { AdminUser } from "@/types/adminUsers";

interface DeactivateConfirmDialogProps {
  user: AdminUser | null;
  isMutating: boolean;
  onCancel: () => void;
  onConfirm: (user: AdminUser) => void;
}

export function DeactivateConfirmDialog({
  user,
  isMutating,
  onCancel,
  onConfirm,
}: DeactivateConfirmDialogProps) {
  return (
    <ModalComponent
      open={!!user}
      onClose={onCancel}
      title="Desativar usuário"
    >
      <div className="flex flex-col items-center gap-6 pb-4">
        <p>
          Tem certeza que deseja desativar o usuário{" "}
          <strong>{user?.username}</strong>?
        </p>

        <div className="flex gap-4">
          <ButtonComponent text="Cancelar" onClick={onCancel} />
          <ButtonComponent
            text="Desativar"
            disabled={isMutating}
            onClick={() => user && onConfirm(user)}
          />
        </div>
      </div>
    </ModalComponent>
  );
}
