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

function buildRequestData(
  data: unknown[] | NotesInterface,
  storageKey: string
) {
  return storageKey === "marketEntryData" ? { data } : data;
}

function buildEndpoint(storageKey: string): string {
  return storageKey === "marketEntryData" ? "mercado" : "notas";
}

export async function InsertAuxiliaryBaseMarket(
  data: unknown[] | NotesInterface,
  storageKey: string
): Promise<InsertResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return { success: false, message: "Token de autenticação não encontrado" };
  }

  const requestData = buildRequestData(data, storageKey);
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
        body: JSON.stringify(requestData),
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
