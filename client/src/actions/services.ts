"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type ActionResult =
  | { success: true; message?: string }
  | { success: false; error: string };

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}

async function apiRequest<T = any>(
  url: string,
  options: RequestInit,
): Promise<ActionResult> {
  try {
    const res = await fetch(url, options);

    // 204 → sem conteúdo
    if (res.status === 204) {
      return { success: true };
    }

    const body = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: body?.message || "Erro inesperado na requisição",
      };
    }

    return { success: true, message: body?.message };
  } catch (error: any) {
    console.error("API error:", error);
    return {
      success: false,
      error: error.message || "Erro de comunicação com o servidor",
    };
  }
}

export async function storeScheduleDataAction(
  data: unknown,
  idWork: string,
  idStatusWork: unknown,
  statusSchedule: string,
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

  redirect(`/servicos/${idWork}`);
}

export async function scheduleServices(
  id: number,
  data: unknown,
): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  return apiRequest(
    `${process.env.NEXT_PUBLIC_API_URL}/servicos/programar/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );
}

export async function performScheduleServices(
  data: {
    id: number;
    qtdeRealizada: number | null;
  }[],
): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  return apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/servicos/realizar`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function finalizeServices(
  data: any,
  idWork: number,
  files?: File[],
) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  try {
    let body: BodyInit;
    let headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    if (files && files.length > 0) {
      const formData = new FormData();

      formData.append("data", JSON.stringify(data));

      files?.forEach((file) => {
        formData.append("files", file);
      });

      body = formData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }

    return apiRequest(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/finalizar/${idWork}`,
      {
        method: "PATCH",
        headers,
        body,
      },
    );
  } catch (error: any) {
    console.error("API error:", error);
    return {
      success: false,
      error: error.message || "Erro ao converter arquivos",
    };
  }
}

export async function reascheduleServices(
  workId: number,
  scheduleId: number | null,
): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  if (!scheduleId) {
    throw new Error("Id da programação não foi enviado");
  }

  return apiRequest(
    `${process.env.NEXT_PUBLIC_API_URL}/servicos/reprogramar/${workId}/${scheduleId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export async function addService(data: {
  idWork: number;
  idService: number;
  point: string;
  operation: string;
  operationNumber: string;
  operationDescription: string;
}): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  return apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/servicos/servico`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function addMaterial(data: {
  idWork: number;
  idService: number;
  point: string;
  operation: string;
  operationNumber: string;
  operationDescription: string;
}): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  return apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/servicos/material`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
}

export async function applyAdditonalPlanServices(
  data: {
    id: number;
    additional: number | null;
  }[],
): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  return apiRequest(
    `${process.env.NEXT_PUBLIC_API_URL}/servicos/aplicar-adicional`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    },
  );
}

export async function cancelScheduleServices(
  id: number,
): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  return apiRequest(
    `${process.env.NEXT_PUBLIC_API_URL}/servicos/cancelar/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
