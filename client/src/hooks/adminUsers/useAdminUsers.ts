"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createAdminUser,
  deactivateAdminUser,
  getAdminUsers,
} from "@/actions/adminUsers";
import { AdminUser, CreateAdminUserPayload } from "@/types/adminUsers";

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getAdminUsers();

    if (!result.success) {
      setError(result.error);
      setUsers([]);
      setIsLoading(false);
      return;
    }

    setUsers(result.data ?? []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function createUser(payload: CreateAdminUserPayload) {
    setIsMutating(true);

    const result = await createAdminUser(payload);

    if (result.success) {
      await loadUsers();
    }

    setIsMutating(false);
    return result;
  }

  async function deactivateUser(id: number) {
    setIsMutating(true);

    const result = await deactivateAdminUser(id);

    if (result.success) {
      await loadUsers();
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
