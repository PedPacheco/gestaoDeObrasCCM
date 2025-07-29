import dayjs from "dayjs";
import * as cookiesModule from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import Entry from "@/app/(dashboard)/entrada/page";
import { Transform } from "@/utils/transform";
import { render, screen } from "@testing-library/react";

// Mocks
vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
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

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/components/entryComponents/entry/MainEntry", () => ({
  __esModule: true,
  default: vi.fn(({ data, filtersData, token, columns }) => (
    <div
      data-testid="main-entry"
      data-data={JSON.stringify(data)}
      data-filters={JSON.stringify(filtersData)}
      data-token={token}
      data-columns={JSON.stringify(columns)}
    >
      MainEntry Component
    </div>
  )),
}));

describe("Entry Page", () => {
  const mockToken = "mock-token";
  const mockData = [
    { tipo_obra: "Tipo 1", jan: 10, fev: 5, mar: 8, total: 23 },
    { tipo_obra: "Tipo 2", jan: 7, fev: 12, mar: 3, total: 22 },
  ];

  const mockFilters = {
    regional: ["Regional A", "Regional B"],
    parceira: ["Parceira 1", "Parceira 2"],
    tipo: ["Tipo 1", "Tipo 2"],
    municipio: ["Cidade A", "Cidade B"],
    grupo: ["Grupo 1", "Grupo 2"],
    circuito: ["Circuito X", "Circuito Y"],
  };

  const mockEntryCookieValue = JSON.stringify({
    selectedItems: {
      regional: ["Regional A"],
      parceira: ["Parceira 1"],
    },
    selectedYear: "2023-01-01",
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "entryFilters") return { value: mockEntryCookieValue };
      return null;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(dayjs("2025-04-28").format("DD/MM/YYYY"));

    // Mock de cookies
    vi.mocked(cookiesModule.cookies).mockResolvedValue(mockCookieStore as any);

    // Mock de fetchData
    vi.mocked(fetchData).mockResolvedValue({
      token: mockToken,
      data: mockData,
    });

    // Mock de fetchFilters
    vi.mocked(fetchFilters).mockResolvedValue(mockFilters);

    // Mock do env
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve buscar dados com os filtros corretos quando cookie de filtros existe", async () => {
    render(await Entry());

    expect(Transform).toHaveBeenCalledWith({
      regional: ["Regional A"],
      parceira: ["Parceira 1"],
    });

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/entrada",
      {
        regional: "Regional A",
        parceira: "Parceira 1",
        ano: "2023",
      },
      mockToken
    );
  });

  it("deve buscar dados apenas com o ano atual quando não há cookie de filtros", async () => {
    // Simula cookie não existente
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return null;
    });

    render(await Entry());

    const currentYear = dayjs().format("YYYY");

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/entrada",
      { ano: currentYear },
      mockToken
    );
  });

  it("deve buscar filtros com os parâmetros corretos", async () => {
    render(await Entry());

    expect(fetchFilters).toHaveBeenCalledWith({
      regional: true,
      parceira: true,
      tipo: true,
      municipio: true,
      grupo: true,
      circuito: true,
    });
  });

  it("deve renderizar MainEntry com os dados e mapeamento de colunas corretos", async () => {
    render(await Entry());

    const mainEntry = screen.getByTestId("main-entry");
    expect(mainEntry).toBeInTheDocument();

    // Verifica os dados passados para o componente
    expect(JSON.parse(mainEntry.getAttribute("data-data") || "[]")).toEqual(
      mockData
    );
    expect(JSON.parse(mainEntry.getAttribute("data-filters") || "{}")).toEqual(
      mockFilters
    );
    expect(mainEntry.getAttribute("data-token")).toBe(mockToken);

    // Verifica o mapeamento de colunas
    const expectedColumns = {
      tipo_obra: "Tipo",
      jan: "Jan",
      fev: "Fev",
      mar: "Mar",
      abr: "Abr",
      mai: "Mai",
      jun: "Jun",
      jul: "Jul",
      ago: "Ago",
      set: "Set",
      out: "Out",
      nov: "Nov",
      dez: "Dez",
      total: "Total",
    };

    expect(JSON.parse(mainEntry.getAttribute("data-columns") || "{}")).toEqual(
      expectedColumns
    );
  });

  it("deve usar o Promise.all para execução paralela das requisições", async () => {
    const originalPromiseAll = Promise.all;
    const promiseAllSpy = vi.spyOn(Promise, "all");

    render(await Entry());

    expect(promiseAllSpy).toHaveBeenCalled();

    // Restaura o método original
    Promise.all = originalPromiseAll;
  });
});
