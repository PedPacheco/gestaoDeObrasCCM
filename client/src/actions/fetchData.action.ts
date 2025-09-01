"use server";

import { mountUrl } from "@/utils/mountUrl";

export async function fetchData<T>(
  baseUrl: string,
  params?: Record<string, string | boolean>,
  token?: string,
  cacheStrategy: { revalidate?: number; cache?: "force-cache" | "no-store" } = {
    revalidate: 1440,
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

    if (!res.ok) {
      const errorMessage = json?.message || "Erro ao buscar os dados";
      throw new Error(errorMessage);
    }

    return { token, data: json.data ?? json };
  } catch (error: any) {
    throw new Error(error.message);
  }
}
