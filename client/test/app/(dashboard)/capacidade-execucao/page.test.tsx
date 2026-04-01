import * as cookiesModule from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { render } from "@testing-library/react";
import ExecutionCapacity from "@/app/(dashboard)/capacidade-execucao/page";
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

vi.mock("@/components/executionCapacity/mainExecutionCapacity", () => ({
  __esModule: true,
  MainExecutionCapacity: vi.fn(({ data, token, filtersData, columns }) => (
    <div
      data-testid="main-execution-capacity"
      data-data={JSON.stringify(data.works)}
      data-filters={JSON.stringify(filtersData)}
      data-token={token}
      data-columns={JSON.stringify(columns)}
    >
      Main Execution Capacity
    </div>
  )),
}));

describe("Execution Capacity page", () => {
  const mockToken = "mock-token";
  const mockData = {
    works: [
      {
        regional: "SJC",
        parceira: "Engelmig",
        ano: "2025",
        tipo: "LM",
        qtd_equipes_rfp: "3",
      },
    ],
  };

  const mockFilters = {
    regional: ["Regional A", "Regional B"],
    parceira: ["Parceira 1", "Parceira 2"],
  };

  const mockParamsFilters = JSON.stringify({
    selectedItems: {
      idRegional: 1,
      idParceira: 2,
    },
  });

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      if (name === "executionCapacityFilters")
        return { value: mockParamsFilters };
      return null;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

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
    render(await ExecutionCapacity());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/capacidade-execucao",
      {
        idRegional: 1,
        idParceira: 2,
        ano: "2026",
      },
      mockToken,
      { cache: "no-store" },
    );
  });

  it("deve buscar dados apenas com a data atual quando não há cookie de filtros", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return null;
    });

    render(await ExecutionCapacity());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/capacidade-execucao",
      {
        ano: "2026",
      },
      mockToken,
      { cache: "no-store" },
    );
  });

  it("Deve disparar o componente de erro ErrorThrower ao ser retornado um erro da api", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name) => {
      if (name === "token") return { value: mockToken };
      return null;
    });

    vi.mocked(fetchData).mockResolvedValue({
      token: mockToken,
      data: mockData,
      success: false,
    });

    render(await ExecutionCapacity());

    expect(ErrorThrower).toHaveBeenCalled();
  });
});
