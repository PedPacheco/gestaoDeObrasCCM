// actions/d5Notes.ts
"use server";

import { UpdateD5NotePayload } from "@/contexts/d5NoteEditContext";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function upsertD5ScheduleAction(
  scheduleId: number | undefined,
  d5NoteId: number,
  payload: Record<string, unknown> | FormData,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      success: false,
      message: "Sessão expirada. Faça login novamente.",
    };
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    return {
      success: false,
      message: "Não foi possível identificar o utilizador.",
    };
  }

  const isInsert = !scheduleId;
  const base = `${process.env.NEXT_PUBLIC_API_URL}/notas-d5/programacoes`;
  const url = isInsert ? base : `${base}/${scheduleId}`;

  // criação → JSON | edição → multipart
  const isJson = !(payload instanceof FormData);

  let body: BodyInit;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

  if (isJson) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify({
      ...payload,
      d5NoteId,
      creatorUserId: userId,
      modifyingUserId: userId,
    });
  } else {
    body = payload;
  }

  try {
    const response = await fetch(url, {
      method: isInsert ? "POST" : "PUT",
      headers,
      body,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: Array.isArray(data.message)
          ? data.message.join(" | ") // o Nest devolve array de erros de validação
          : (data.message ?? "Erro ao salvar programação"),
      };
    }

    revalidatePath(`/notas-d5/${d5NoteId}`);
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

    if (res.statusCode !== 204) {
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

export async function updateD5NoteAction(
  id: number,
  data: UpdateD5NotePayload,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      success: false,
      message: "Sessão expirada. Faça login novamente.",
    };
  }

  const url = `${process.env.NEXT_PUBLIC_API_URL}/notas-d5/${id}`;

  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: result.message
          ? result.message
          : (result.message ?? "Erro ao salvar Nota D5"),
      };
    }

    revalidatePath(`/notas-d5/${id}`);
    return { success: true };
  } catch {
    return {
      success: false,
      message: "Não foi possível comunicar com o servidor.",
    };
  }
}

function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    return Number(payload.sub ?? payload.userId ?? payload.id) || null;
  } catch {
    return null;
  }
}
