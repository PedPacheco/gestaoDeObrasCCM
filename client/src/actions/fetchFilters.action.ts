"use server";

import { cookies } from "next/headers";

export async function fetchFilters(
  params: { [key: string]: boolean | string[] } = {}
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Token não foi encontrada");
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/filters?${queryString}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      // next: { revalidate: 3600 },
    }
  );

  if (!res.ok) {
    throw new Error("Erro ao buscar os valores dos filtros");
  }

  return res.json();
}
