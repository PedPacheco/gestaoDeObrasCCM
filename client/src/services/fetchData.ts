import { mountUrl } from "@/utils/mountUrl";

export async function fetchData<T>(
  baseUrl: string,
  params?: Record<string, string>,
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
    throw new Error("Erro ao buscar os dados");
  }

  return { token: token, data: await res.json() };
}
