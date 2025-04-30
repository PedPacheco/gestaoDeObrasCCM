import { fetchFilters } from "@/actions/fetchFilters.action";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: getMock,
  }),
}));

describe("fetchFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Deve lançar erro se o token não for encontrado", async () => {
    getMock.mockReturnValue(undefined);

    await expect(fetchFilters()).rejects.toThrow("Token não foi encontrada");
  });

  it("Deve retornar os dados dos filtros com sucesso", async () => {
    getMock.mockReturnValue({ value: "mock-token" });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ filtro1: true }),
      })
    ) as any;

    const result = await fetchFilters({ ativo: true });

    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.NEXT_PUBLIC_API_URL}/filters?ativo=true`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        next: { revalidate: 60 * 60 },
      }
    );

    expect(result).toEqual({ filtro1: true });
  });

  it("Deve lançar erro se a resposta não for ok", async () => {
    getMock.mockReturnValue({ value: "mock-token" });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: Promise.resolve({}),
      })
    ) as any;

    await expect(fetchFilters()).rejects.toThrow(
      "Erro ao buscar os valores dos filtros"
    );
  });

  it("Deve lançar erro genérico se fetch falhar", async () => {
    getMock.mockReturnValue({ value: "mock-token" });

    global.fetch = vi.fn(() => Promise.reject("Erro inesperado")) as any;

    await expect(fetchFilters()).rejects.toThrow(
      "Não foi possível se conectar ao servidor. Tente novamente mais tarde."
    );
  });
});
