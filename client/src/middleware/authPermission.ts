import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "your_jwt_secret",
);

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas — não exigem autenticação
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/login") ||
    pathname === "/login" ||
    /\.(.*)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    await jwtVerify(token, secret);
    return NextResponse.next();
  } catch (error) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("token");
    response.cookies.delete("userInfo");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!login|login/.*|api/login|_next/static|_next/image|favicon\\.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.gif$|.*\\.webp$|.*\\.ico$).*)",
  ],
};
