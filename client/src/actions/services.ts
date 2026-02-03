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

  redirect(`/servicos/${idWork}`);
}

export async function scheduleServices(data: unknown): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  return apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/servicos`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
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

export async function reascheduleServices(
  data: {
    id: number;
  }[],
): Promise<ActionResult> {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "Usuário não autenticado" };
  }

  return apiRequest(`${process.env.NEXT_PUBLIC_API_URL}/servicos/reprogramar`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
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
