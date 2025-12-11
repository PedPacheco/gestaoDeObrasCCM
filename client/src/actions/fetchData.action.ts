"use server";

import { mountUrl } from "@/utils/mountUrl";

export async function fetchData<T>(
  baseUrl: string,
  params?: Record<string, string | boolean | string | null>,
  token?: string,
  cacheStrategy: { revalidate?: number; cache?: "force-cache" | "no-store" } = {
    revalidate: 1800,
  }
) {
  if (!token) {
    throw new Error("Token não foi encontrada");
  }

  const url = mountUrl(baseUrl, params);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      next: cacheStrategy,
    });

    const json = await res.json();

    if (res.status === 500 && !res.ok) {
      return { success: false, message: "Erro ao buscar os dados", token };
    }

    if (res.status === 401 || res.status === 404) {
      return { success: false, message: json.message, token };
    }

    return { success: true, data: json.data ?? json, token };
  } catch (error: any) {
    return { success: false, message: error.message, token };
  }
}
