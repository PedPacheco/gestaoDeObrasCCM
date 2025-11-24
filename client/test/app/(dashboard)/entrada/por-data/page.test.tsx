import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as moduleCookies from "next/headers";
import { render } from "@testing-library/react";
import EntryForDate from "@/app/(dashboard)/entrada/por-data/page";
import { Transform } from "@/utils/transform";
import dayjs from "dayjs";

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

vi.mock("@/components/entryComponents/entryByDate/MainEntryByDate", () => ({
  __esModule: true,
  default: vi.fn(({ data, token, filtersData, column }) => (
    <div
      data-testid="main entry by date"
      data-data={data}
      data-filters={filtersData}
      data-token={token}
      data-columns={column}
    >
      Main Entry by date
    </div>
  )),
}));

describe("EntryForDate", () => {
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
    circuito: ["Programado", "Executado"],
  };

  const mockParamsFiltes = JSON.stringify({
    selectedItems: {
      parceira: ["Parceira 1"],
      regional: ["Regional A"],
    },
    date: "17/05/2025",
    filterType: "day",
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "entryByDateFilters") return { value: mockParamsFiltes };
      return null;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-05-17"));

    vi.mocked(moduleCookies.cookies).mockResolvedValue(mockCookieStore as any);

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
    render(await EntryForDate());

    expect(Transform).toHaveBeenCalledWith({
      parceira: ["Parceira 1"],
      regional: ["Regional A"],
    });

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/entrada/data",
      {
        parceira: "Parceira 1",
        regional: "Regional A",
        data: dayjs("17/05/2025").format("DD/MM/YYYY"),
        tipoFiltro: "day",
      },
      mockToken
    );
  });

  it("deve buscar dados com o campo tipoFiltro definido para mês e a data com formato MM/YYYY", async () => {
    const modifiedData = JSON.stringify({
      ...JSON.parse(mockParamsFiltes),
      date: "05/2025",
      filterType: "month",
    });

    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "entryByDateFilters") return { value: modifiedData };
      return null;
    });

    render(await EntryForDate());

    expect(Transform).toHaveBeenCalledWith({
      parceira: ["Parceira 1"],
      regional: ["Regional A"],
    });

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/entrada/data",
      {
        parceira: "Parceira 1",
        regional: "Regional A",
        data: dayjs("05/2025").format("MM/YYYY"),
        tipoFiltro: "month",
      },
      mockToken
    );
  });

  it("deve buscar dados apenas com a data atual quando não há cookie de filtros", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return null;
    });

    render(await EntryForDate());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/entrada/data",
      {
        data: dayjs().format("DD/MM/YYYY"),
        tipoFiltro: "day",
      },
      mockToken
    );
  });
});
