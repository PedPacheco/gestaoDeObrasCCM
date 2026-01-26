import dayjs from "dayjs";
import * as cookiesModule from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import ScheduleForDay from "@/app/(dashboard)/programacao/por-data/page";
import { Transform } from "@/utils/transform";
import { render, screen } from "@testing-library/react";
import { ErrorThrower } from "@/components/common/ErrorThrower";

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/components/common/ErrorThrower", () => ({
  __esModule: true,
  ErrorThrower: vi.fn(() => <div data-testid="error-thrower" />),
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
  "@/components/scheduleComponents/scheduleForDay/MainScheduleForDay",
  () => ({
    __esModule: true,
    default: vi.fn(({ data, token, filtersData, column }) => (
      <div
        data-testid="main-schedule-for-day"
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

describe("Schedule For Day Page", () => {
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
    tipo: ["Tipo 1", "Tipo 2"],
    municipio: ["Cidade A", "Cidade B"],
    grupo: ["Grupo 1", "Grupo 2"],
  };

  const mockParamsFiltes = JSON.stringify({
    selectedItems: {
      parceira: ["Parceira 1"],
      regional: ["Regional A"],
    },
    startDate: "17/05/2025",
    endDate: "18/05/2025",
    executed: "true",
    pending: "false",
    page: "0",
    ovnota: "1253",
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "scheduleForDayFilters") return { value: mockParamsFiltes };
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-17"));

    vi.mocked(cookiesModule.cookies).mockResolvedValue(mockCookieStore as any);

    vi.mocked(fetchData).mockResolvedValue({
      token: mockToken,
      data: mockData,
      success: true,
    });

    vi.mocked(fetchFilters).mockResolvedValue(mockFilters);

    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve buscar dados com os filtros corretos quando cookie de filtros existe", async () => {
    render(await ScheduleForDay());

    expect(Transform).toHaveBeenCalledWith({
      parceira: ["Parceira 1"],
      regional: ["Regional A"],
    });

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao/mensal",
      {
        parceira: "Parceira 1",
        regional: "Regional A",
        dataInicial: dayjs("17/05/2025").format("DD/MM/YYYY"),
        dataFinal: dayjs("18/05/2025").format("DD/MM/YYYY"),
        executado: "true",
        pendente: "false",
        page: "0",
        ovnota: "1253",
      },
      mockToken,
      { cache: "no-store" }
    );
  });

  it("deve buscar dados com os valores alterados caso os campos de filtro não tenham valor", async () => {
    const modifiedData = JSON.stringify({
      ...JSON.parse(mockParamsFiltes),
      startDate: "",
      endDate: "",
      executed: undefined,
      ovnota: "1234",
    });

    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "scheduleForDayFilters") return { value: modifiedData };
      return undefined;
    });

    render(await ScheduleForDay());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao/mensal",
      {
        parceira: "Parceira 1",
        regional: "Regional A",
        dataInicial: null,
        dataFinal: null,
        executado: "false",
        pendente: "false",
        page: "0",
        ovnota: "1234",
      },
      mockToken,
      { cache: "no-store" }
    );
  });

  it("Deve lidar com ausência de filtro de ano no cookieParams", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return undefined;
    });

    render(await ScheduleForDay());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao/mensal",
      {
        dataInicial: null,
        dataFinal: null,
        ovnota: "",
        executado: "false",
        pendente: "false",
        page: "0",
      },
      mockToken,
      { cache: "no-store" }
    );
  });

  it("Deve passar os dados corretamente para o componente ScheduleForDay", async () => {
    render(await ScheduleForDay());

    const scheduleForDay = screen.getByTestId("main-schedule-for-day");

    expect(scheduleForDay).toBeInTheDocument();

    expect(
      JSON.parse(scheduleForDay.getAttribute("data-data") || "[]")
    ).toEqual(mockData);
    expect(
      JSON.parse(scheduleForDay.getAttribute("data-filtersData") || "[]")
    ).toEqual(mockFilters);
    expect(scheduleForDay.getAttribute("data-token")).toBe(mockToken);
  });

  it("Deve disparar o componente de erro ErrorThrower ao ser retornado um erro da api", async () => {
    vi.mocked(fetchData).mockResolvedValue({
      token: mockToken,
      data: mockData,
      success: false,
    });

    render(await ScheduleForDay());

    expect(ErrorThrower).toHaveBeenCalled();
  });
});
