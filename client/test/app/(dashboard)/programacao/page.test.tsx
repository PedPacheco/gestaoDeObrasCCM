import * as cookiesModule from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { render, screen } from "@testing-library/react";
import Schedule from "@/app/(dashboard)/programacao/page";
import { Transform } from "@/utils/transform";
import dayjs from "dayjs";
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

vi.mock("@/components/scheduleComponents/schedule/MainSchedule", () => ({
  _esModule: true,
  default: vi.fn(({ data, columns, filtersData, token }) => (
    <div
      data-testid="main-schedule"
      data-data={JSON.stringify(data)}
      data-columns={JSON.stringify(columns)}
      data-filtersData={JSON.stringify(filtersData)}
      data-token={token}
    >
      Main Schedule componente
    </div>
  )),
}));

describe("Schedule page", () => {
  const mockToken = "mock-token";
  const mockData = [
    {
      turma: "Engelmig",
      planExec: "P/E",
      jan: { prog: 2323, exec: 2323 },
      fev: { prog: 1234, exec: 1234 },
    },
  ];

  const mockFilters = {
    regional: ["Regional A", "Regional B"],
    parceira: ["Parceira 1", "Parceira 2"],
    tipo: ["Tipo 1", "Tipo 2"],
    municipio: ["Cidade A", "Cidade B"],
    grupo: ["Grupo 1", "Grupo 2"],
    circuito: ["Circuito 1", "Circuito 2"],
  };

  const mockParamsFilters = JSON.stringify({
    selectedItems: {
      parceira: ["Parceira 1"],
      tipo: ["Tipo 1"],
    },
    ano: "2025",
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "scheduleFilters") return { value: mockParamsFilters };
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(dayjs("2025-01-01").toDate());

    vi.mocked(cookiesModule.cookies).mockReturnValue(mockCookieStore as any);

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
    render(await Schedule());

    expect(Transform).toHaveBeenCalledWith({
      parceira: ["Parceira 1"],
      tipo: ["Tipo 1"],
    });

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao",
      { tipo: "Tipo 1", parceira: "Parceira 1", ano: "2025" },
      mockToken
    );
  });

  it("Deve passar os dados corretamente para o componente MainSchedule", async () => {
    render(await Schedule());

    const mainSchedule = screen.getByTestId("main-schedule");

    expect(mainSchedule).toBeInTheDocument();

    expect(JSON.parse(mainSchedule.getAttribute("data-data") || "[]")).toEqual(
      mockData
    );
    expect(mainSchedule.getAttribute("data-token")).toBe("mock-token");
    expect(
      JSON.parse(mainSchedule.getAttribute("data-filtersData") || "")
    ).toEqual(mockFilters);
  });

  it("Deve lidar com ausência no cookie scheduleFilters e usar filtros vazios", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return undefined;
    });

    render(await Schedule());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/programacao",
      { ano: "2025" },
      mockToken
    );
  });

  it("deve buscar filtros com fetchFilters", async () => {
    render(await Schedule());
    expect(fetchFilters).toHaveBeenCalled();
  });

  it("Deve disparar o componente de erro ErrorThrower ao ser retornado um erro da api", async () => {
    vi.mocked(fetchData).mockResolvedValue({
      token: mockToken,
      data: mockData,
      success: false,
    });

    render(await Schedule());

    expect(ErrorThrower).toHaveBeenCalled();
  });
});
