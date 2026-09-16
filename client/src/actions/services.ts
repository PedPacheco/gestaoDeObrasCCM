"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ActionResult,
  serverApiRequest,
  serverMultipartRequest,
} from "./serverApi";

export async function storeScheduleDataAction(
  data: unknown,
  idWork: string,
  idStatusWork: unknown,
  statusSchedule: string,
  ordemDcim?: string,
) {
  const cookieStore = await cookies();

  cookieStore.set("form-data", JSON.stringify(data), {
    path: "/",
    maxAge: 60 * 30, // 30 min
  });

  cookieStore.set("idStatusWork", JSON.stringify(idStatusWork), {
    path: "/",
    maxAge: 60 * 30,
  });

  cookieStore.set("statusSchedule", statusSchedule, {
    path: "/",
    maxAge: 60 * 30,
  });

  cookieStore.set("ordemDcim", JSON.stringify(ordemDcim), {
    path: "/",
    maxAge: 60 * 30,
  });

  redirect(`/servicos/${idWork}`);
}

export async function scheduleServices(
  id: number,
  data: unknown,
): Promise<ActionResult> {
  return serverApiRequest(`/servicos/programar/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function performScheduleServices(
  data: {
    id: number;
    qtdeRealizada: number | null;
  }[],
): Promise<ActionResult> {
  return serverApiRequest("/servicos/realizar", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function finalizeServices(
  data: unknown,
  idWork: number,
  files?: File[],
) {
  const formData = new FormData();

  formData.append("data", JSON.stringify(data));

  files?.forEach((file) => {
    formData.append("files", file);
  });

  return await serverMultipartRequest(
    `/servicos/finalizar/${idWork}`,
    formData,
    {
      method: "PATCH",
    },
  );
}

export async function reascheduleServices(
  workId: number,
  scheduleId: number | null,
): Promise<ActionResult> {
  if (!scheduleId) {
    throw new Error("Id da programação não foi enviado");
  }

  return serverApiRequest(`/servicos/reprogramar/${workId}/${scheduleId}`, {
    method: "PATCH",
  });
}

export async function addService(data: {
  idWork: number;
  idService: number;
  point: string;
  operation: string;
  operationDescription: string;
}): Promise<ActionResult> {
  return serverApiRequest("/servicos/servico", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function addMaterial(data: {
  idWork: number;
  idService: number;
  point: string;
  operation: string;
  operationDescription: string;
}): Promise<ActionResult> {
  return serverApiRequest("/servicos/material", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function addFamily(data: {
  idWork: number;
  idService: number;
  point: string;
  operation: string;
  operationDescription: string;
  type: "S" | "M";
}): Promise<ActionResult> {
  return serverApiRequest("/servicos/familia", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function applyAdditonalPlanServices(
  data: {
    id: number;
    additional: number | null;
  }[],
  workId: number,
): Promise<ActionResult> {
  return serverApiRequest(`/servicos/aplicar-adicional/${workId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function cancelScheduleServices(
  id: number,
): Promise<ActionResult> {
  return serverApiRequest(`/servicos/cancelar/${id}`, {
    method: "PATCH",
  });
}

export async function deleteService(
  id: number,
  workId: number,
): Promise<ActionResult> {
  revalidatePath(`/viabilidade/${id}`);

  return serverApiRequest(`/servicos/${id}?workId=${workId}`, {
    method: "DELETE",
  });
}

export async function deleteAllServices(workId: number): Promise<ActionResult> {
  revalidatePath(`/viabilidade/${workId}`);

  return serverApiRequest(`/servicos/todos/${workId}`, {
    method: "DELETE",
  });
}

export async function importServicesSpreadsheet(
  workId: number,
  formData: FormData,
) {
  const result = await serverMultipartRequest(
    `/servicos/importar/${workId}`,
    formData,
    {
      method: "POST",
    },
  );

  if (result.success) {
    revalidatePath(`/viabilidade/${workId}`);
  }

  return result;
}
