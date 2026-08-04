"use server";

import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchGapAnalysisAudits() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(`${API_URL}/gap-analysis`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const res = await result.json();

    if (!result.ok) {
      return {
        success: false,
        error: res.message || "Erro ao buscar auditorias",
      };
    }

    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createGapAnalysisAudit(data: { id_parceira: number }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(`${API_URL}/gap-analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const res = await result.json();

    if (!result.ok) {
      return {
        success: false,
        error: res.message || "Erro ao criar auditoria",
      };
    }

    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateGapAnalysisAudit(
  id: number,
  data: Record<string, string>,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(`${API_URL}/gap-analysis/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const res = await result.json();

    if (!result.ok) {
      return {
        success: false,
        error: res.message || "Erro ao atualizar auditoria",
      };
    }

    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteGapAnalysisAudit(id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(`${API_URL}/gap-analysis/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const res = await result.json();

    if (!result.ok) {
      return {
        success: false,
        error: res.message || "Erro ao excluir auditoria",
      };
    }

    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
