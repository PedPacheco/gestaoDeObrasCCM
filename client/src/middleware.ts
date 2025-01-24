import { NextRequest, NextResponse } from "next/server";
import { authMiddleware } from "./middleware/authPermission";

async function runMiddlewares(req: NextRequest, middlewares: Function[]) {
  for (let middleware of middlewares) {
    const response = await middleware(req);
    if (response) return response;
  }

  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const response = await runMiddlewares(request, [authMiddleware]);
  return response;
}

export const config = {
  matcher: ["/((?!login|login/.*).*)"],
};
