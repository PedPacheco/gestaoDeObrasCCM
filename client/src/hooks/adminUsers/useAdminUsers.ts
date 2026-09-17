"use client";

import { useCallback, useState } from "react";
import {
  createUserAction,
  deactivateUserAction,
  getUsers,
  reactivateUserAction,
  removeUserAction,
  updateUserAction,
} from "@/actions/adminUsers";
import { ActionResult } from "@/actions/serverApi";
import { AdminUser, UserPayload } from "@/types/adminUsers";

export function useAdminUsers(initialUsers: AdminUser[] = []) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(false);
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

  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result = await getUsers();

    if (!result.success) {
      setError(result.error);
    } else {
      setUsers(result.data ?? []);
    }

    setIsLoading(false);
  }, []);

  async function createUser(
    payload: UserPayload,
  ): Promise<ActionResult<AdminUser>> {
    return runMutation(async () => {
      const result = await createUserAction(payload);
      return result;
    });
  }

  async function updateUser(
    id: number,
    payload: UserPayload,
  ): Promise<ActionResult<AdminUser>> {
    return runMutation(async () => {
      const result = await updateUserAction(id, payload);
      return result;
    });
  }

  // deactivate/reactivate colapsados numa única função parametrizada
  async function setUserStatus(
    id: number,
    active: boolean,
  ): Promise<ActionResult<AdminUser>> {
    return runMutation(async () => {
      const result = active
        ? await deactivateUserAction(id)
        : await reactivateUserAction(id);
      return result;
    });
  }

  async function removeUser(id: number): Promise<ActionResult<AdminUser>> {
    return runMutation(async () => {
      const result = await removeUserAction(id);

      setIsMutating(false);
      return result;
    });
  }

  return {
    users,
    isLoading,
    isMutating,
    error,
    refreshUsers,
    createUser,
    updateUser,
    setUserStatus,
    removeUser,
  };
}
