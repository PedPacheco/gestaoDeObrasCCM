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

export async function updateUserAction(
  id: number,
  payload: UserPayload,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/user/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function toggleUserActiveAction(
  id: number,
): Promise<ActionResult<AdminUser>> {
  return serverApiRequest(`/user/${id}/ativar`, {
    method: "PATCH",
  });
}
