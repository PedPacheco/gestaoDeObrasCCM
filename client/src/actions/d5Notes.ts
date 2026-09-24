// actions/d5Notes.ts
"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function upsertD5ScheduleAction(
  scheduleId: number | undefined,
  formData: FormData,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      success: false,
      message: "Sessão expirada. Faça login novamente.",
    };
  }

  const isInsert = !scheduleId;

  const url = isInsert
    ? `${process.env.NEXT_PUBLIC_API_URL}/notas-d5/programacoes`
    : `${process.env.NEXT_PUBLIC_API_URL}/notas-d5/programacoes/${scheduleId}`;

  console.log(formData, url, isInsert);

  try {
    const response = await fetch(url, {
      method: isInsert ? "POST" : "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message ?? "Erro ao salvar programação",
      };
    }

    revalidatePath(`/notas-d5/${formData.get("d5NoteId")}`);

    return { success: true };
  } catch {
    return {
      success: false,
      message: "Não foi possível comunicar com o servidor.",
    };
  }
}

export async function deleteD5NoteSchedule(id: number, d5NoteId: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/notas-d5/programacoes/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const res = await result.json();

    if (res.statusCode !== 200) {
      return {
        success: false,
        error: res.message || "Erro ao deletar programação",
      };
    }

    revalidatePath(`/notas-d5/${d5NoteId}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
