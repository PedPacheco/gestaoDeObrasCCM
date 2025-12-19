import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchData } from "@/actions/fetchData.action"; // ajuste se o path for diferente

const mockToken = "mock-token";
const mockBaseUrl = "https://api.exemplo.com/data";
const mockParams = { q: "teste" };
const mockUrl = `${mockBaseUrl}?q=teste`;

vi.mock("@/utils/mountUrl", () => ({
  mountUrl: vi.fn(() => mockUrl),
}));

describe("fetchData", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("Deve retornar os dados corretamente quando a resposta for bem-sucedida", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { nome: "João" } }),
      })
    ) as any;

    const result = await fetchData(mockBaseUrl, mockParams, mockToken);

    expect(result).toEqual({
      success: true,
      token: mockToken,
      data: { nome: "João" },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      mockUrl,
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockToken}`,
        },
      })
    );
  });

  it("Deve lançar o erro se o token não for encontrado", async () => {
    await expect(fetchData(mockBaseUrl)).rejects.toThrow(
      "Token não foi encontrada"
    );
  });

  it("Deve lançar erro se a resposta da API falhar", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: "Erro 403" }),
        status: 500,
      })
    ) as any;

    const result = await fetchData(mockBaseUrl, mockParams, mockToken);

    expect(result).toEqual({
      success: false,
      message: "Erro ao buscar os dados",
      token: "mock-token",
    });
  });
});
