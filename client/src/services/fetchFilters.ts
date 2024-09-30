import { cookies } from "next/headers";

export async function fetchFilters(params: { [key: string]: boolean } = {}) {
  const cookieStore = cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    throw new Error("Token não foi encontrada");
  }

  const queryString = new URLSearchParams(params as any).toString();

  const res = await fetch(`http://localhost:3333/filters?${queryString}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 1440 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
