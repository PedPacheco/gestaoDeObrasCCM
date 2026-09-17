"use server";

import { ActionResult, serverApiRequest } from "./serverApi";
import { AdminUser, UserPayload } from "@/types/adminUsers";

export async function getUsers(): Promise<ActionResult<AdminUser[]>> {
  return serverApiRequest("/user");
}

export async function createUserAction(
  payload: UserPayload,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest("/user", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deactivateUserAction(
  id: number,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/user/${id}`, {
    method: "DELETE",
  });
}

export async function reactivateUserAction(
  id: number,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/user/${id}/reactivate`, {
    method: "PATCH",
  });
}

export async function updateUserAction(
  id: number,
  payload: UserPayload,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/usuario/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function removeUserAction(
  id: number,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/usuario/${id}`, {
    method: "DELETE",
  });
}
