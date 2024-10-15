import { mountUrl } from "@/utils/mountUrl";

export async function fetchData<T>(
  baseUrl: string,
  params?: Record<string, string | boolean>,
  token?: string,
  cacheStrategy: { revalidate?: number; cache?: "force-cache" | "no-store" } = {
    revalidate: 1440,
  }
): Promise<{ token: string; data: T }> {
  if (!token) {
    throw new Error("Token não foi encontrada");
  }

  const url = mountUrl(baseUrl, params);

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    next: cacheStrategy,
  });

  if (!res.ok) {
    const errorResponse = await res.json();
    const errorMessage = errorResponse?.message || "Erro ao buscar os dados";
    throw new Error(errorMessage);
  }

  return { token: token, data: await res.json() };
}
