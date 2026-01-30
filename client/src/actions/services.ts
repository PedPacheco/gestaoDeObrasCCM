"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function storeScheduleDataAction(
  data: any,
  idWork: string,
  idStatusWork: any,
) {
  const cookieStore = await cookies();

  cookieStore.set("form-data", JSON.stringify(data), {
    path: "/",
    maxAge: 1800, // 1 minuto
  });

  cookieStore.set("idStatusWork", JSON.stringify(idStatusWork), {
    path: "/",
    maxAge: 1800, // 1 minuto
  });

  redirect(`/servicos/${idWork}`);
}

export async function scheduleServices(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/servicos`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const res = await result.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao programar serviços",
      };
    }

    return { success: true, message: res.message };
  } catch (error: any) {
    console.error("Erro ao programar serviços:", error);
    return { success: false, message: error.message };
  }
}

export async function CancelScheduleServices(id: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/servicos/cancelar/${id}`,
      {
        method: "PATCH",
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
        error: res.message || "Erro ao cancelar serviços programados",
      };
    }

    return { success: true, message: res.message };
  } catch (error: any) {
    console.error("Erro ao cancelar serviços programados:", error);
    return { success: false, message: error.message };
  }
}
