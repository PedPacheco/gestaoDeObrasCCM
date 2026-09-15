"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useUser } from "@/contexts/userContext";
import { useFeedback } from "@/hooks/useFeedback";
import { useAdminUsers } from "@/hooks/adminUsers/useAdminUsers";
import { UsersTable } from "@/components/adminUsers/UsersTable";
import { UserFormModal } from "@/components/adminUsers/UserFormModal";
import { DeactivateConfirmDialog } from "@/components/adminUsers/DeactivateConfirmDialog";
import { ButtonComponent } from "@/components/common/Button";
import { ADMIN_PANEL_USERNAMES } from "@/utils/links";
import { AdminUser, CreateAdminUserPayload } from "@/types/adminUsers";

export default function AdministrarLoginPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useFeedback();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [userToDeactivate, setUserToDeactivate] = useState<AdminUser | null>(
    null,
  );

  const { users, isLoading, isMutating, error, createUser, deactivateUser } =
    useAdminUsers();

  const hasAccess = !!user && ADMIN_PANEL_USERNAMES.includes(user.username);

  useEffect(() => {
    if (!isUserLoading && !hasAccess) {
      router.replace("/");
    }
  }, [isUserLoading, hasAccess, router]);

  if (isUserLoading || !hasAccess) {
    return null;
  }

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
    <div className="flex flex-col w-4/5 py-6 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administrar login</h1>
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
        currentUsername={user?.username}
        onDeactivate={setUserToDeactivate}
      />

      <UserFormModal
        open={isFormOpen}
        isMutating={isMutating}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleCreateUser}
      />

      <DeactivateConfirmDialog
        user={userToDeactivate}
        isMutating={isMutating}
        onCancel={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateUser}
      />
    </div>
  );
}
