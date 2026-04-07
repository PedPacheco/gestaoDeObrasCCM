import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/base-auxiliar/capex`,
    {
      method: "POST",
      headers: {
        "content-type": req.headers.get("content-type") || "",
        Authorization: `Bearer ${token}`,
      },
      body: req.body, // 🔥 stream direto
      duplex: "half", // necessário em alguns runtimes
    } as any,
  );

  return new Response(await response.text(), {
    status: response.status,
  });
}
