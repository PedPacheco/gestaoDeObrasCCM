// app/api/works/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const data = await request.json();

    // Obter token dos cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token de autenticação não encontrado" },
        { status: 401 }
      );
    }

    console.log(data);

    // Fazer requisição para sua API externa
    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/obras/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    const res = await result.json();

    if (res.statusCode !== 204) {
      return NextResponse.json(
        {
          success: false,
          error: res.message || "Erro ao editar obra",
        },
        { status: res.statusCode || 500 }
      );
    }

    // Revalidar cache
    revalidatePath(`/detalhes/${id}`);

    return NextResponse.json({
      success: true,
      message: res.message || "Obra editada com sucesso",
    });
  } catch (error: any) {
    console.error("Erro ao editar obra:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
