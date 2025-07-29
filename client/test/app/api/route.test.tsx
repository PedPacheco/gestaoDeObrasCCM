import * as cookiesModule from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/login/route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("POST /api/login", () => {
  const mockSet = vi.fn();

  const mockCookieStore = {
    set: mockSet,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(cookiesModule.cookies).mockResolvedValue(mockCookieStore as any);
  });

  it("deve autenticar e setar cookies corretamente em caso de sucesso", async () => {
    const fakeToken = "fake.jwt.token";
    const fakeUser = { id: 1, name: "Pedro" };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Logado", data: fakeUser }),
      headers: {
        get: (name: string) => {
          if (name === "set-cookie") return `token=${fakeToken}; Path=/;`;
        },
      },
    });

    const req = new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify({ user: "admin", password: "123" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data).toEqual(fakeUser);
    expect(mockSet).toHaveBeenCalledWith(
      "token",
      fakeToken,
      expect.objectContaining({
        httpOnly: true,
        path: "/",
      })
    );
    expect(mockSet).toHaveBeenCalledWith(
      "userInfo",
      JSON.stringify(fakeUser),
      expect.objectContaining({
        httpOnly: false,
        path: "/",
      })
    );
  });

  it("deve retornar erro 401 se a resposta não for ok", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Credenciais inválidas" }),
    });

    const req = new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify({ user: "wrong", password: "wrong" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Credenciais inválidas");
  });

  it("deve retornar erro 500 se houver exceção", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Erro de rede"));

    const req = new Request("http://localhost/api/login", {
      method: "POST",
      body: JSON.stringify({ user: "admin", password: "123" }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.success).toBe(false);
    expect(json.message).toBe("Erro no login");
  });
});
