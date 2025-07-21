import dayjs from "dayjs";
import * as cookiesModule from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import RdaGoals from "@/app/(dashboard)/metas/rda/page";
import { Transform } from "@/utils/transform";
import { render, screen } from "@testing-library/react";
import Bt0Goals from "@/app/(dashboard)/metas/btzero/page";

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

vi.mock("@/components/goalsComponents/MainGoals", () => ({
  __esModule: true,
  default: vi.fn(({ data, filtersData, token, columns }) => (
    <div
      data-testid="main-goals"
      data-data={JSON.stringify(data)}
      data-filters={JSON.stringify(filtersData)}
      data-token={token}
      data-columns={JSON.stringify(columns)}
    >
      MainGoals Component
    </div>
  )),
}));

describe("BT0 Page", () => {
  const mockToken = "mock-token";
  const mockData = [
    { tipo_obra: "Obra 1", jan: 10, fev: 20, total: 30 },
    { tipo_obra: "Obra 2", jan: 5, fev: 15, total: 20 },
  ];

  const mockFilters = {
    regional: ["Regional 1", "Regional 2"],
    parceira: ["Parceira X", "Parceira Y"],
    emprendimento: ["Empreendimento X", "Empreendimento Y"],
  };

  const mockRdaCookieValue = JSON.stringify({
    regional: ["Regional 1"],
    parceira: ["Parceira X"],
    ano: ["2024"],
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "bt0GoalsFilters") return { value: mockRdaCookieValue };
      return null;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(dayjs("2025-05-26").format("DD/MM/YYYY"));

    vi.mocked(cookiesModule.cookies).mockResolvedValue(mockCookieStore as any);

    vi.mocked(fetchData).mockResolvedValue({
      token: mockToken,
      data: mockData,
    });

    vi.mocked(fetchFilters).mockResolvedValue(mockFilters);

    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve buscar dados com filtros transformados quando o cookie existe", async () => {
    render(await Bt0Goals());

    expect(Transform).toHaveBeenCalledWith(JSON.parse(mockRdaCookieValue));

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/metas",
      {
        regional: "Regional 1",
        parceira: "Parceira X",
        ano: "2024",
        btzero: true,
        rda: false,
      },
      mockToken
    );
  });

  it("deve buscar dados apenas com o ano padrão quando não há cookie de filtros", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return null;
    });

    render(await Bt0Goals());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/metas",
      {
        ano: "2025",
        btzero: true,
        rda: false,
      },
      mockToken
    );
  });

  it("deve buscar filtros com parâmetros corretos", async () => {
    render(await Bt0Goals());

    expect(fetchFilters).toHaveBeenCalledWith({
      regional: true,
      parceira: true,
    });
  });

  it("deve renderizar Bt0Goals com dados corretos", async () => {
    render(await Bt0Goals());

    const mainGoals = screen.getByTestId("main-goals");

    expect(mainGoals).toBeInTheDocument();

    expect(JSON.parse(mainGoals.getAttribute("data-data") || "[]")).toEqual(
      mockData
    );
    expect(JSON.parse(mainGoals.getAttribute("data-filters") || "{}")).toEqual(
      mockFilters
    );
    expect(mainGoals.getAttribute("data-token")).toBe(mockToken);

    const expectedColumns = {
      regional: "Regional",
      tipo_obra: "Tipo de obra",
      turma: "Contratada",
      anocalc: "Ano",
      teste: "Teste",
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
      carteira: "Carteira",
    };

    expect(JSON.parse(mainGoals.getAttribute("data-columns") || "{}")).toEqual(
      expectedColumns
    );
  });

  it("deve usar Promise.all para requisições paralelas", async () => {
    const promiseAllSpy = vi.spyOn(Promise, "all");
    render(await Bt0Goals());

    expect(promiseAllSpy).toHaveBeenCalled();
  });
});
