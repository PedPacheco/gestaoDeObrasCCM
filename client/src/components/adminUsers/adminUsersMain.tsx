// app/administrar-login/AdminLoginClient.tsx
"use client";

import { useState } from "react";

import { useFeedback } from "@/hooks/useFeedback";
import { useAdminUsers } from "@/hooks/adminUsers/useAdminUsers";
import { UsersTable } from "@/components/adminUsers/UsersTable";
import { UserFormModal } from "@/components/adminUsers/UserFormModal";
import { DeactivateConfirmDialog } from "@/components/adminUsers/DeactivateConfirmDialog";
import { ButtonComponent } from "@/components/common/Button";
import { AdminUser, CreateAdminUserPayload } from "@/types/adminUsers";

interface AdminUsersMainProps {
  initialUsers: AdminUser[];
  filters: {
    regionais?: { id: number; regional: string }[];
    parceiras?: { id: number; turma: string }[];
  };
}

export function AdminUsersMain({ initialUsers, filters }: AdminUsersMainProps) {
  const { showSuccess, showError } = useFeedback();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<AdminUser | null>(
    null,
  );

  const { users, isLoading, isMutating, error, createUser, deactivateUser } =
    useAdminUsers(initialUsers);
  //            ↑ passa os dados iniciais do servidor

  async function handleCreateUser(payload: CreateAdminUserPayload) {
    const result = await createUser(payload);

    if (result.success) {
      setIsFormOpen(false);
      showSuccess("Usuário cadastrado com sucesso");
    } else {
      showError(result.error);
    }
  }

  async function handleDeactivateUser(target: AdminUser) {
    const result = await deactivateUser(target.id);
    setUserToDeactivate(null);

    if (result.success) {
      showSuccess("Usuário desativado com sucesso");
    } else {
      showError(result.error);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end">
        <ButtonComponent
          text="Novo usuário"
          onClick={() => setIsFormOpen(true)}
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <UsersTable
        users={users}
        isLoading={isLoading}
        isMutating={isMutating}
        onDeactivate={setUserToDeactivate}
      />

      <UserFormModal
        open={isFormOpen}
        isMutating={isMutating}
        filters={filters}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateUser}
      />

      <DeactivateConfirmDialog
        user={userToDeactivate}
        isMutating={isMutating}
        onCancel={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateUser}
      />
    </>
  );
}
