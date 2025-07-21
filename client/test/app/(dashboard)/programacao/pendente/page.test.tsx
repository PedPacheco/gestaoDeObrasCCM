import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as cookiesModule from "next/headers";
import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { render, screen } from "@testing-library/react";
import PendingSchedule from "@/app/(dashboard)/programacao/pendente/page";
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
  "@/components/scheduleComponents/pendingSchedule/MainPendingSchedule",
  () => ({
    _esModule: true,
    default: vi.fn(({ data, columns, filtersData, token }) => (
      <div
        data-testid="main-pending-schedule"
        data-data={JSON.stringify(data)}
        data-columns={JSON.stringify(columns)}
        data-filtersData={JSON.stringify(filtersData)}
        data-token={token}
      >
        Main Pending Schedule component
      </div>
    )),
  })
);

describe("Pending schedule page", () => {
  const mockToken = "mock-token";
  const mockData = [
    {
      id: 1232,
      ovnota: "2324",
      ordemDiagrama: "43423",
      mun: "SJC",
    },
  ];

  const mockFilters = {
    regional: ["Regional A", "Regional B"],
    parceira: ["Parceira 1", "Parceira 2"],
  };

  const mockParamsFilters = JSON.stringify({
    selectedItems: {
      parceira: ["Parceira 1"],
      regional: ["Regional A"],
    },
    selectedYear: "2025",
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "pendingScheduleFilters")
        return { value: mockParamsFilters };
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(dayjs("2025-01-01").toDate());

    vi.mocked(cookiesModule.cookies).mockReturnValue(mockCookieStore as any);

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

  it("deve buscar dados com os filtros corretos quando cookie de filtros existe", async () => {
    render(await PendingSchedule());

    expect(Transform).toHaveBeenCalledWith({
      parceira: ["Parceira 1"],
      regional: ["Regional A"],
    });

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao/pendente",
      { regional: "Regional A", parceira: "Parceira 1", ano: "2025" },
      mockToken
    );
  });

  it("Deve passar os dados corretamente para o componente PendingSchedule", async () => {
    render(await PendingSchedule());

    const pendingSchedule = screen.getByTestId("main-pending-schedule");

    expect(pendingSchedule).toBeInTheDocument();

    expect(
      JSON.parse(pendingSchedule.getAttribute("data-data") || "[]")
    ).toEqual(mockData);
    expect(
      JSON.parse(pendingSchedule.getAttribute("data-filtersData") || "[]")
    ).toEqual(mockFilters);
    expect(pendingSchedule.getAttribute("data-token")).toBe(mockToken);
  });

  it("Deve lidar com ausência no cookie scheduleFilters e usar filtros vazios", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return undefined;
    });

    render(await PendingSchedule());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao/pendente",
      undefined,
      mockToken
    );
  });

  it("Deve lidar com ausência de filtro de ano no cookieParams", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "pendingScheduleFilters")
        return {
          value: JSON.stringify({
            selectedItems: {
              parceira: ["Parceira 1"],
              regional: ["Regional A"],
            },
          }),
        };
    });

    render(await PendingSchedule());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao/pendente",
      { regional: "Regional A", parceira: "Parceira 1", ano: "" },
      mockToken
    );
  });
});
