import * as cookiesModule from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { render, screen } from "@testing-library/react";
import { Transform } from "@/utils/transform";
import MonthlySummary from "@/app/(dashboard)/programacao/resumo-mensal/page";

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
  "@/components/scheduleComponents/monthlySummary/mainMonthlySummarySchedule",
  () => ({
    __esModule: true,
    default: vi.fn(
      ({
        dataFirstSummary,
        dataSecondSummary,
        token,
        filtersData,
        columnsFirstSummary,
        columnsSecondSummary,
      }) => (
        <div
          data-testid="main-monthly-summary-schedule"
          data-data-first-summary={JSON.stringify(dataFirstSummary)}
          data-data-second-summary={JSON.stringify(dataSecondSummary)}
          data-columns-first-summary={JSON.stringify(columnsFirstSummary)}
          data-columns-second-summary={JSON.stringify(columnsSecondSummary)}
          data-filtersData={JSON.stringify(filtersData)}
          data-token={token}
        >
          Main Monthly Summary Schedule
        </div>
      )
    ),
  })
);

describe("Monthly Summary Schedule page", () => {
  const mockToken = "mock-token";
  const mockDataFirstSummary = [
    {
      dataProg: "17/05/2025",
      totalQtde: 1344,
      totalMoProg: 1234,
      totalMoExec: 1104,
      totalMoPrev: 2134,
    },
  ];

  const mockDataSecondSummary = [
    {
      grupo: "Recomposição",
      turma: "Engelmig",
      totalMoProg: 12344,
      totalMoExec: 1104,
      totalMoPrev: 2134,
    },
  ];

  const mockFilters = {
    parceira: ["Parceira 1", "Parceira 2"],
    regional: ["Regional 1", "Regional 2"],
    grupo: ["Grupo 1", "Grupo 2"],
    tipo: ["Tipo 1", "Tipo 2"],
  };

  const mockParamsFiltes = JSON.stringify({
    selectedItems: {
      parceira: ["Parceira 1"],
      regional: ["Regional 1"],
    },
    date: "2025-05-17",
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "monthlySummaryScheduleFilters")
        return { value: mockParamsFiltes };
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-17"));

    vi.mocked(fetchData).mockResolvedValueOnce({
      token: mockToken,
      data: mockDataFirstSummary,
    });

    vi.mocked(fetchData).mockResolvedValueOnce({
      token: mockToken,
      data: mockDataSecondSummary,
    });

    vi.mocked(fetchFilters).mockResolvedValue(mockFilters);

    vi.mocked(cookiesModule.cookies).mockResolvedValue(mockCookieStore as any);

    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve buscar dados com os filtros corretos quando cookie de filtros existe", async () => {
    render(await MonthlySummary());

    expect(Transform).toHaveBeenCalledWith({
      parceira: ["Parceira 1"],
      regional: ["Regional 1"],
    });

    expect(fetchData).toHaveBeenCalledTimes(2);

    expect(fetchData).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/programacao/resumo-mensal",
      {
        regional: "Regional 1",
        parceira: "Parceira 1",
        date: "05/2025",
      },
      mockToken
    );

    expect(fetchData).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/programacao/resumo-mensal-2",
      {
        regional: "Regional 1",
        parceira: "Parceira 1",
        date: "05/2025",
      },
      mockToken
    );
  });

  it("deve buscar dados com os filtros padrões caso cookie de filtros não existir", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return undefined;
    });

    render(await MonthlySummary());

    expect(fetchData).toHaveBeenNthCalledWith(
      1,
      "https://api.example.com/programacao/resumo-mensal",
      {
        date: "05/2025",
      },
      mockToken
    );

    expect(fetchData).toHaveBeenNthCalledWith(
      2,
      "https://api.example.com/programacao/resumo-mensal-2",
      {
        date: "05/2025",
      },
      mockToken
    );
  });

  it("Deve passar os dados corretamente para o componente MonthlySummarySchedule", async () => {
    render(await MonthlySummary());

    const monthlySummarySchedule = screen.getByTestId("main-monthly-summary-schedule");

    expect(monthlySummarySchedule).toBeInTheDocument();

    expect(
      JSON.parse(monthlySummarySchedule.getAttribute("data-data-first-summary") || "[]")
    ).toEqual(mockDataFirstSummary);
    expect(
      JSON.parse(
        monthlySummarySchedule.getAttribute("data-data-second-summary") || "[]"
      )
    ).toEqual(mockDataSecondSummary);
    expect(
      JSON.parse(monthlySummarySchedule.getAttribute("data-filtersData") || "[]")
    ).toEqual(mockFilters);
    expect(monthlySummarySchedule.getAttribute("data-token")).toBe(mockToken);
  });
});
