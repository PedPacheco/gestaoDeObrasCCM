"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function saveSchedule(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data.updateData),
      },
    );

    const res = await result.json();

    if (res.statusCode !== 201) {
      return {
        success: false,
        error: res.message || "Erro ao adicionar programação",
      };
    }

    revalidatePath(`/detalhes/${data.id}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function editSchedule(data: any, id: number, files?: File[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    let body: BodyInit;
    let headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
    };

    if (files && files.length > 0) {
      const formData = new FormData();

      formData.append("updateData", JSON.stringify(data.updateData));
      formData.append(
        "executionReportData",
        JSON.stringify(data.executionReportData),
      );

      files?.forEach((file) => {
        formData.append("files", file);
      });

      body = formData;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(data);
    }

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/${id}`,
      {
        method: "PATCH",
        headers,
        body,
      },
    );

    const res = await result.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao editar programação",
      };
    }

    revalidatePath(`/detalhes/${data.idWork}`);
    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteSchedule(id: number, idWork: number) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const res = await result.json();

    if (res.statusCode !== 200) {
      return {
        success: false,
        error: res.message || "Erro ao deletar programação",
      };
    }

    revalidatePath(`/detalhes/${idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function ValidatedSchedule(
  data: { id: number; validate: boolean }[],
  idWork: string,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/validar`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );

    const res = await result.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao validar programações",
      };
    }

    revalidatePath(`/detalhes/${idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function ConfirmedSchedule(
  data: { id: number; confirm: boolean }[],
  idWork: string,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/confirmar`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );

    const res = await result.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao confirmar programações",
      };
    }

    revalidatePath(`/detalhes/${idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function RejectedSchedule(
  data: {
    id: number;
    reject: boolean;
    reason: string;
    description: string;
  },
  idWork: string,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/programacao/reprovar`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );

    const res = await result.json();

    if (res.statusCode !== 204) {
      return {
        success: false,
        error: res.message || "Erro ao reprovar programações",
      };
    }

    revalidatePath(`/detalhes/${idWork}`);

    return { success: true, message: res.message };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function saveForecastSnapshot(data: any) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  try {
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/forecast/snapshot`,
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
        error: res.message || "Erro ao salvar snapshot",
      };
    }

    return {
      success: true,
      message: res.message || "Snapshot salvo com sucesso",
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
}
