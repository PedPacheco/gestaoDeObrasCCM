import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/viabilidade/route";
import { NextRequest } from "next/server";

// ---- MOCK CORRETO DO next/headers ----
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

  const createRequest = () =>
    new NextRequest("http://localhost/api/viabilidade/upload", {
      method: "POST",
      body: mockFormData(),
    });

  it("Deve realizar upload com sucesso", async () => {
    // cookies() mockado
    (cookies as any).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve({}),
    });

    const req = createRequest();
    const res = await POST(req);
    const body = await res.json();

    expect(global.fetch).toHaveBeenCalled();
    expect(res.status).toBe(201);
    expect(body.message).toBe("Upload realizado com sucesso");
  });

  it("Deve retornar erro quando o backend retornar erro", async () => {
    (cookies as any).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    });

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      text: () =>
        Promise.resolve(JSON.stringify({ message: "Arquivo inválido" })),
    });

    const req = createRequest();
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Arquivo inválido");
  });

  it("Deve retornar erro genérico quando o backend retornar erro sem mensagem explicando o erro", async () => {
    (cookies as any).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    });

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve(JSON.stringify({})), // <= sem message
    });

    const req = createRequest();
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.message).toBe("Erro ao fazer upload");
  });

  it("Deve retornar erro interno em caso de exceção", async () => {
    (cookies as any).mockReturnValue({
      get: vi.fn().mockReturnValue({ value: "mock-token" }),
    });

    (global.fetch as any).mockRejectedValue(new Error("Erro inesperado"));

    const req = createRequest();
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.message).toBe("Erro interno ao processar upload");
  });
});
