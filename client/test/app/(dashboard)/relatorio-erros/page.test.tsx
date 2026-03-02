import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

import * as cookiesModule from "next/headers";
import { fetchFilters } from "@/actions/fetchFilters.action";
import ErrorsReportPage from "@/app/(dashboard)/relatorios/relatorio-erros/page";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("@/components/reportErrors/errorDashboard", () => ({
  ErrorDashboard: vi.fn(({ regionalValues, token, initialParams }) => (
    <div
      data-testid="error-dashboard"
      data-regional={JSON.stringify(regionalValues)}
      data-token={token}
      data-params={JSON.stringify(initialParams)}
    >
      ErrorDashboard
    </div>
  )),
}));

describe("ErrorsReportPage (Server Component)", () => {
  const mockToken = "mock-token-123";
  const mockCookieParams = JSON.stringify({
    regionalId: 5,
  });

  const mockCookieStore = {
    get: vi.fn((name: string) => {
      if (name === "token") return { value: mockToken };
      if (name === "errorsReportFilter") return { value: mockCookieParams };
      return undefined;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(cookiesModule.cookies).mockResolvedValue(mockCookieStore as any);

    vi.mocked(fetchFilters).mockResolvedValue({
      regional: ["Vale do Paraíba", "Campinas", "Leste Paulista"],
    });
  });

  it("deve carregar filtros corretamente e repassar ao ErrorDashboard", async () => {
    render(await ErrorsReportPage());

    expect(fetchFilters).toHaveBeenCalledWith({
      regional: true,
    });

    const dashboard = screen.getByTestId("error-dashboard");

    expect(dashboard).toBeInTheDocument();
    expect(dashboard.getAttribute("data-regional")).toBe(
      JSON.stringify(["Vale do Paraíba", "Campinas", "Leste Paulista"]),
    );
  });

  it("deve repassar o token e os parâmetros vindos do cookie corretamente", async () => {
    render(await ErrorsReportPage());

    const dashboard = screen.getByTestId("error-dashboard");

    expect(dashboard.getAttribute("data-token")).toBe(mockToken);
    expect(dashboard.getAttribute("data-params")).toBe(mockCookieParams);
  });

  it("deve repassar undefined para params caso não exista cookie de filtros", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name: string) => {
      if (name === "token") return { value: mockToken };
      return undefined; // ← sem errorsReportFilter
    });

    render(await ErrorsReportPage());

    const dashboard = screen.getByTestId("error-dashboard");

    expect(dashboard.getAttribute("data-params")).toBeNull();
  });

  it("deve repassar uma string para params caso não exista cookie do token", async () => {
    vi.mocked(mockCookieStore.get).mockImplementation((name: string) => {
      return undefined; // ← sem errorsReportFilter
    });

    render(await ErrorsReportPage());

    const dashboard = screen.getByTestId("error-dashboard");

    expect(dashboard.getAttribute("data-token")).toBe("");
  });
});
