"use client";

import { useState } from "react";

import { useFeedback } from "@/hooks/useFeedback";
import { useAdminUsers } from "@/hooks/adminUsers/useAdminUsers";
import { UsersTable } from "@/components/adminUsers/UsersTable";
import { UserFormModal } from "@/components/adminUsers/UserFormModal";
import { UserFilters } from "@/components/adminUsers/UserFilters";
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

  const [nome, setNome] = useState("");
  const [selectedRegionais, setSelectedRegionais] = useState<string[]>([]);
  const [selectedParceiras, setSelectedParceiras] = useState<string[]>([]);

  const [appliedFilters, setAppliedFilters] = useState({
    nome: "",
    regionais: [] as string[],
    parceiras: [] as string[],
  });

  const {
    users,
    isLoading,
    isMutating,
    error,
    createUser,
    deactivateUser,
    reactivateUser,
    togglePermission,
  } = useAdminUsers(initialUsers);

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

  async function handleTogglePermission(target: AdminUser) {
    const result = await togglePermission(target.id);

    if (result.success) {
      showSuccess("Permissão do usuário atualizada com sucesso");
    } else {
      showError(result.error);
    }
  }

  function handleApplyFilters() {
    setAppliedFilters({
      nome,
      regionais: selectedRegionais,
      parceiras: selectedParceiras,
    });
  }

  function handleClearFilters() {
    setNome("");
    setSelectedRegionais([]);
    setSelectedParceiras([]);
    setAppliedFilters({ nome: "", regionais: [], parceiras: [] });
  }

  const filteredUsers = users.filter((user) => {
    const matchesNome = appliedFilters.nome
      ? user.nome.toLowerCase().includes(appliedFilters.nome.toLowerCase()) ||
        user.username.toLowerCase().includes(appliedFilters.nome.toLowerCase())
      : true;

    const matchesRegional = appliedFilters.regionais.length
      ? appliedFilters.regionais.includes(user.regional)
      : true;

    const matchesParceira = appliedFilters.parceiras.length
      ? appliedFilters.parceiras.includes(user.parceira)
      : true;

    return matchesNome && matchesRegional && matchesParceira;
  });

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-end">
        <ButtonComponent
          text="Novo usuário"
          onClick={() => setIsFormOpen(true)}
        />
      </div>

      <UserFilters
        nome={nome}
        setNome={setNome}
        selectedRegionais={selectedRegionais}
        setSelectedRegionais={setSelectedRegionais}
        selectedParceiras={selectedParceiras}
        setSelectedParceiras={setSelectedParceiras}
        filters={filters}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {error && <p className="text-red-600">{error}</p>}

      <UsersTable
        users={filteredUsers}
        isLoading={isLoading}
        isMutating={isMutating}
        onDeactivate={setUserToDeactivate}
        onReactivate={handleReactivateUser}
        onTogglePermission={handleTogglePermission}
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
    </div>
  );
}
