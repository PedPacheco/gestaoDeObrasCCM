import * as cookiesModule from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import AllWorks from "@/app/(dashboard)/entrada/lista-geral-obras/page";
import { Transform } from "@/utils/transform";
import { render, screen } from "@testing-library/react";

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/components/worksComponents/allWorks/MainAllWorks", () => ({
  __esModule: true,
  default: vi.fn(({ data, token, filtersData, columns }) => (
    <div
      data-testid="main-all-works"
      data-data={JSON.stringify(data.works)}
      data-filters={JSON.stringify(filtersData)}
      data-token={token}
      data-columns={JSON.stringify(columns)}
    >
      Main All works
    </div>
  )),
}));

vi.mock("@/utils/transform", () => ({
  Transform: vi.fn((filters: Record<string, string[]>) => {
    return Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [
        key,
        Array.isArray(value) && value.length > 0 ? value.join(",") : "",
      ])
    );
  }),
}));

describe("All works page", () => {
  const mockToken = "mock-token";
  const mockData = {
    works: [
      {
        ovnota: "123",
        ordemdiagrama: "12353545",
        status_ov_sap: 25,
        pep: "566",
        mun: "SJC",
      },
    ],
  };

  const mockFilters = {
    regional: ["Regional A", "Regional B"],
    parceira: ["Parceira 1", "Parceira 2"],
    tipo: ["Tipo 1", "Tipo 2"],
    municipio: ["Cidade A", "Cidade B"],
    grupo: ["Grupo 1", "Grupo 2"],
    status: ["Programado", "Executado"],
  };

  const mockParamsFilters = JSON.stringify({
    selectedItems: {
      parceira: ["Parceira 1"],
      regional: ["Regional A"],
    },
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "allWorksFilters") return { value: mockParamsFilters };
      return null;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(cookiesModule.cookies).mockReturnValue(mockCookieStore as any);

    vi.mocked(fetchData).mockResolvedValue({
      token: mockToken,
      data: mockData,
      success: true,
    });

    vi.mocked(fetchFilters).mockResolvedValue(mockFilters);

    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  it("deve buscar dados com os filtros corretos quando cookie de filtros existe", async () => {
    render(await AllWorks());

    expect(Transform).toHaveBeenCalledWith({
      regional: ["Regional A"],
      parceira: ["Parceira 1"],
    });

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/obras",
      { regional: "Regional A", parceira: "Parceira 1", page: "0" },
      mockToken,
      { cache: "no-store" }
    );
  });

  it("deve buscar dados apenas com o ano atual quando não há cookie de filtros", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return null;
    });

    render(await AllWorks());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/obras",
      { page: "0" },
      mockToken,
      { cache: "no-store" }
    );
  });

  it("deve buscar filtros com os parâmetros corretos", async () => {
    render(await AllWorks());

    expect(fetchFilters).toHaveBeenCalledWith({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      status: true,
    });
  });

  it("deve renderizar MainAllWorks com os dados e mapeamento de colunas corretos", async () => {
    render(await AllWorks());

    const mainAllWorks = screen.getByTestId("main-all-works");
    expect(mainAllWorks).toBeInTheDocument();

    expect(JSON.parse(mainAllWorks.getAttribute("data-data") || "[]")).toEqual(
      mockData.works
    );
    expect(
      JSON.parse(mainAllWorks.getAttribute("data-filters") || "{}")
    ).toEqual(mockFilters);
    expect(mainAllWorks.getAttribute("data-token")).toBe(mockToken);

    const expectedColumns = {
      ovnota: "Ovnota",
      ordemdiagrama: "Ordem",
      status_ov_sap: "OV",
      pep: "Pep",
      diagrama: "Diagrama",
      ordem_dci: "Ordem DCI",
      ordem_dcd: "Ordem DCD",
      ordem_dca: "Ordem DCA",
      ordem_dcim: "Ordem DCIM",
      mun: "Mun",
      tipo: "Tipo",
      entrada: "Entrada",
      prazo_fim: "Prazo",
      qtde_planejada: "Qtde",
      mo_planejada: "MO Plan",
      mo_acertada: "MO Acert",
      turma: "Parceira",
      executado: "% Exec",
      data_conclusao: "Data exec",
      status: "Status",
      observ_obra: "Observação",
      referencia: "Referência",
    };

    expect(
      JSON.parse(mainAllWorks.getAttribute("data-columns") || "{}")
    ).toEqual(expectedColumns);
  });

  it("deve usar o Promise.all para execução paralela das requisições", async () => {
    const originalPromiseAll = Promise.all;
    const promiseAllSpy = vi.spyOn(Promise, "all");

    render(await AllWorks());

    expect(promiseAllSpy).toHaveBeenCalled();

    Promise.all = originalPromiseAll;
  });
});
