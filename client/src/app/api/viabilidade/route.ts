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
      }
    );

    if (!response.ok) {
      const text = await response.text();
      const errorData = JSON.parse(text);
      return NextResponse.json(
        { message: errorData.message || "Erro ao fazer upload" },
        { status: response.status }
      );
    }

    return NextResponse.json(
      { message: "Upload realizado com sucesso" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro no upload:", error);
    return NextResponse.json(
      { message: "Erro interno ao processar upload" },
      { status: 500 }
    );
  }
}

// // app/api/viabilidade/check/[obraId]/route.ts

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { obraId: string } }
// ) {
//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/viabilidade/check/${params.obraId}`
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       return NextResponse.json(
//         { message: "Erro ao verificar arquivos" },
//         { status: response.status }
//       );
//     }

//     return NextResponse.json(data);
//   } catch (error) {
//     console.error("Erro ao verificar arquivos:", error);
//     return NextResponse.json(
//       { message: "Erro interno ao verificar arquivos" },
//       { status: 500 }
//     );
//   }
// }

// // app/api/viabilidade/list/[obraId]/route.ts

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { obraId: string } }
// ) {
//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/viabilidade/list/${params.obraId}`
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       return NextResponse.json(
//         { message: "Erro ao listar arquivos" },
//         { status: response.status }
//       );
//     }

//     return NextResponse.json(data);
//   } catch (error) {
//     console.error("Erro ao listar arquivos:", error);
//     return NextResponse.json(
//       { message: "Erro interno ao listar arquivos" },
//       { status: 500 }
//     );
//   }
// }
