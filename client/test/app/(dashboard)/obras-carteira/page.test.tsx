import * as cookiesModule from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import WorksInPortfolio from "@/app/(dashboard)/obras-carteira/page";
import { Transform } from "@/utils/transform";
import { render } from "@testing-library/react";
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

vi.mock(
  "@/components/worksComponents/portfolioWorks/MainPortfolioWorks",
  () => ({
    __esModule: true,
    default: vi.fn(
      ({ data, token, filtersData, columns, totalValues, url, cookie }) => (
        <div
          data-testid="main-portfolio-works"
          data-data={JSON.stringify(data.works)}
          data-filters={JSON.stringify(filtersData)}
          data-token={token}
          data-columns={JSON.stringify(columns)}
          data-totalValues={totalValues}
          data-url={url}
          data-cookie={cookie}
        >
          Main Portofolio works
        </div>
      )
    ),
  })
);

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

describe("Works in portfolio page", () => {
  const mockToken = "mock-token";
  const mockData = {
    works: [
      {
        id: 1,
        ovnota: "123",
        ordemdiagrama: "12353545",
        ordem_dcd: "32344",
        ordem_dca: "2324543",
      },
    ],
  };

  const mockFilters = {
    regional: ["Regional A", "Regional B"],
    parceira: ["Parceira 1", "Parceira 2"],
    tipo: ["Tipo 1", "Tipo 2"],
    municipio: ["Cidade A", "Cidade B"],
    grupo: ["Grupo 1", "Grupo 2"],
    circuito: ["Circuito 1", "Circuito 2"],
    conjunto: ["Conjunto 1", "Conjunto 2"],
    status: ["Status 1", "Status 2"],
    ovnota: ["OV1", "OV2"],
    empreendimento: ["Empreendimento 1", "Empreendimento 2"],
  };

  const mockParamsFilters = JSON.stringify({
    selectedItems: {
      parceira: ["Parceira 1"],
      regional: ["Regional A"],
    },
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "portfolioWorksFilters") return { value: mockParamsFilters };
      return null;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

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
    render(await WorksInPortfolio());

    expect(Transform).toHaveBeenCalledWith({
      regional: ["Regional A"],
      parceira: ["Parceira 1"],
    });

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/obras/obras-carteira",
      {
        regional: "Regional A",
        parceira: "Parceira 1",
        page: "0",
      },
      mockToken,
      { cache: "no-store" }
    );
  });

  it("deve buscar dados apenas com a data atual quando não há cookie de filtros", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return null;
    });

    render(await WorksInPortfolio());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/obras/obras-carteira",
      {
        page: "0",
      },
      mockToken,
      { cache: "no-store" }
    );
  });
});
