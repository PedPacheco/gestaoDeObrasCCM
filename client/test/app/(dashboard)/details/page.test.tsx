import Details from "@/app/(dashboard)/detalhes/[id]/page"; // ajuste o path conforme necessário
import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================
// MOCKS — todos declarados no topo para máxima performance
// ============================================================

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("@/theme/emotionCache", () => ({
  EmotionCacheProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="emotion-cache">{children}</div>
  ),
}));

vi.mock("@/components/details/workDetails/workDetails", () => ({
  WorkDetails: vi.fn(({ data, idWork, formattedData }) => (
    <div
      data-testid="work-details"
      data-id={idWork}
      data-entrada={formattedData.entrada}
      data-prazo={formattedData.prazo}
      data-prazo-final={formattedData.prazoFinal}
      data-conclusao={formattedData.data_conclusao}
      data-empreitamento={formattedData.dataEmpreitamento}
      data-bg={formattedData.backgroundColor}
      data-executado={formattedData.executadoFormatted}
    />
  )),
}));

vi.mock("@/components/details/tabPanel/TabPanel", () => ({
  __esModule: true,
  default: vi.fn(() => <div data-testid="tab-panel" />),
}));

vi.mock("@/components/common/ErrorThrower", () => ({
  ErrorThrower: vi.fn(({ message }) => (
    <div data-testid="error-thrower">{message}</div>
  )),
}));

vi.mock("@/utils/formatValue", () => ({
  formatPercentage: vi.fn((val: number | null) =>
    val != null ? `${(val * 100).toFixed(1)}%` : null,
  ),
}));

vi.mock("@/hooks/useFeedback", () => ({
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe("Details Page", () => {
  const mockId = "123";
  const mockCookieStore = {
    get: vi.fn(() => ({ value: "mock-token" })),
  };
// ============================================================
// HELPERS
// ============================================================

import { cookies } from "next/headers";
const mockCookies = vi.mocked(cookies);
const mockFetchData = vi.mocked(fetchData);
const mockFetchFilters = vi.mocked(fetchFilters);

const MOCK_OPTIONS = { restricoes: [], tecnicos: [], municipios: [] };

const buildWorkData = (overrides: Record<string, any> = {}) => ({
  success: true,
  data: {
    entrada: "2025-03-15",
    prazo: 90,
    data_conclusao: "2025-07-10",
    data_empreitamento: "2025-04-01",
    grupo: 1,
    ano_plan: 2025,
    executado: 0.75,
    ...overrides,
  },
});

const buildEmptyResponse = (overrides = {}) => ({
  success: true,
  data: {},
  ...overrides,
});

/**
 * Configura todos os mocks com valores padrão.
 * Aceita overrides para o workData (índice 1 do fetchData).
 */
const setupMocks = (workDataOverrides: Record<string, any> = {}) => {
  mockCookies.mockResolvedValue({
    get: vi.fn((name: string) =>
      name === "token" ? { value: "test-token" } : undefined,
    ),
  } as any);

  mockFetchFilters.mockResolvedValue(MOCK_OPTIONS as any);

  const workResponse = buildWorkData(workDataOverrides);

  // Ordem: workData, executionReport, rejections, feasibility, publicationRestriction
  mockFetchData
    .mockResolvedValueOnce(workResponse as any) // obras/:id
    .mockResolvedValueOnce(buildEmptyResponse() as any) // relatorio-execucao/:id
    .mockResolvedValueOnce(buildEmptyResponse() as any) // programacao/reprovacoes/:id
    .mockResolvedValueOnce(buildEmptyResponse() as any) // viabilidade/:id
    .mockResolvedValueOnce(buildEmptyResponse() as any); // restricao/publicacoes/:id
};

const renderPage = async (id = "123") => {
  return render(await Details({ params: Promise.resolve({ id }) }));
};

// ============================================================
// TESTES
// ============================================================

describe("Details Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  // ----------------------------------------------------------
  // Renderização base
  // ----------------------------------------------------------
  describe("Renderização", () => {
    it("deve renderizar WorkDetails e TabPanel quando os dados são válidos", async () => {
      setupMocks();
      await renderPage();

<<<<<<< HEAD
    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/obras/123",
      undefined,
      "mock-token",
      { cache: "no-store" },
    );
    expect(fetchData).toBeCalledTimes(4);
    expect(fetchFilters).toHaveBeenCalledWith({
      circuito: true,
      empreendimento: true,
      municipio: true,
      tipo: true,
      restricao: true,
      tecnico: true,
      parceira: true,
      status: true,
      tipoRestricao: ["EXECUÇÃO", "PROGRAMAÇÃO", "PUBLICAÇÃO"],
=======
      expect(screen.getByTestId("emotion-cache")).toBeInTheDocument();
      expect(screen.getByTestId("work-details")).toBeInTheDocument();
      expect(screen.getByTestId("tab-panel")).toBeInTheDocument();
    });

    it("deve renderizar ErrorThrower quando workData.success é false", async () => {
      mockCookies.mockResolvedValue({
        get: vi.fn(() => ({ value: "test-token" })),
      } as any);

      mockFetchFilters.mockResolvedValue(MOCK_OPTIONS as any);

      mockFetchData
        .mockResolvedValueOnce({
          success: false,
          message: "Obra não encontrada",
          data: null,
        } as any)
        .mockResolvedValueOnce(buildEmptyResponse() as any)
        .mockResolvedValueOnce(buildEmptyResponse() as any)
        .mockResolvedValueOnce(buildEmptyResponse() as any)
        .mockResolvedValueOnce(buildEmptyResponse() as any);

      await renderPage();

      const error = screen.getByTestId("error-thrower");
      expect(error).toBeInTheDocument();
      expect(error.textContent).toBe("Obra não encontrada");
      expect(screen.queryByTestId("work-details")).not.toBeInTheDocument();
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a
    });
  });

  // ----------------------------------------------------------
  // Formatação de datas
  // ----------------------------------------------------------
  describe("Formatação de datas", () => {
    it("deve formatar entrada, prazoFinal, data_conclusao e data_empreitamento", async () => {
      setupMocks({
        entrada: "2025-06-01",
        prazo: 30,
        data_conclusao: "2025-08-15",
        data_empreitamento: "2025-06-10",
      });

      await renderPage();

      const wd = screen.getByTestId("work-details");
      expect(wd.dataset.entrada).toBe("01/06/2025");
      expect(wd.dataset.prazo).toBe("30");
      expect(wd.dataset.prazoFinal).toBe("01/07/2025");
      expect(wd.dataset.conclusao).toBe("15/08/2025");
      expect(wd.dataset.empreitamento).toBe("10/06/2025");
    });

    it("deve usar dayjs() como fallback quando entrada é null", async () => {
      setupMocks({ entrada: null, prazo: 10 });

<<<<<<< HEAD
    const details = screen.getByTestId("work-details");
    expect(details.getAttribute("data-background")).toBe(
      "bg-green-600 text-zinc-100",
    );
  });
=======
      await renderPage();
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a

      const wd = screen.getByTestId("work-details");
      const expectedEntrada = dayjs().utc().format("DD/MM/YYYY");
      expect(wd.dataset.entrada).toBe(expectedEntrada);
    });

    it("deve retornar string vazia quando data_conclusao é null", async () => {
      setupMocks({ data_conclusao: null });

<<<<<<< HEAD
    const details = screen.getByTestId("work-details");
    expect(details.getAttribute("data-background")).toBe(
      "bg-red-600 text-zinc-100",
    );
  });
=======
      await renderPage();
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a

      const wd = screen.getByTestId("work-details");
      expect(wd.dataset.conclusao).toBe("");
    });

    it("deve retornar string vazia quando data_empreitamento é null", async () => {
      setupMocks({ data_empreitamento: null });

      await renderPage();

      const wd = screen.getByTestId("work-details");
      expect(wd.dataset.empreitamento).toBe("");
    });
  });

  // ----------------------------------------------------------
  // Cálculo do prazo
  // ----------------------------------------------------------
  describe("Cálculo do prazo", () => {
    it("deve usar prazo 0 quando prazo é undefined/falsy", async () => {
      setupMocks({ entrada: "2025-01-01", prazo: undefined });

      await renderPage();

      const wd = screen.getByTestId("work-details");
      // prazo 0 → prazoFinal === entrada
      expect(wd.dataset.prazo).toBe("0");
      expect(wd.dataset.prazoFinal).toBe("01/01/2025");
    });

    it("deve calcular prazoFinal corretamente com prazo grande", async () => {
      setupMocks({ entrada: "2025-01-01", prazo: 365 });

      await renderPage();

      const wd = screen.getByTestId("work-details");
      expect(wd.dataset.prazoFinal).toBe("01/01/2026");
    });
  });

  // ----------------------------------------------------------
  // Background color (getBackgroundColor)
  // ----------------------------------------------------------
  describe("Background color", () => {
    it("deve retornar string vazia quando grupo !== 2", async () => {
      setupMocks({ grupo: 1, ano_plan: dayjs().year() });

      await renderPage();

      expect(screen.getByTestId("work-details").dataset.bg).toBe("");
    });

    it("deve retornar bg-green quando grupo === 2 e ano_plan é o ano atual", async () => {
      setupMocks({ grupo: 2, ano_plan: dayjs().year() });

      await renderPage();

      expect(screen.getByTestId("work-details").dataset.bg).toBe(
        "bg-green-600 text-zinc-100",
      );
    });

    it("deve retornar bg-red quando grupo === 2 e ano_plan NÃO é o ano atual", async () => {
      setupMocks({ grupo: 2, ano_plan: 2020 });

      await renderPage();

      expect(screen.getByTestId("work-details").dataset.bg).toBe(
        "bg-red-600 text-zinc-100",
      );
    });
  });

  // ----------------------------------------------------------
  // Formatação do executado
  // ----------------------------------------------------------
  describe("Executado", () => {
    it("deve formatar executado como percentagem", async () => {
      setupMocks({ executado: 0.5 });

      await renderPage();

      expect(screen.getByTestId("work-details").dataset.executado).toBe(
        "50.0%",
      );
    });

    it("deve retornar string vazia quando executado é null", async () => {
      setupMocks({ executado: null });

      await renderPage();

      expect(screen.getByTestId("work-details").dataset.executado).toBe("");
    });
  });

  // ----------------------------------------------------------
  // Cookies e token
  // ----------------------------------------------------------
  describe("Cookies e autenticação", () => {
    it("deve passar o token para fetchData", async () => {
      setupMocks();
      await renderPage("456");

      // Todas as chamadas fetchData devem receber o token
      mockFetchData.mock.calls.forEach((call) => {
        expect(call[2]).toBe("test-token");
      });
    });

    it("deve funcionar quando o cookie token não existe", async () => {
      mockCookies.mockResolvedValue({
        get: vi.fn(() => undefined),
      } as any);

      mockFetchFilters.mockResolvedValue(MOCK_OPTIONS as any);

      mockFetchData
        .mockResolvedValueOnce(buildWorkData() as any)
        .mockResolvedValueOnce(buildEmptyResponse() as any)
        .mockResolvedValueOnce(buildEmptyResponse() as any)
        .mockResolvedValueOnce(buildEmptyResponse() as any)
        .mockResolvedValueOnce(buildEmptyResponse() as any);

      await renderPage();

      // token deve ser undefined
      mockFetchData.mock.calls.forEach((call) => {
        expect(call[2]).toBeUndefined();
      });

      expect(screen.getByTestId("work-details")).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // Chamadas de API
  // ----------------------------------------------------------
  describe("Chamadas de API", () => {
    it("deve chamar fetchFilters com os parâmetros corretos", async () => {
      setupMocks();
      await renderPage();

      expect(mockFetchFilters).toHaveBeenCalledWith({
        restricao: true,
        tipoRestricao: ["EXECUÇÃO", "PROGRAMAÇÃO", "PUBLICAÇÃO", "REPROVADO"],
        tecnico: true,
        municipio: true,
        parceira: true,
        circuito: true,
        status: true,
        empreendimento: true,
        tipo: true,
      });
    });

    it("deve chamar fetchData com as URLs corretas", async () => {
      setupMocks();
      await renderPage("789");

      const urls = mockFetchData.mock.calls.map((call) => call[0]);

      expect(urls).toEqual([
        "https://api.example.com/obras/789",
        "https://api.example.com/relatorio-execucao/789",
        "https://api.example.com/programacao/reprovacoes/789",
        "https://api.example.com/viabilidade/789",
        "https://api.example.com/restricao/publicacoes/789",
      ]);
    });

    it("deve passar { cache: 'no-store' } em todas as chamadas fetchData", async () => {
      setupMocks();
      await renderPage();

      mockFetchData.mock.calls.forEach((call) => {
        expect(call[3]).toEqual({ cache: "no-store" });
      });
    });

    it("deve executar todas as chamadas em paralelo (6 chamadas totais)", async () => {
      setupMocks();
      await renderPage();

      expect(mockFetchFilters).toHaveBeenCalledTimes(1);
      expect(mockFetchData).toHaveBeenCalledTimes(5);
    });
  });

  // ----------------------------------------------------------
  // Params
  // ----------------------------------------------------------
  describe("Params", () => {
    it("deve converter o id para Number ao passar para WorkDetails", async () => {
      setupMocks();
      await renderPage("42");

      expect(screen.getByTestId("work-details").dataset.id).toBe("42");
    });
  });
});
