"use server";

import { cookies } from "next/headers";

interface notesInterface {
  notesData: any[];
  materialData: any[];
}

interface InsertResult {
  success: boolean;
  message: string;
  insertedCount?: number;
  skippedNotes?: string[];
}

export async function InsertAuxiliaryBaseMarket(
  data: any[] | notesInterface,
  storageKey: string
): Promise<InsertResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/${
        storageKey === "marketEntryData" ? "mercado" : "notas"
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
        message: res.message || "Erro ao inserir obras",
      };
    }

    return {
      success: true,
      message: res.message,
      insertedCount: res.res?.insertedCount || 0,
      skippedNotes: res.res?.skippedNotes || [],
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
