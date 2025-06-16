"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function saveSchedule(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao`,
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
        error: res.message || "Erro ao adicionar programação",
      };
    }

    revalidatePath(`/detalhes/${data.id}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    console.error("Erro ao salvar programação:", error);
    return { success: false, message: error.message };
  }
}

export async function editSchedule(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao`,
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
        error: res.message || "Erro ao editar programação",
      };
    }

    revalidatePath(`/detalhes/${data.idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    console.error("Erro ao salvar programação:", error);
    return { success: false, message: error.message };
  }
}
