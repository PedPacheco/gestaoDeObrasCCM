import * as cookiesModule from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { render, screen } from "@testing-library/react";
import ScheduleRestrictions from "@/app/(dashboard)/restricoes/programacoes/page";
import { Transform } from "@/utils/transform";

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
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

vi.mock(
  "@/components/scheduleComponents/scheduleRestrictions/MainScheduleRestrictions",
  () => ({
    __esModule: true,
    default: vi.fn(({ data, token, filtersData, column }) => (
      <div
        data-testid="main-schedule-restrictions"
        data-data={JSON.stringify(data)}
        data-filtersData={JSON.stringify(filtersData)}
        data-token={token}
        data-columns={JSON.stringify(column)}
      >
        Main Schedule For Day
      </div>
    )),
  })
);

describe("Schedule restrictions page", () => {
  const mockToken = "mock-token";
  const mockData = [
    {
      id: 124,
      ovnota: "34435",
      mun: "SJC",
      tipo: "BTZERO",
      parceira: "ENGELMIG",
    },
  ];

  const mockFilters = {
    parceira: ["Parceira 1", "Parceira 2"],
    regional: ["Regional 1", "Regional 2"],
    municipio: ["Municipio 1", "Municipio 2"],
    grupo: ["Grupo 1", "Grupo 2"],
    tipo: ["Tipo 1", "Tipo 2"],
  };

  const mockParamsFiltes = JSON.stringify({
    selectedItems: {
      parceira: ["Parceira 1"],
      regional: ["Regional 1"],
    },
    weekRange: {
      start: "17/05/2025",
      end: "22/05/2025",
    },
    executed: "true",
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "scheduleRestrictionsFilters")
        return { value: mockParamsFiltes };
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-17"));

    vi.mocked(fetchData).mockResolvedValue({
      token: mockToken,
      data: mockData,
      success: true,
    });

    vi.mocked(fetchFilters).mockResolvedValue(mockFilters);

    vi.mocked(cookiesModule.cookies).mockResolvedValue(mockCookieStore as any);

    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve buscar dados com os filtros corretos quando cookie de filtros existe", async () => {
    render(await ScheduleRestrictions());

    expect(Transform).toHaveBeenCalledWith({
      parceira: ["Parceira 1"],
      regional: ["Regional 1"],
    });

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao/restricoes",
      {
        regional: "Regional 1",
        parceira: "Parceira 1",
        dataInicial: "17/05/2025",
        dataFinal: "22/05/2025",
        executado: "true",
      },
      mockToken,
      { cache: "no-store" }
    );
  });

  it("deve buscar dados com os filtros padrões caso cookie de filtros não existir", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return undefined;
    });

    render(await ScheduleRestrictions());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao/restricoes",
      {
        dataInicial: "12/05/2025",
        dataFinal: "18/05/2025",
        executado: "false",
      },
      mockToken,
      { cache: "no-store" }
    );
  });

  it("Deve passar os dados corretamente para o componente ScheduleRestrictions", async () => {
    render(await ScheduleRestrictions());

    const scheduleRestrictions = screen.getByTestId(
      "main-schedule-restrictions"
    );

    expect(scheduleRestrictions).toBeInTheDocument();

    expect(
      JSON.parse(scheduleRestrictions.getAttribute("data-data") || "[]")
    ).toEqual(mockData);
    expect(
      JSON.parse(scheduleRestrictions.getAttribute("data-filtersData") || "[]")
    ).toEqual(mockFilters);
    expect(scheduleRestrictions.getAttribute("data-token")).toBe(mockToken);
  });
});
