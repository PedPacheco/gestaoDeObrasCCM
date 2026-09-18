"use client";

import { useState } from "react";

import { useFeedback } from "@/hooks/useFeedback";
import { useUser } from "@/contexts/userContext";
import { useAdminUsers } from "@/hooks/adminUsers/useAdminUsers";
import { useAdminUsersFilters } from "@/hooks/adminUsers/useAdminUsersFilters";
import { UsersTable } from "@/components/adminUsers/usersTable";
import { UserFormModal } from "@/components/adminUsers/userFormModal";
import { AdminUsersFilters } from "@/components/adminUsers/adminUsersFilters";
import { ButtonComponent } from "@/components/common/Button";
import { AdminUser, UserActionType, UserPayload } from "@/types/adminUsers";
import { FiltersInterface } from "@/types/filtersInterfaces";
import ConfirmationModalComponent from "../common/confirmationModal";
import { PlusIcon } from "@heroicons/react/20/solid";

type ModalMode = Exclude<UserActionType, "reactivate"> | "create" | null;

interface AdminUsersMainProps {
  initialUsers: AdminUser[];
  filters: FiltersInterface;
}

export function AdminUsersMain({ initialUsers, filters }: AdminUsersMainProps) {
  const { showSuccess, showError } = useFeedback();
  const { user: currentUser } = useUser();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const {
    users,
    isLoading,
    isMutating,
    error,
    createUser,
    updateUser,
    setUserStatus,
  } =useAdminUsers(initialUsers);

  const filterState = useAdminUsersFilters(users);

  function closeModal() {
    setUser(null);
    setModalMode(null);
  }

  function handleUserAction(target: AdminUser, action: UserActionType) {
    if (action === "reactivate") {
      handleReactivate(target);
      return;
    }

    setUser(target);
    setModalMode(action);
  }

  async function handleCreateUser(payload: UserPayload) {
    const result = await createUser(payload);

    if (result.success) {
      closeModal();
      showSuccess("Usuário cadastrado com sucesso");
    } else {
      showError(result.error);
    }
  }

  async function handleUpdateUser(id: number, payload: UserPayload) {
    const result = await updateUser(id, payload);

    if (result.success) {
      closeModal();
      showSuccess("Usuário atualizado com sucesso");
    } else {
      showError(result.error);
    }
  }

  async function handleConfirmDeactivate() {
    if (!user) return;

    const result = await setUserStatus(user.id);
    closeModal();

    if (result.success) {
      showSuccess("Usuário desativado com sucesso");
    } else {
      showError(result.error);
    }
  }

  async function handleReactivate(target: AdminUser) {
    const result = await setUserStatus(target.id);

    if (result.success) {
      showSuccess("Usuário reativado com sucesso");
    } else {
      showError(result.error);
    }
  }

  return (
    <>
      <div className="flex w-[95%] items-end justify-between gap-4 mb-4">
        <div className="w-1/2">
          <AdminUsersFilters filters={filters} filterState={filterState} />
        </div>

        <ButtonComponent
          text="Novo usuário"
          onClick={() => {
            setUser(null);
            setModalMode("create");
          }}
          startIcon={<PlusIcon width={24} height={24} />}
        />
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <p className="w-[95%] mb-2 text-sm text-zinc-600">
        Usuários sem acesso há mais de 60 dias são desativados automaticamente.
      </p>

      <div className="w-[95%]">
        <UsersTable
          users={filterState.filteredUsers}
          isLoading={isLoading}
          isMutating={isMutating}
          currentUserId={currentUser?.id}
          onAction={handleUserAction}
        />
      </div>

      <UserFormModal
        open={modalMode === "create" || modalMode === "edit"}
        isMutating={isMutating}
        filters={filters}
        user={modalMode === "edit" ? user : null}
        onClose={closeModal}
        onCreate={handleCreateUser}
        onUpdate={handleUpdateUser}
      />

      <ConfirmationModalComponent
        actionId={user?.id ?? 0}
        title="Desativar usuário"
        message={`Tem certeza que deseja desativar o usuário ${user?.username}? Ele perderá o acesso ao SIGO, mas os dados que já inseriu no sistema continuam normalmente e ele poderá ser reativado depois.`}
        onConfirm={handleConfirmDeactivate}
        onClose={closeModal}
        open={modalMode === "deactivate"}
      />

    </>
  );
}
