import { cookies } from "next/headers";

/**
 * Proxy para o endpoint de pipeline do CAPEX.
 * O fluxo de polling foi removido — o progresso é gerenciado
 * exclusivamente via Socket.IO (useCapexSocket).
 *
 * Rota removida: /api/import/capex/[jobId]/progress  ← não é mais necessária
 */
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/capex/pipeline`,
    {
      method: "POST",
      headers: {
        "content-type": req.headers.get("content-type") || "",
        Authorization: `Bearer ${token}`,
      },
      body: req.body,
      duplex: "half",
    } as RequestInit,
  );

  const data = await response.json().catch(() => ({
    message: "Resposta inválida do servidor",
  }));

  return Response.json(data, { status: response.status });
}
