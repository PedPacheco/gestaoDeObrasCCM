// app/api/viabilidade/upload/route.ts
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    // Encaminha para o backend NestJS
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/viabilidade/upload`,
      {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      const errorData = JSON.parse(text);
      return NextResponse.json(
        { message: errorData.message || "Erro ao fazer upload" },
        { status: response.status },
      );
    }

    return NextResponse.json(
      { message: "Upload realizado com sucesso" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { message: "Erro interno ao processar upload" },
      { status: 500 },
    );
  }
}
