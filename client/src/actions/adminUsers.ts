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

export async function updateAdminUserPermission(
  id: number,
  permissaoEdicao: boolean,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/user/${id}/permission`, {
    method: "PATCH",
    body: JSON.stringify({ permissao_edicao: permissaoEdicao }),
  });
}

export async function archiveAdminUser(
  id: number,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/user/${id}/archive`, {
    method: "PATCH",
  });
}
