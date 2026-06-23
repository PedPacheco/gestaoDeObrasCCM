"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export interface ContingenciaPayload {
  dia_disponibilidade: string;
  parceira: string;
  tipo_recurso_mao_obra: string;
  quantidade_mao_obra: number;
  tipo_recurso_equipe: string;
  quantidade_equipe: number;
  disponibilizado_csd: string;
}

export interface ContingenciaFilters {
  dataInicial?: string;
  dataFinal?: string;
  parceira?: string[];
  maoObra?: string[];
  equipe?: string[];
  csd?: string[];
}

export async function getContingenciaDashboard(filters: ContingenciaFilters) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const qs = new URLSearchParams();
  if (filters.dataInicial) qs.set("dataInicial", filters.dataInicial);
  if (filters.dataFinal) qs.set("dataFinal", filters.dataFinal);
  if (filters.parceira?.length) qs.set("parceira", filters.parceira.join(","));
  if (filters.maoObra?.length) {
    qs.set("tipo_recurso_mao_obra", filters.maoObra.join(","));
  }
  if (filters.equipe?.length) {
    qs.set("tipo_recurso_equipe", filters.equipe.join(","));
  }
  if (filters.csd?.length) {
    qs.set("disponibilizado_csd", filters.csd.join(","));
  }

  const query = qs.toString();
  const url = `${process.env.NEXT_PUBLIC_API_URL}/recursos-contingencia/dashboard${
    query ? `?${query}` : ""
  }`;

  try {
    const result = await fetch(url, {
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
        message: res.message || "Erro ao buscar dashboard",
      };
    }

    return { success: true, data: res.data };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function saveContingencia(data: ContingenciaPayload) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/recursos-contingencia`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );

    const res = await result.json();

    if (res.statusCode !== 201) {
      return {
        success: false,
        message: res.message || "Erro ao registrar resposta",
      };
    }

    revalidatePath("/recursos-contingencia");

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
