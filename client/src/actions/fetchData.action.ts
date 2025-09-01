"use server";

import { mountUrl } from "@/utils/mountUrl";
import { C } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";

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

  console.log(url);

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
    console.log(error.message);
    throw new Error(error.message);
  }
}
