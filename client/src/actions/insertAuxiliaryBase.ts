"use server";

import { cookies } from "next/headers";

interface NotesInterface {
  notesData: unknown[];
  materialData: unknown[];
}

interface InsertResult {
  success: boolean;
  message: string;
  insertedCount?: number;
  skippedNotes?: string[];
}

function buildEndpoint(storageKey: string): string {
  return storageKey === "marketEntryData" || storageKey === "marketUpdatesData"
    ? "mercado"
    : "notas";
}

export async function InsertAuxiliaryBaseMarket(
  data: unknown[] | NotesInterface,
  storageKey: string,
  operation: string
): Promise<InsertResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, message: "Token de autenticação não encontrado" };
  }

  const endpoint = buildEndpoint(storageKey);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: data,
          operation: operation ?? undefined,
        }),
      }
    );

    const result = await response.json();

    if (result.statusCode !== 201) {
      return {
        success: false,
        message: result.message || "Erro ao inserir obras",
      };
    }

    return {
      success: true,
      message: result.message,
      insertedCount: result.res?.insertedCount ?? 0,
      skippedNotes: result.res?.skippedNotes ?? [],
    };
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Erro desconhecido";
    return { success: false, message: errorMessage };
  }
}

export async function InsertCapex(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/capex`,
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

    if (res.statusCode !== 200) {
      return {
        success: false,
        error: res.message || "Erro ao atualizar capex",
      };
    }

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
