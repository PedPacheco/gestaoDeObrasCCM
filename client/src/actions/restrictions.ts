"use server";

import { cookies } from "next/headers";

export async function InsertPublicationRestrictions(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/restricao/publicacoes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    const res = await result.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao adicionar restrição",
      };
    }

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
