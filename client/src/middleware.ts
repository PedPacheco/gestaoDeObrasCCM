import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "./middleware/authPermission";

type Middleware = (
  req: NextRequest,
) => Promise<NextResponse | undefined> | NextResponse | undefined;

async function runMiddlewares(req: NextRequest, middlewares: Middleware[]) {
  for (const mw of middlewares) {
    const response = await mw(req);

    // Continua para o próximo middleware só se este devolveu NextResponse.next()
    if (response && !response.headers.get("x-middleware-next")) {
      return response;
    }
  }
  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  return runMiddlewares(request, [authMiddleware]);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|login(?:/|$)|.*\\.(?:png|jpe?g|gif|svg|webp|ico)$).*)",
  ],
};
