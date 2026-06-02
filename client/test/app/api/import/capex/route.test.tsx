// test/app/api/import/capex/route.test.ts

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOISTED MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { mockCookiesGet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}));

// Ajuste este caminho conforme a localização real da sua route
import { POST } from "@/app/api/import/capex/route";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function mockTokenCookie(token?: string) {
  mockCookiesGet.mockImplementation((name: string) => {
    if (name !== "token") return undefined;

    if (token === undefined) return undefined;

    return {
      value: token,
    };
  });
}

function mockFetchJsonResponse(data: unknown, status = 200) {
  const json = vi.fn().mockResolvedValue(data);

  const response = {
    status,
    json,
  };

  return response as unknown as Response;
}

function mockFetchInvalidJsonResponse(status = 502) {
  const json = vi.fn().mockRejectedValue(new Error("Invalid JSON"));

  const response = {
    status,
    json,
  };

  return response as unknown as Response;
}

function createRequest({
  body,
  contentType,
}: {
  body?: BodyInit;
  contentType?: string;
} = {}) {
  const headers = new Headers();

  if (contentType) {
    headers.set("content-type", contentType);
  }

  return new Request("http://localhost/api/import/capex", {
    method: "POST",
    headers,
    body,
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("POST /api/import/capex", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env = {
      ...OLD_ENV,
      NEXT_PUBLIC_API_URL: "https://api.example.com",
    };

    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = OLD_ENV;
    vi.unstubAllGlobals();
  });

  it("deve enviar a requisição para o endpoint de pipeline CAPEX", async () => {
    mockTokenCookie("token-123");

    vi.mocked(fetch).mockResolvedValue(
      mockFetchJsonResponse({ success: true }, 201),
    );

    const req = createRequest({
      body: JSON.stringify({ fileName: "capex.xlsx" }),
      contentType: "application/json",
    });

    await POST(req);

    expect(fetch).toHaveBeenCalledTimes(1);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.com/base-auxiliar/capex/pipeline",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("deve encaminhar content-type, Authorization, body e duplex", async () => {
    mockTokenCookie("abc-token");

    vi.mocked(fetch).mockResolvedValue(
      mockFetchJsonResponse({ jobId: "job-1" }, 202),
    );

    const req = createRequest({
      body: JSON.stringify({ arquivo: "teste" }),
      contentType: "application/json",
    });

    await POST(req);

    const [, init] = vi.mocked(fetch).mock.calls[0];

    expect(init).toMatchObject({
      method: "POST",
      duplex: "half",
    });

    expect(init?.headers).toEqual({
      "content-type": "application/json",
      Authorization: "Bearer abc-token",
    });

    expect(init?.body).toBe(req.body);
  });

  it("deve usar content-type vazio quando a requisição não tiver content-type", async () => {
    mockTokenCookie("token-sem-content-type");

    vi.mocked(fetch).mockResolvedValue(
      mockFetchJsonResponse({ ok: true }, 200),
    );

    const req = createRequest();

    await POST(req);

    const [, init] = vi.mocked(fetch).mock.calls[0];

    expect(init?.headers).toEqual({
      "content-type": "",
      Authorization: "Bearer token-sem-content-type",
    });
  });

  it("deve enviar Authorization como Bearer undefined quando não existir token", async () => {
    mockTokenCookie(undefined);

    vi.mocked(fetch).mockResolvedValue(
      mockFetchJsonResponse({ ok: true }, 200),
    );

    const req = createRequest({
      body: JSON.stringify({ teste: true }),
      contentType: "application/json",
    });

    await POST(req);

    const [, init] = vi.mocked(fetch).mock.calls[0];

    expect(init?.headers).toEqual({
      "content-type": "application/json",
      Authorization: "Bearer undefined",
    });
  });

  it("deve retornar o JSON da API externa com o mesmo status", async () => {
    mockTokenCookie("token-123");

    vi.mocked(fetch).mockResolvedValue(
      mockFetchJsonResponse(
        {
          success: true,
          jobId: "job-123",
          message: "Pipeline iniciado",
        },
        201,
      ),
    );

    const req = createRequest({
      body: JSON.stringify({ arquivo: "capex.xlsx" }),
      contentType: "application/json",
    });

    const response = await POST(req);

    expect(response.status).toBe(201);

    await expect(response.json()).resolves.toEqual({
      success: true,
      jobId: "job-123",
      message: "Pipeline iniciado",
    });
  });

  it("deve propagar status de erro da API externa", async () => {
    mockTokenCookie("token-erro");

    vi.mocked(fetch).mockResolvedValue(
      mockFetchJsonResponse(
        {
          success: false,
          message: "Erro ao processar CAPEX",
        },
        500,
      ),
    );

    const req = createRequest({
      body: JSON.stringify({ arquivo: "capex.xlsx" }),
      contentType: "application/json",
    });

    const response = await POST(req);

    expect(response.status).toBe(500);

    await expect(response.json()).resolves.toEqual({
      success: false,
      message: "Erro ao processar CAPEX",
    });
  });

  it("deve retornar mensagem padrão quando a resposta da API externa não for JSON válido", async () => {
    mockTokenCookie("token-json-invalido");

    vi.mocked(fetch).mockResolvedValue(mockFetchInvalidJsonResponse(502));

    const req = createRequest({
      body: JSON.stringify({ arquivo: "capex.xlsx" }),
      contentType: "application/json",
    });

    const response = await POST(req);

    expect(response.status).toBe(502);

    await expect(response.json()).resolves.toEqual({
      message: "Resposta inválida do servidor",
    });
  });

  it("deve ler o cookie token", async () => {
    mockTokenCookie("token-cookie");

    vi.mocked(fetch).mockResolvedValue(
      mockFetchJsonResponse({ ok: true }, 200),
    );

    const req = createRequest({
      body: JSON.stringify({ teste: true }),
      contentType: "application/json",
    });

    await POST(req);

    expect(mockCookiesGet).toHaveBeenCalledTimes(1);
    expect(mockCookiesGet).toHaveBeenCalledWith("token");
  });

  it("deve respeitar NEXT_PUBLIC_API_URL definido no ambiente", async () => {
    process.env.NEXT_PUBLIC_API_URL = "https://custom-api.test";

    mockTokenCookie("token-env");

    vi.mocked(fetch).mockResolvedValue(
      mockFetchJsonResponse({ ok: true }, 200),
    );

    const req = createRequest({
      body: JSON.stringify({ teste: true }),
      contentType: "application/json",
    });

    await POST(req);

    expect(fetch).toHaveBeenCalledWith(
      "https://custom-api.test/base-auxiliar/capex/pipeline",
      expect.any(Object),
    );
  });
});
