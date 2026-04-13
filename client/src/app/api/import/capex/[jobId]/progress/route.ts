import { cookies } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: { jobId: string } },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/progress/${params.jobId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const contentType = response.headers.get("content-type");

  // 👇 trata JSON corretamente
  if (contentType?.includes("application/json")) {
    const data = await response.json();
    return Response.json(data, { status: response.status });
  }

  // fallback (erro, html, etc)
  const text = await response.text();
  return new Response(text, { status: response.status });
}
