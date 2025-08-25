"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function InsertWorks(data: any[], storageKey: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/obras/${
        storageKey === "marketEntryData" ? "inserir-ov" : "inserir-notas"
      }`,
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

    if (res.statusCode !== 201) {
      return {
        success: false,
        error: res.message || "Erro ao inserir obras",
      };
    }

    await fetch(
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

    return { success: true, message: res.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateWork(data: any, id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/obras/${id}`,
      {
        method: "PATCH",
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
        error: res.message || "Erro ao editar obra",
      };
    }

    revalidatePath(`/detalhes/${data.idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function DeleteWork(storageKey: string) {
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
