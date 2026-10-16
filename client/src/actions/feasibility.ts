"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

interface RejectFeasibilityData {
  reason: string;
  description: string;
  feasibilityReportId: number;
  userId: number;
  workId: number;
}

interface RejectFeasibilityProps {
  idWork: string;
  data: RejectFeasibilityData;
}

export async function rejectFeasibility({
  idWork,
  data,
}: RejectFeasibilityProps) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/viabilidade/reprovar`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );

    if (!response.ok) {
      throw new Error("Erro ao reprovar viabilidade");
    }

    const res = await response.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao excluir viabilidade",
      };
    }

    revalidatePath(`/detalhes/${idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function approveFeasibility(workId: string) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/viabilidade/aprovar/${workId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error("Erro ao aprovar viabilidade");
    }

    const res = await response.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao aprovar viabilidade",
      };
    }

    revalidatePath(`/detalhes/${workId}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
