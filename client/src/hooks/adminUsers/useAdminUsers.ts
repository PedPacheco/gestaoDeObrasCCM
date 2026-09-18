"use client";

import { useCallback, useState } from "react";
import {
  createUserAction,
  getUsers,
  toggleUserActiveAction,
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

      if (result.success && result.data) {
        const createdUser = result.data;
        setUsers((prev) => [...prev, createdUser]);
      }

      return result;
    });
  }

  async function updateUser(
    id: number,
    payload: UserPayload,
  ): Promise<ActionResult<AdminUser>> {
    return runMutation(async () => {
      const result = await updateUserAction(id, payload);

      if (result.success) {
        await refreshUsers();
      }

      return result;
    });
  }

  async function setUserStatus(id: number): Promise<ActionResult<AdminUser>> {
    return runMutation(async () => {
      const result = await toggleUserActiveAction(id);

      if (result.success && result.data) {
        const updatedUser = result.data;
        setUsers((prev) =>
          prev.map((existing) =>
            existing.id === updatedUser.id ? updatedUser : existing,
          ),
        );
      }

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
  };
}
