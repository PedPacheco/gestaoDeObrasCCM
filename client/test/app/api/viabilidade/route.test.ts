// app/api/viabilidade/upload/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Module Mocks ─────────────────────────────────────────────────────────────

const mockCookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ get: mockCookieGet })),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ✅ Solução: não usar NextRequest com FormData real — mockar formData() diretamente
// para evitar o erro de Content-Type do undici no ambiente Node.js de testes
function makeRequest(formData = new FormData()) {
  const req = {
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as NextRequest;
  return req;
}

function mockBackendOk() {
  mockFetch.mockResolvedValueOnce({ ok: true, status: 201 });
}

function mockBackendError(status: number, body: object | string) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: vi.fn().mockResolvedValue(text),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/viabilidade/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieGet.mockReturnValue({ value: "mock-token" });
    process.env.NEXT_PUBLIC_API_URL = "http://backend.test";
  });

  // ── Success ───────────────────────────────────────────────────────────────

  describe("success", () => {
    it("returns 201 with success message", async () => {
      mockBackendOk();
      const { POST } = await import("@/app/api/viabilidade/route");

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body).toEqual({ message: "Upload realizado com sucesso" });
    });

    it("forwards Authorization header with token from cookie", async () => {
      mockBackendOk();
      const { POST } = await import("@/app/api/viabilidade/route");

      await POST(makeRequest());

      expect(mockFetch).toHaveBeenCalledWith(
        "http://backend.test/viabilidade/upload",
        expect.objectContaining({
          method: "POST",
          headers: { Authorization: "Bearer mock-token" },
        }),
      );
    });

    it("forwards formData as body to backend", async () => {
      mockBackendOk();
      const { POST } = await import("@/app/api/viabilidade/route");

      const formData = new FormData();
      formData.append("file", new Blob(["content"]), "file.xlsx");
      await POST(makeRequest(formData));

      const calledBody = mockFetch.mock.calls[0][1].body;
      expect(calledBody).toBeInstanceOf(FormData);
    });

    it("sends 'Bearer undefined' when token cookie is absent", async () => {
      mockCookieGet.mockReturnValue(undefined);
      mockBackendOk();
      const { POST } = await import("@/app/api/viabilidade/route");

      await POST(makeRequest());

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: "Bearer undefined" },
        }),
      );
    });
  });

  // ── Backend errors ────────────────────────────────────────────────────────

  describe("backend error responses", () => {
    it("returns backend status and message when response is not ok", async () => {
      mockBackendError(400, { message: "Arquivo inválido" });
      const { POST } = await import("@/app/api/viabilidade/route");

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ message: "Arquivo inválido" });
    });

    it("returns fallback message when error body has no message field", async () => {
      mockBackendError(422, {});
      const { POST } = await import("@/app/api/viabilidade/route");

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(422);
      expect(body).toEqual({ message: "Erro ao fazer upload" });
    });

    it("preserves backend status code (e.g. 413)", async () => {
      mockBackendError(413, { message: "Arquivo muito grande" });
      const { POST } = await import("@/app/api/viabilidade/route");

      const res = await POST(makeRequest());

      expect(res.status).toBe(413);
    });
  });

  // ── Internal error (catch) ────────────────────────────────────────────────

  describe("internal error", () => {
    it("returns 500 when fetch throws", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));
      const { POST } = await import("@/app/api/viabilidade/route");

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ message: "Erro interno ao processar upload" });
    });

    it("returns 500 when JSON.parse throws on malformed error body", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: vi.fn().mockResolvedValue("not-json"),
      });
      const { POST } = await import("@/app/api/viabilidade/route");

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ message: "Erro interno ao processar upload" });
    });
  });
});
