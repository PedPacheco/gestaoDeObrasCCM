"use server";

import { ActionResult, serverApiRequest } from "./serverApi";
import { AdminUser, CreateAdminUserPayload } from "@/types/adminUsers";

export async function getAdminUsers(): Promise<ActionResult<AdminUser[]>> {
  return serverApiRequest("/user");
}

export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest("/user", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deactivateAdminUser(
  id: number,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/user/${id}`, {
    method: "DELETE",
  });
}

export async function reactivateAdminUser(
  id: number,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/user/${id}/reactivate`, {
    method: "PATCH",
  });
}

export async function toggleAdminUserPermission(
  id: number,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/user/${id}/permission`, {
    method: "PATCH",
  });
}
