import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/viabilidade/route";
import { NextRequest } from "next/server";

// ✅ mock correto
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";

describe("API Upload Route (POST)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  const mockFormData = () => {
    const fd = new FormData();
    fd.append("file", new Blob(["abc"]), "file.pdf");
    return fd;
  };

  const createRequest = () => {
    const req = new NextRequest("http://localhost/api/viabilidade/upload", {
      method: "POST",
    });

    (req as any).formData = vi.fn().mockResolvedValue(mockFormData());

    return req;
  };

  const mockCookies = () => {
    (cookies as any).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    });
  };

  it("Deve realizar upload com sucesso", async () => {
    mockCookies();

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({}),
    });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(201);
    expect(body.message).toBe("Upload realizado com sucesso");
  });

  it("Deve retornar erro quando o backend retornar erro", async () => {
    mockCookies();

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: "Arquivo inválido" }),
    });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(400);
    expect(body.message).toBe("Arquivo inválido");
  });

  it("Deve retornar erro genérico quando backend não retorna message", async () => {
    mockCookies();

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({}),
    });

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Erro ao fazer upload"); // ⚠️ importante
  });

  it("Deve retornar erro interno em caso de exceção", async () => {
    mockCookies();

    (global.fetch as any).mockRejectedValue(new Error("Erro inesperado"));

    const res = await POST(createRequest());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toBe("Erro interno ao processar upload");
  });
});
