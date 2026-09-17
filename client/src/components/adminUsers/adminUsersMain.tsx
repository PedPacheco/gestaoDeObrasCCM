"use client";

import { useState } from "react";

import { useFeedback } from "@/hooks/useFeedback";
import { useUser } from "@/contexts/userContext";
import { useAdminUsers } from "@/hooks/adminUsers/useAdminUsers";
import { useAdminUsersFilters } from "@/hooks/adminUsers/useAdminUsersFilters";
import { UsersTable } from "@/components/adminUsers/usersTable";
import { UserFormModal } from "@/components/adminUsers/userFormModal";
import { AdminUsersFilters } from "@/components/adminUsers/adminUsersFilters";
import { ConfirmActionDialog } from "@/components/adminUsers/confirmActionDialog";
import { ButtonComponent } from "@/components/common/Button";
import { AdminUser, CreateAdminUserPayload } from "@/types/adminUsers";
import { FiltersInterface } from "@/types/filtersInterfaces";

interface AdminUsersMainProps {
  initialUsers: AdminUser[];
  filters: FiltersInterface;
}

export function AdminUsersMain({ initialUsers, filters }: AdminUsersMainProps) {
  const { showSuccess, showError } = useFeedback();
  const { user: currentUser } = useUser();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<AdminUser | null>(
    null,
  );
  const [userToArchive, setUserToArchive] = useState<AdminUser | null>(null);

  const {
    users,
    isLoading,
    isMutating,
    error,
    createUser,
    deactivateUser,
    reactivateUser,
    updatePermission,
    archiveUser,
  } = useAdminUsers(initialUsers);

  const filterState = useAdminUsersFilters(users);

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

  async function handleReactivateUser(target: AdminUser) {
    const result = await reactivateUser(target.id);

    if (result.success) {
      showSuccess("Usuário reativado com sucesso");
    } else {
      showError(result.error);
    }
  }

  async function handleTogglePermission(
    target: AdminUser,
    permissaoEdicao: boolean,
  ) {
    const result = await updatePermission(target.id, permissaoEdicao);

    if (result.success) {
      showSuccess("Permissão do usuário atualizada com sucesso");
    } else {
      showError(result.error);
    }
  }

  async function handleArchiveUser(target: AdminUser) {
    const result = await archiveUser(target.id);
    setUserToArchive(null);

    if (result.success) {
      showSuccess("Usuário excluído com sucesso");
    } else {
      showError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-end">
        <ButtonComponent
          text="Novo usuário"
          onClick={() => setIsFormOpen(true)}
        />
      </div>

      <AdminUsersFilters filters={filters} filterState={filterState} />

      {error && <p className="text-red-600">{error}</p>}

      <UsersTable
        users={filterState.filteredUsers}
        isLoading={isLoading}
        isMutating={isMutating}
        currentUserId={currentUser?.id}
        onDeactivate={setUserToDeactivate}
        onReactivate={handleReactivateUser}
        onArchive={setUserToArchive}
        onTogglePermission={handleTogglePermission}
      />

      <UserFormModal
        open={isFormOpen}
        isMutating={isMutating}
        filters={filters}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateUser}
      />

      <ConfirmActionDialog
        user={userToDeactivate}
        title="Desativar usuário"
        message={
          <p>
            Tem certeza que deseja desativar o usuário{" "}
            <strong>{userToDeactivate?.username}</strong>?
          </p>
        }
        confirmText="Desativar"
        isMutating={isMutating}
        onCancel={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateUser}
      />

      <ConfirmActionDialog
        user={userToArchive}
        title="Excluir usuário"
        message={
          <p>
            Tem certeza que deseja excluir o usuário{" "}
            <strong>{userToArchive?.username}</strong>? Use esta ação apenas
            para usuários que saíram da empresa — depois de excluída, a conta
            não poderá mais fazer login.
          </p>
        }
        confirmText="Excluir"
        isMutating={isMutating}
        onCancel={() => setUserToArchive(null)}
        onConfirm={handleArchiveUser}
      />
    </div>
  );
}
