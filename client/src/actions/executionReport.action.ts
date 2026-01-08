"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function editExecutionReport(
  data: any,
  id: number,
  files?: File[]
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    let body: BodyInit;
    let headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    if (files && files.length > 0) {
      const formData = new FormData();

      formData.append("executionReportData", JSON.stringify(data));

      files?.forEach((file) => {
        formData.append("files", file);
      });

      body = formData;
    } else {
      headers["Content-Type"] = "application/json";

      const formattedData = { executionReportData: data };
      body = JSON.stringify(formattedData);
    }

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-execucao/${id}`,
      {
        method: "PATCH",
        headers,
        body,
      }
    );

    const res = await result.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao editar relatóro",
      };
    }

    revalidatePath(`/detalhes/${data.idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteExecutionReport(id: number, idWork: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/relatorio-execucao/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const res = await result.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao deletar relatório",
      };
    }

    revalidatePath(`/detalhes/${idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
