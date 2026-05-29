/**
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mocks
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/components/forecast/forecastSelect", () => ({
  SnapshotSelect: ({ snapshots, selectedId }: any) => (
    <div data-testid="snapshot-select">
      {selectedId} - {snapshots.length}
    </div>
  ),
}));

vi.mock(
  "@/components/scheduleComponents/monthlyForecastSummary/monthlyForecastSummaryTable",
  () => ({
    MonthlyForecastSummaryTable: ({ data, totals, isFirstSummary }: any) => (
      <div data-testid={`table-${isFirstSummary ? "first" : "second"}`}>
        rows:{data.length} totals:{Object.keys(totals).length}
      </div>
    ),
  }),
);

vi.mock("@/theme/emotionCache", () => ({
  EmotionCacheProvider: ({ children }: any) => <div>{children}</div>,
}));

import { cookies } from "next/headers";
import { fetchData } from "@/actions/fetchData.action";
import ForecastReportPage from "@/app/(dashboard)/relatorios/forecast/page";

const mockCookies = cookies as unknown as ReturnType<typeof vi.fn>;
const mockFetch = fetchData as unknown as ReturnType<typeof vi.fn>;

function createSearchParams(params: any) {
  return Promise.resolve(params);
}

describe("ForecastReportPage (Vitest)", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCookies.mockResolvedValue({
      get: () => ({ value: "token" }),
    });
  });

  it("should render empty state when no snapshots exist", async () => {
    mockFetch.mockResolvedValueOnce({ data: [] });

    const component = await ForecastReportPage({
      searchParams: createSearchParams({}),
    });

    render(component);

    expect(screen.getByText("Nenhum relatório encontrado")).toBeInTheDocument();
    expect(
      screen.getByText("Ainda não existem snapshots gerados para exibição."),
    ).toBeInTheDocument();
  });

  it("should use latest snapshot when no param is provided", async () => {
    mockFetch
      .mockResolvedValueOnce({
        data: [
          { id: 1, nomeArquivo: "old" },
          { id: 2, nomeArquivo: "new" },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          diario: { summary: [], totals: {} },
          grupo: { summary: [], totals: {} },
        },
      });

    const component = await ForecastReportPage({
      searchParams: createSearchParams({}),
    });

    render(component);

    expect(screen.getByTestId("snapshot-select")).toHaveTextContent("2 - 2");
  });

  it("should use snapshotId from params when provided", async () => {
    mockFetch
      .mockResolvedValueOnce({
        data: [
          { id: 1, nomeArquivo: "old" },
          { id: 2, nomeArquivo: "new" },
        ],
      })
      .mockResolvedValueOnce({
        data: {
          diario: { summary: [], totals: {} },
          grupo: { summary: [], totals: {} },
        },
      });

    const component = await ForecastReportPage({
      searchParams: createSearchParams({ snapshotId: "1" }),
    });

    render(component);

    expect(screen.getByTestId("snapshot-select")).toHaveTextContent("1 - 2");
  });

  it("should render both tables with correct data", async () => {
    mockFetch
      .mockResolvedValueOnce({
        data: [{ id: 1, nomeArquivo: "snap" }],
      })
      .mockResolvedValueOnce({
        data: {
          diario: {
            summary: [{ id: 1 }],
            totals: { total: 1 },
          },
          grupo: {
            summary: [{ id: 2 }, { id: 3 }],
            totals: { total: 2 },
          },
        },
      });

    const component = await ForecastReportPage({
      searchParams: createSearchParams({
        startDate: "2026-05-01",
        endDate: "2026-05-31",
      }),
    });

    render(component);

    expect(screen.getByTestId("table-first")).toHaveTextContent(
      "rows:1 totals:1",
    );

    expect(screen.getByTestId("table-second")).toHaveTextContent(
      "rows:2 totals:1",
    );
  });

  it("should call fetchData with correct endpoints", async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [{ id: 1, nomeArquivo: "snap" }] })
      .mockResolvedValueOnce({
        data: {
          diario: { summary: [], totals: {} },
          grupo: { summary: [], totals: {} },
        },
      });

    await ForecastReportPage({
      searchParams: createSearchParams({}),
    });

    expect(mockFetch).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/forecast/snapshot"),
      {},
      "token",
      { cache: "no-store" },
    );

    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/forecast/snapshot/1"),
      {},
      "token",
      { cache: "no-store" },
    );
  });

  it("should handle undefined snapshot data safely", async () => {
    mockFetch.mockResolvedValueOnce({}).mockResolvedValueOnce({
      data: {
        diario: { summary: [], totals: {} },
        grupo: { summary: [], totals: {} },
      },
    });

    const component = await ForecastReportPage({
      searchParams: createSearchParams({}),
    });

    render(component);

    expect(screen.getByText("Nenhum relatório encontrado")).toBeInTheDocument();
  });
});
