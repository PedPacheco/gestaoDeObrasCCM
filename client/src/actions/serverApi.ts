// lib/server-api.ts

import { cookies } from "next/headers";

export type ActionResult<T = unknown> =
  | {
      success: true;
      data?: T;
      message?: string;
    }
  | {
      success: false;
      error: string;
    };

async function apiRequest<T>(
  url: string,
  options: RequestInit,
): Promise<ActionResult<T>> {
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

    return { success: true, message: body?.message, data: body?.data };
  } catch (error: any) {
    console.error("API error:", error);
    return {
      success: false,
      error: error.message || "Erro de comunicação com o servidor",
    };
  }
}

export async function serverApiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ActionResult<T>> {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return {
      success: false,
      error: "Usuário não autenticado",
    };
  }

  return apiRequest(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}

export async function serverMultipartRequest(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestInit, "body"> = {},
) {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return {
      success: false,
      error: "Usuário não autenticado",
    };
  }

  return apiRequest(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
}
