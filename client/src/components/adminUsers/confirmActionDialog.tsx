"use client";

import { ReactNode } from "react";

import ModalComponent from "@/components/common/Modal";
import { ButtonComponent } from "@/components/common/Button";
import { AdminUser } from "@/types/adminUsers";

interface ConfirmActionDialogProps {
  user: AdminUser | null;
  title: string;
  message: ReactNode;
  confirmText: string;
  isMutating: boolean;
  onCancel: () => void;
  onConfirm: (user: AdminUser) => void;
}

export function ConfirmActionDialog({
  user,
  title,
  message,
  confirmText,
  isMutating,
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) {
  return (
    <ModalComponent open={!!user} onClose={onCancel} title={title}>
      <div className="flex flex-col items-center gap-6 pb-4">
        {message}

        <div className="flex gap-4">
          <ButtonComponent text="Cancelar" onClick={onCancel} />
          <ButtonComponent
            text={confirmText}
            disabled={isMutating}
            onClick={() => user && onConfirm(user)}
          />
        </div>
      </div>
    </ModalComponent>
  );
}
