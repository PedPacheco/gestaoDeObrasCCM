"use client";

import { useCallback, useState } from "react";
import {
  archiveAdminUser,
  createAdminUser,
  deactivateAdminUser,
  getAdminUsers,
  reactivateAdminUser,
  updateAdminUserPermission,
} from "@/actions/adminUsers";
import { ActionResult } from "@/actions/serverApi";
import { AdminUser, CreateAdminUserPayload } from "@/types/adminUsers";

export function useAdminUsers(initialUsers: AdminUser[] = []) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false); // dados já vieram do servidor
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  async function runMutation<T>(mutation: () => Promise<T>): Promise<T> {
    setIsMutating(true);

    try {
      return await mutation();
    } finally {
      setIsMutating(false);
    }
  }

  function replaceUser(updated: AdminUser) {
    setUsers((prev) =>
      prev.map((user) => (user.id === updated.id ? updated : user)),
    );
  }

  function removeUser(id: number) {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  }

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
    return runMutation(async () => {
      const result = await createAdminUser(payload);

      if (result.success) {
        await refreshUsers();
      }

      return result;
    });
  }

  async function deactivateUser(id: number) {
    return runMutation(async () => {
      const result = await deactivateAdminUser(id);

      if (result.success && result.data) {
        replaceUser(result.data);
      }

      return result;
    });
  }

  async function reactivateUser(id: number) {
    return runMutation(async () => {
      const result = await reactivateAdminUser(id);

      if (result.success && result.data) {
        replaceUser(result.data);
      }

      return result;
    });
  }

  async function updatePermission(id: number, permissaoEdicao: boolean) {
    return runMutation(async () => {
      const result = await updateAdminUserPermission(id, permissaoEdicao);

      if (result.success && result.data) {
        replaceUser(result.data);
      }

      return result;
    });
  }

  async function archiveUser(id: number): Promise<ActionResult<AdminUser>> {
    return runMutation(async () => {
      const result = await archiveAdminUser(id);

      if (result.success) {
        removeUser(id);
      }

      return result;
    });
  }

  return {
    users,
    isLoading,
    isMutating,
    error,
    createUser,
    deactivateUser,
    reactivateUser,
    updatePermission,
    archiveUser,
  };
}
