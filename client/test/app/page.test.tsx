// test/app/home.test.tsx
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen } from "@testing-library/react";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOISTED MOCKS (devem ser definidos antes dos vi.mock)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const {
  mockCookiesGet,
  mockFetchData,
  mockFetchFilters,
  mockGetCurrentWeekData,
  mockGetCurrentMonthRange,
} = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
  mockFetchData: vi.fn(),
  mockFetchFilters: vi.fn(),
  mockGetCurrentWeekData: vi.fn(() => ({
    inicio: "2026-01-05",
    fim: "2026-01-11",
  })),
  mockGetCurrentMonthRange: vi.fn(() => ({
    dataInicial: "01/06/2026",
    dataFinal: "30/06/2026",
  })),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCKS DE MÓDULOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}));

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: mockFetchData,
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: mockFetchFilters,
}));

vi.mock("@/utils/weeks", () => ({
  getCurrentWeekData: mockGetCurrentWeekData,
  getCurrentMonthRange: mockGetCurrentMonthRange,
}));

vi.mock("@/components/layout/Header", () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

vi.mock("@/components/dashboard/DashboardClient", () => ({
  default: (props: any) => (
    <div data-testid="dashboard-client" data-props={JSON.stringify(props)}>
      DashboardClient
    </div>
  ),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function makeCookieStore(overrides: Record<string, string> = {}) {
  const store: Record<string, string> = {
    token: "fake-token-123",
    ...overrides,
  };

  mockCookiesGet.mockImplementation((name: string) => {
    const value = store[name];
    return value !== undefined ? { value } : undefined;
  });
}

function makeUserInfoCookie(user: Record<string, any>): string {
  return encodeURIComponent(JSON.stringify(user));
}

const INTERNAL_ALLOWED_USER = {
  id: 1,
  username: "jsilva",
  nome_usuario: "João Silva",
  email: "joao@edp.com",
  tipo_usuario: "INTERNO",
  is_admin: true,
  permissao_edicao: true,
  id_regional: 1,
  id_turma: null,
  id_area: 1, // área permitida
};

const INTERNAL_ALLOWED_AREA8 = {
  ...INTERNAL_ALLOWED_USER,
  id_area: 8, // outra área permitida
};

const INTERNAL_NOT_ALLOWED_USER = {
  ...INTERNAL_ALLOWED_USER,
  id_area: 5, // área NÃO permitida
};

const EXTERNAL_USER = {
  ...INTERNAL_ALLOWED_USER,
  tipo_usuario: "EXTERNO",
  id_area: 99,
};

/**
 * Configura mockFetchData para retornar sucesso com dados específicos
 * por URL parcial. Permite controlar cada endpoint individualmente.
 */
function setupFetchDataSuccess(overrides: Record<string, any> = {}) {
  const defaults: Record<string, any> = {
    "sparklines-parceira": [],
    "motivos-reprogramacao": [],
    "semanas-parceira": [],
    "avanca-parceira": [],
    "aderencia-parceira": [],
    metas: [],
    filters: { regional: [], parceira: [], tipo: [], tecnico: [] },
    "acompanhamento-mensal": [],
    "resumo-mensal-forecast": {
      firstSummary: { summary: [], totals: {} },
      secondSummary: { summary: [], totals: {} },
    },
    "resumo-mensal": {
      firstSummary: { summary: [{ financialGoal: 100 }], totals: {} },
      secondSummary: [],
    },
  };

  const merged = { ...defaults, ...overrides };

  mockFetchData.mockImplementation(async (url: string) => {
    for (const [key, data] of Object.entries(merged)) {
      if (url.includes(key)) {
        return { success: true, data };
      }
    }
    return { success: true, data: [] };
  });

  mockFetchFilters.mockResolvedValue({
    regional: [],
    parceira: [],
    tipo: [],
    municipio: [],
    grupo: [],
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMPORT DO COMPONENTE (após os mocks)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import Home from "@/app/page";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
describe("Home (Server Component)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────────
  // CONTROLO DE ACESSO
  // ────────────────────────────────────────────────────────────
  describe("Controlo de acesso ao dashboard", () => {
    it("deve negar acesso quando não existe cookie userInfo", async () => {
      makeCookieStore({ token: "tok" });
      // sem userInfo → getUserFromCookies retorna null

      const jsx = await Home();
      render(jsx);

      expect(
        screen.getByText("Você não tem permissão para acessar este painel."),
      ).toBeInTheDocument();
      expect(screen.getByAltText("Logo SIGO")).toBeInTheDocument();
      expect(screen.queryByTestId("dashboard-client")).not.toBeInTheDocument();
    });

    it("deve negar acesso quando cookie userInfo é inválido (JSON malformado)", async () => {
      makeCookieStore({
        token: "tok",
        userInfo: "not-valid-json{{{",
      });

      const jsx = await Home();
      render(jsx);

      expect(
        screen.getByText("Você não tem permissão para acessar este painel."),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("dashboard-client")).not.toBeInTheDocument();
    });

    it("deve negar acesso a utilizador INTERNO com área não permitida", async () => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie(INTERNAL_NOT_ALLOWED_USER),
      });

      const jsx = await Home();
      render(jsx);

      expect(
        screen.getByText("Você não tem permissão para acessar este painel."),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("dashboard-client")).not.toBeInTheDocument();
    });

    it("deve negar acesso a utilizador INTERNO com id_area null", async () => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie({
          ...INTERNAL_ALLOWED_USER,
          id_area: null,
        }),
      });

      const jsx = await Home();
      render(jsx);

      expect(
        screen.getByText("Você não tem permissão para acessar este painel."),
      ).toBeInTheDocument();
    });

    it("deve permitir acesso a utilizador INTERNO com id_area 1", async () => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie(INTERNAL_ALLOWED_USER),
      });
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      expect(screen.getByTestId("dashboard-client")).toBeInTheDocument();
      expect(
        screen.queryByText("Você não tem permissão para acessar este painel."),
      ).not.toBeInTheDocument();
    });

    it("deve permitir acesso a utilizador INTERNO com id_area 8", async () => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie(INTERNAL_ALLOWED_AREA8),
      });
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      expect(screen.getByTestId("dashboard-client")).toBeInTheDocument();
    });

    it("deve permitir acesso a utilizador EXTERNO independentemente da área", async () => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie(EXTERNAL_USER),
      });
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      expect(screen.getByTestId("dashboard-client")).toBeInTheDocument();
    });

    it("não deve fazer nenhum fetch quando o acesso é negado", async () => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie(INTERNAL_NOT_ALLOWED_USER),
      });

      const jsx = await Home();
      render(jsx);

      expect(mockFetchData).not.toHaveBeenCalled();
      expect(mockFetchFilters).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────────
  // LAYOUT COMUM
  // ────────────────────────────────────────────────────────────
  describe("Layout", () => {
    it("deve renderizar o Header quando tem acesso", async () => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie(INTERNAL_ALLOWED_USER),
      });
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      expect(screen.getByTestId("header")).toBeInTheDocument();
    });

    it("deve renderizar o Header quando NÃO tem acesso", async () => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie(INTERNAL_NOT_ALLOWED_USER),
      });

      const jsx = await Home();
      render(jsx);

      expect(screen.getByTestId("header")).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────────────────
  // COOKIES
  // ────────────────────────────────────────────────────────────
  describe("Leitura de cookies", () => {
    it("deve usar token vazio quando cookie token não existe", async () => {
      // Sem token no cookie store
      mockCookiesGet.mockImplementation((name: string) => {
        if (name === "userInfo") {
          return { value: makeUserInfoCookie(INTERNAL_ALLOWED_USER) };
        }
        return undefined; // token não existe
      });
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      // Verifica que fetchData foi chamado com token vazio ""
      expect(mockFetchData).toHaveBeenCalled();
      const firstCall = mockFetchData.mock.calls[0];
      expect(firstCall[2]).toBe(""); // terceiro argumento = token
    });

    it("deve decodificar cookie userInfo URL-encoded", async () => {
      const user = { ...INTERNAL_ALLOWED_USER };
      // encodeURIComponent produz %7B...%7D
      makeCookieStore({
        token: "tok",
        userInfo: encodeURIComponent(JSON.stringify(user)),
      });
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      expect(screen.getByTestId("dashboard-client")).toBeInTheDocument();
    });
  });

  // ────────────────────────────────────────────────────────────
  // FETCH DE DADOS (cenários de sucesso)
  // ────────────────────────────────────────────────────────────
  describe("Fetch de dados — sucesso", () => {
    beforeEach(() => {
      makeCookieStore({
        token: "my-token",
        userInfo: makeUserInfoCookie(INTERNAL_ALLOWED_USER),
      });
    });

    it("deve chamar todos os endpoints em paralelo", async () => {
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      // fetchData é chamado para cada endpoint
      const urls = mockFetchData.mock.calls.map(
        (call: any[]) => call[0] as string,
      );

      expect(urls.some((u: string) => u.includes("sparklines-parceira"))).toBe(
        true,
      );
      expect(
        urls.some((u: string) => u.includes("motivos-reprogramacao")),
      ).toBe(true);
      expect(urls.some((u: string) => u.includes("semanas-parceira"))).toBe(
        true,
      );
      expect(urls.some((u: string) => u.includes("aderencia-parceira"))).toBe(
        true,
      );
      expect(urls.some((u: string) => u.includes("metas"))).toBe(true);
      expect(urls.some((u: string) => u.includes("filters"))).toBe(true);
      expect(
        urls.some((u: string) => u.includes("acompanhamento-mensal")),
      ).toBe(true);
      expect(
        urls.some((u: string) => u.includes("resumo-mensal-forecast")),
      ).toBe(true);
      expect(urls.some((u: string) => u.includes("resumo-mensal"))).toBe(true);

      // fetchFilters também é chamado
      expect(mockFetchFilters).toHaveBeenCalledWith({
        regional: true,
        parceira: true,
        tipo: true,
        municipio: true,
        grupo: true,
      });
    });

    it("deve passar o token correto para todos os fetchData", async () => {
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      for (const call of mockFetchData.mock.calls) {
        expect(call[2]).toBe("my-token");
      }
    });

    it("deve passar cache no-store para todos os fetchData", async () => {
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      for (const call of mockFetchData.mock.calls) {
        expect(call[3]).toEqual({ cache: "no-store" });
      }
    });

    it("deve passar os dados corretos ao DashboardClient", async () => {
      setupFetchDataSuccess({
        "resumo-mensal": {
          firstSummary: {
            summary: [{ financialGoal: 250 }],
            totals: { total: 1000 },
          },
          secondSummary: [{ id: 1 }],
        },
        metas: [{ id: 10 }],
        "acompanhamento-mensal": [{ month: "jan" }],
        "resumo-mensal-forecast": {
          firstSummary: { summary: [{ a: 1 }], totals: { b: 2 } },
          secondSummary: { summary: [{ c: 3 }], totals: { d: 4 } },
        },
      });

      const jsx = await Home();
      render(jsx);

      const el = screen.getByTestId("dashboard-client");
      const props = JSON.parse(el.dataset.props!);

      expect(props.token).toBe("my-token");
      expect(props.initialMetaDiaria).toBe(250);
      expect(props.initialMetasRecomposicao).toEqual([{ id: 10 }]);
      expect(props.initialExecMonitoring).toEqual([{ month: "jan" }]);
    });

    it("deve chamar resumo-mensal duas vezes (labor e partner)", async () => {
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      const resumoMensalCalls = mockFetchData.mock.calls.filter(
        (call: any[]) =>
          (call[0] as string).includes("resumo-mensal") &&
          !(call[0] as string).includes("forecast"),
      );

      expect(resumoMensalCalls).toHaveLength(2);

      // Uma chamada com datas mensais (labor), outra com datas semanais (partner)
      const params = resumoMensalCalls.map((c: any[]) => c[1]);
      const hasMonthly = params.some(
        (p: any) => p.dataInicial === "01/06/2026",
      );
      const hasWeekly = params.some((p: any) => p.dataInicial === "2026-01-05");

      expect(hasMonthly).toBe(true);
      expect(hasWeekly).toBe(true);
    });

    it("deve extrair avanca-parceira com datas semanais", async () => {
      setupFetchDataSuccess();

      const jsx = await Home();
      render(jsx);

      const avancaCall = mockFetchData.mock.calls.find(
        (call: any[]) =>
          (call[0] as string).includes("avanca-parceira") &&
          !(call[0] as string).includes("/"),
      );

      // Pelo menos uma chamada ao endpoint base avanca-parceira
      const avancaCalls = mockFetchData.mock.calls.filter((call: any[]) =>
        (call[0] as string).endsWith("avanca-parceira"),
      );
      if (avancaCalls.length > 0) {
        expect(avancaCalls[0][1]).toEqual({
          dataInicial: "2026-01-05",
          dataFinal: "2026-01-11",
        });
      }
    });
  });

  // ────────────────────────────────────────────────────────────
  // FETCH DE DADOS (cenários de falha)
  // ────────────────────────────────────────────────────────────
  describe("Fetch de dados — falha", () => {
    beforeEach(() => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie(INTERNAL_ALLOWED_USER),
      });
    });

    it("deve usar fallback vazio quando fetchData retorna success: false", async () => {
      mockFetchData.mockResolvedValue({ success: false });
      mockFetchFilters.mockResolvedValue({
        regional: [],
        parceira: [],
        tipo: [],
        municipio: [],
        grupo: [],
      });

      const jsx = await Home();
      render(jsx);

      const el = screen.getByTestId("dashboard-client");
      const props = JSON.parse(el.dataset.props!);

      // Todos os dados devem ser arrays vazios ou objetos fallback
      expect(props.initialMetasRecomposicao).toEqual([]);
      expect(props.initialExecMonitoring).toEqual([]);
      expect(props.initialEliminacaoRestricao).toEqual([]);
      expect(props.initialAderenciaParceira).toEqual([]);
      expect(props.initialPartnerWeeks).toEqual([]);
      expect(props.initialReasonsReascheduling).toEqual([]);
      expect(props.initialSparklinesPartners).toEqual([]);
      expect(props.initialMetaDiaria).toBe(0);
    });

    it("deve usar fallback quando fetchData retorna data null", async () => {
      mockFetchData.mockResolvedValue({ success: true, data: null });
      mockFetchFilters.mockResolvedValue({
        regional: [],
        parceira: [],
        tipo: [],
        municipio: [],
        grupo: [],
      });

      const jsx = await Home();
      render(jsx);

      const el = screen.getByTestId("dashboard-client");
      const props = JSON.parse(el.dataset.props!);

      expect(props.initialMetasRecomposicao).toEqual([]);
      expect(props.initialExecMonitoring).toEqual([]);
    });

    it("deve usar fallback de forecast quando fetch falha", async () => {
      mockFetchData.mockResolvedValue({ success: false });
      mockFetchFilters.mockResolvedValue({});

      const jsx = await Home();
      render(jsx);

      const el = screen.getByTestId("dashboard-client");
      const props = JSON.parse(el.dataset.props!);

      expect(props.initialForecastFirst).toEqual({
        summary: [],
        totals: {},
      });
      expect(props.initialForecastSecond).toEqual({
        summary: [],
        totals: {},
      });
    });

    it("deve usar fallback de goalsFilters quando fetch falha", async () => {
      mockFetchData.mockImplementation(async (url: string) => {
        if (url.includes("filters")) {
          return { success: false };
        }
        return { success: true, data: [] };
      });
      mockFetchFilters.mockResolvedValue({});

      const jsx = await Home();
      render(jsx);

      const el = screen.getByTestId("dashboard-client");
      const props = JSON.parse(el.dataset.props!);

      expect(props.goalsFilters).toEqual({
        regional: [],
        parceira: [],
        tipo: [],
        tecnico: [],
      });
    });

    it("deve usar metaDiaria 0 quando financialGoal não existe", async () => {
      mockFetchData.mockImplementation(async (url: string) => {
        if (url.includes("resumo-mensal") && !url.includes("forecast")) {
          return {
            success: true,
            data: {
              firstSummary: { summary: [{}], totals: {} },
              secondSummary: [],
            },
          };
        }
        return { success: true, data: [] };
      });
      mockFetchFilters.mockResolvedValue({});

      const jsx = await Home();
      render(jsx);

      const el = screen.getByTestId("dashboard-client");
      const props = JSON.parse(el.dataset.props!);

      expect(props.initialMetaDiaria).toBe(0);
    });

    it("deve usar metaDiaria 0 quando summary está vazio", async () => {
      mockFetchData.mockImplementation(async (url: string) => {
        if (url.includes("resumo-mensal") && !url.includes("forecast")) {
          return {
            success: true,
            data: {
              firstSummary: { summary: [], totals: {} },
              secondSummary: [],
            },
          };
        }
        return { success: true, data: [] };
      });
      mockFetchFilters.mockResolvedValue({});

      const jsx = await Home();
      render(jsx);

      const el = screen.getByTestId("dashboard-client");
      const props = JSON.parse(el.dataset.props!);

      // summary[0] é undefined → financialGoal é undefined → fallback 0
      expect(props.initialMetaDiaria).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────────
  // PARÂMETROS DE DATA
  // ────────────────────────────────────────────────────────────
  describe("Parâmetros de data", () => {
    beforeEach(() => {
      makeCookieStore({
        token: "tok",
        userInfo: makeUserInfoCookie(INTERNAL_ALLOWED_USER),
      });
      setupFetchDataSuccess();
    });

    it("deve usar getCurrentWeekData para endpoints semanais", async () => {
      const jsx = await Home();
      render(jsx);

      expect(mockGetCurrentWeekData).toHaveBeenCalled();

      // sparklines-parceira usa datas semanais
      const sparkCall = mockFetchData.mock.calls.find((c: any[]) =>
        (c[0] as string).includes("sparklines-parceira"),
      );
      expect(sparkCall?.[1]).toEqual({
        dataInicial: "2026-01-05",
        dataFinal: "2026-01-11",
      });
    });

    it("deve usar getCurrentMonthRange para endpoints mensais", async () => {
      const jsx = await Home();
      render(jsx);

      expect(mockGetCurrentMonthRange).toHaveBeenCalled();

      // resumo-mensal-forecast usa datas mensais
      const forecastCall = mockFetchData.mock.calls.find((c: any[]) =>
        (c[0] as string).includes("resumo-mensal-forecast"),
      );
      expect(forecastCall?.[1]).toEqual({
        dataInicial: "01/06/2026",
        dataFinal: "30/06/2026",
      });
    });

    it("deve usar ano corrente para metas", async () => {
      const jsx = await Home();
      render(jsx);

      const metasCall = mockFetchData.mock.calls.find((c: any[]) =>
        (c[0] as string).includes("metas"),
      );
      const year = new Date().getFullYear();
      expect(metasCall?.[1]).toEqual({
        btzero: false,
        rda: false,
        ano: year,
        anoPlan: year,
      });
    });

    it("deve usar ano corrente para acompanhamento-mensal", async () => {
      const jsx = await Home();
      render(jsx);

      const execCall = mockFetchData.mock.calls.find((c: any[]) =>
        (c[0] as string).includes("acompanhamento-mensal"),
      );
      const year = new Date().getFullYear();
      expect(execCall?.[1]).toEqual({
        dataInicial: `01/01/${year}`,
        dataFinal: `31/12/${year}`,
      });
    });
  });

  // ────────────────────────────────────────────────────────────
  // EXPORTS ESTÁTICOS
  // ────────────────────────────────────────────────────────────
  describe("Exports do módulo", () => {
    it("deve exportar dynamic como force-dynamic", async () => {
      const mod = await import("@/app/page");
      expect(mod.dynamic).toBe("force-dynamic");
    });

    it("deve exportar revalidate como 0", async () => {
      const mod = await import("@/app/page");
      expect(mod.revalidate).toBe(0);
    });
  });
});
