"use server";

import { cookies } from "next/headers";

export async function DeleteData(storageKey: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/${
        storageKey === "marketEntryData" ? "mercado" : "notas"
      }`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const res = await result.json();

    if (res.statusCode !== 200) {
      return {
        success: false,
        error: res.message || "Erro ao excluir obras",
      };
    }

    return { success: true, message: res.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
