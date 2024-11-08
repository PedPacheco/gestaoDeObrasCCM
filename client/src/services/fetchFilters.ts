import { cookies } from "next/headers";

export async function fetchFilters(params: { [key: string]: boolean } = {}) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Token não foi encontrada");
  }

  const queryString = new URLSearchParams(params as any).toString();

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/filters?${queryString}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        next: { revalidate: 1440 },
      }
    );

    if (!res.ok) {
      throw new Error("Erro ao buscar os valores dos filtros");
    }

    return res.json();
  } catch (error: any) {
    throw new Error(
      "Não foi possível se conectar ao servidor. Tente novamente mais tarde."
    );
  }
}
