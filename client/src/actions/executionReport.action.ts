"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function editExecutionReport(data: any, id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-execucao/${id}`,
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
    console.error("Erro ao editar relatório:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteExecutionReport(id: number, idWork: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-execucao/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const res = await result.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao editar programação",
      };
    }

    revalidatePath(`/detalhes/${idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    console.error("Erro ao excluir relatório:", error);
    return { success: false, message: error.message };
  }
}
