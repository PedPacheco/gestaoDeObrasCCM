/**
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
// 🔹 Mocks
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("@/utils/transform", () => ({
  Transform: vi.fn(() => ({ transformed: true })),
}));

vi.mock(
  "@/components/scheduleComponents/monthlyForecastSummary/mainMonthlyForecastSummary",
  () => ({
    MainMonthlyForecastSummarySchedule: ({
      dataFirstSummary,
      dataSecondSummary,
      filtersData,
      token,
    }: any) => (
      <div data-testid="main-component">
        first:{dataFirstSummary?.length} second:{dataSecondSummary?.length}{" "}
        filters:{Object.keys(filtersData || {}).length} token:{token}
      </div>
    ),
  }),
);

vi.mock("@/theme/emotionCache", () => ({
  EmotionCacheProvider: ({ children }: any) => <div>{children}</div>,
}));

import { cookies } from "next/headers";
import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { Transform } from "@/utils/transform";
import MonthlyForecastSummary from "@/app/(dashboard)/programacao/resumo-mensal-forecast/page";

const mockCookies = cookies as unknown as ReturnType<typeof vi.fn>;
const mockFetchData = fetchData as unknown as ReturnType<typeof vi.fn>;
const mockFetchFilters = fetchFilters as unknown as ReturnType<typeof vi.fn>;
const mockTransform = Transform as unknown as ReturnType<typeof vi.fn>;

function mockCookieReturn(value?: string) {
  return {
    get: (key: string) => {
      if (key === "token") return { value: "token" };
      if (key === "monthlyForecastSummaryFilters")
        return value ? { value } : undefined;
      return undefined;
    },
  };
}

describe("MonthlyForecastSummary Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use default dates when no cookies are present", async () => {
    mockCookies.mockResolvedValue(mockCookieReturn());

    mockFetchFilters.mockResolvedValue({ a: 1 });
    mockFetchData.mockResolvedValue({
      data: { firstSummary: [], secondSummary: [] },
      token: "abc",
    });

    const component = await MonthlyForecastSummary();

    render(component);

    expect(mockTransform).toHaveBeenCalledWith({});

    expect(screen.getByTestId("main-component")).toHaveTextContent(
      "first:0 second:0",
    );
  });

  it("should use cookie params when provided", async () => {
    const cookieValue = JSON.stringify({
      selectedItems: { foo: "bar" },
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    });

    mockCookies.mockResolvedValue(mockCookieReturn(cookieValue));

    mockFetchFilters.mockResolvedValue({ a: 1 });
    mockFetchData.mockResolvedValue({
      data: { firstSummary: [{ id: 1 }], secondSummary: [{ id: 2 }] },
      token: "abc",
    });

    const component = await MonthlyForecastSummary();

    render(component);

    expect(mockTransform).toHaveBeenCalledWith({ foo: "bar" });

    expect(screen.getByTestId("main-component")).toHaveTextContent(
      "first:1 second:1",
    );
  });

  it("should call fetchFilters and fetchData correctly", async () => {
    mockCookies.mockResolvedValue(mockCookieReturn());

    mockFetchFilters.mockResolvedValue({ a: 1 });
    mockFetchData.mockResolvedValue({
      data: { firstSummary: [], secondSummary: [] },
      token: "abc",
    });

    await MonthlyForecastSummary();

    expect(mockFetchFilters).toHaveBeenCalledWith({
      regional: true,
      parceira: true,
      grupo: true,
      tipo: true,
    });

    expect(mockFetchData).toHaveBeenCalledWith(
      expect.stringContaining("/programacao/resumo-mensal-forecast"),
      expect.objectContaining({ dataInicial: expect.any(String) }),
      "token",
      { cache: "no-store" },
    );
  });

  it("should render main component with correct props", async () => {
    mockCookies.mockResolvedValue(mockCookieReturn());

    mockFetchFilters.mockResolvedValue({ x: 1, y: 2 });
    mockFetchData.mockResolvedValue({
      data: {
        firstSummary: [{}, {}],
        secondSummary: [{}],
      },
      token: "xyz",
    });

    const component = await MonthlyForecastSummary();

    render(component);

    expect(screen.getByTestId("main-component")).toHaveTextContent(
      "first:2 second:1 filters:2 token:xyz",
    );
  });

  it("should handle empty selectedItems safely", async () => {
    const cookieValue = JSON.stringify({});

    mockCookies.mockResolvedValue(mockCookieReturn(cookieValue));

    mockFetchFilters.mockResolvedValue({});
    mockFetchData.mockResolvedValue({
      data: { firstSummary: [], secondSummary: [] },
      token: "abc",
    });

    const component = await MonthlyForecastSummary();

    render(component);

    expect(mockTransform).toHaveBeenCalledWith({});
  });
});
