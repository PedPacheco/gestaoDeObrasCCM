"use client";

import { useCallback, useState } from "react";
import {
  createAdminUser,
  deactivateAdminUser,
  getAdminUsers,
} from "@/actions/adminUsers";
import { AdminUser, CreateAdminUserPayload } from "@/types/adminUsers";

export function useAdminUsers(initialUsers: AdminUser[] = []) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false); // dados já vieram do servidor
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Usado apenas para revalidar após mutações
  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getAdminUsers();

    if (!result.success) {
      setError(result.error);
    } else {
      setUsers(result.data ?? []);
    }

    setIsLoading(false);
  }, []);

  async function createUser(payload: CreateAdminUserPayload) {
    setIsMutating(true);

    const result = await createAdminUser(payload);

    if (result.success) {
      await refreshUsers();
    }

    setIsMutating(false);
    return result;
  }

  async function deactivateUser(id: number) {
    setIsMutating(true);

    const result = await deactivateAdminUser(id);

    if (result.success) {
      await refreshUsers();
    }

    setIsMutating(false);
    return result;
  }

  return {
    users,
    isLoading,
    isMutating,
    error,
    createUser,
    deactivateUser,
  };
}
