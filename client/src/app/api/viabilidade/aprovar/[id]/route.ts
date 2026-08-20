import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const formData = await request.formData();

    console.log("entrou");

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    const { id } = await params;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/viabilidade/aprovar/${id}`,
      {
        method: "PATCH",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();

      let errorMessage = "Erro ao aprovar viabilidade";

      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message ?? errorMessage;
      } catch {
        errorMessage = text || errorMessage;
      }

      return NextResponse.json(
        { message: errorMessage },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json({ message: data.message }, { status: 200 });
  } catch (error) {
    console.error("Erro ao aprovar viabilidade:", error);

    return NextResponse.json(
      { message: "Erro interno ao aprovar viabilidade" },
      { status: 500 },
    );
  }
}
