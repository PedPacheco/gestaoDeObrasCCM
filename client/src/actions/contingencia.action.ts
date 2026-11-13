"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export interface ContingenciaPayload {
  availabilityDate: string;
  partnerId: number;
  laborType: string;
  laborQuantity: number;
  teamType: string;
  teamQuantity: number;
  allocatedCsd: string;
  userId?: number;
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
