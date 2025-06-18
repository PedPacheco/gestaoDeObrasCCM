import { cookies } from "next/headers";

export async function POST(req: Request) {
  const cookiesStore = await cookies();
  const { user, password } = await req.json();

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return new Response(
        JSON.stringify({ success: false, message: error.message }),
        {
          status: 401,
        }
      );
    }

    const res = await response.json();

    const setCookieHeader = response.headers.get("set-cookie");

    if (setCookieHeader) {
      const tokenMatch = setCookieHeader.match(/token=([^;]+);?/);
      const tokenValue = tokenMatch?.[1];

      if (tokenValue) {
        cookiesStore.set("token", tokenValue, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      }
    }

    cookiesStore.set("userInfo", JSON.stringify(res.data), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return new Response(
      JSON.stringify({ success: true, message: res.message, data: res.data })
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, message: "Erro no login" }),
      {
        status: 500,
      }
    );
  }
}
