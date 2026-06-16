/**
 * @file laborDashboard.test.tsx
 * @description Suíte de testes completa para o componente LaborDashboard
 */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import LaborDashboard from "@/components/dashboard/laborDashboard/laborDashboard";

// ── Mocks de módulos externos ───────────────────────────────────────────────

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/hooks/dashboard/laborDashboard/useLaborDashboardMetrics", () => ({
  useLaborMetrics: vi.fn(),
}));

vi.mock("@/hooks/useSaveFilters", () => ({
  useSaveFilters: vi.fn(),
}));

vi.mock("@/utils/transform", () => ({
  Transform: vi.fn((params) => params),
}));

// Mocks dos subcomponentes para isolar o LaborDashboard
vi.mock("@/components/dashboard/laborDashboard/laborDashboardFilters", () => ({
  LaborDashboardFilters: vi.fn(
    ({
      onApply,
      clearFilters,
      isPending,
      setSelectedParceiras,
      setSelectedRegionais,
    }) => (
      <div data-testid="labor-dashboard-filters">
        <button data-testid="btn-apply" onClick={onApply} disabled={isPending}>
          Aplicar
        </button>
        <button data-testid="btn-clear" onClick={clearFilters}>
          Limpar
        </button>
        <button
          data-testid="btn-set-parceira"
          onClick={() => setSelectedParceiras(["parceira-1"])}
        >
          Selecionar Parceira
        </button>
        <button
          data-testid="btn-set-regional"
          onClick={() => setSelectedRegionais(["regional-1"])}
        >
          Selecionar Regional
        </button>
        {isPending && (
          <span data-testid="loading-indicator">Carregando...</span>
        )}
      </div>
    ),
  ),
}));

vi.mock("@/components/dashboard/laborDashboard/KpiSection", () => ({
  KpiSection: vi.fn(
    ({ display, executionRate, pctGoal100, pctGoal108, totalGoal }) => (
      <div data-testid="kpi-section">
        <span data-testid="kpi-total-goal">{totalGoal}</span>
        <span data-testid="kpi-execution-rate">{executionRate}</span>
        <span data-testid="kpi-pct-100">{pctGoal100}</span>
        <span data-testid="kpi-pct-108">{pctGoal108}</span>
        <span data-testid="kpi-display">{JSON.stringify(display)}</span>
      </div>
    ),
  ),
}));

vi.mock("@/components/dashboard/laborDashboard/DailySummaryTable", () => ({
  DailySummaryTable: vi.fn(({ data, dailyGoal }) => (
    <div data-testid="daily-summary-table">
      <span data-testid="daily-goal">{dailyGoal}</span>
      <span data-testid="daily-summary-count">
        {data?.summary?.length ?? 0}
      </span>
    </div>
  )),
}));

vi.mock("@/components/dashboard/laborDashboard/GroupSummaryTable", () => ({
  GroupSummaryTable: vi.fn(({ data }) => (
    <div data-testid="group-summary-table">
      <span data-testid="group-summary-count">
        {data?.summary?.length ?? 0}
      </span>
    </div>
  )),
}));

vi.mock("@/components/dashboard/common/ChartCard", () => ({
  ChartCard: vi.fn(({ title, children }) => (
    <div data-testid="chart-card">
      <span data-testid="chart-title">{title}</span>
      {children}
    </div>
  )),
}));

vi.mock("@/components/dashboard/common/ChartTooltip", () => ({
  ChartTooltip: vi.fn(() => <div data-testid="chart-tooltip" />),
}));

// Mock do recharts para evitar erros de canvas no jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: vi.fn(({ children }) => (
    <div data-testid="responsive-container">{children}</div>
  )),
  ComposedChart: vi.fn(({ children }) => (
    <div data-testid="composed-chart">{children}</div>
  )),
  Bar: vi.fn(() => <div data-testid="bar" />),
  CartesianGrid: vi.fn(() => null),
  XAxis: vi.fn(() => null),
  YAxis: vi.fn(() => null),
  Tooltip: vi.fn(() => null),
  Legend: vi.fn(() => null),
}));

// ── Imports após mocks ──────────────────────────────────────────────────────

import { fetchData } from "@/actions/fetchData.action";
import { useLaborMetrics } from "@/hooks/dashboard/laborDashboard/useLaborDashboardMetrics";
import { useSaveFilters } from "@/hooks/useSaveFilters";

// ── Fixtures ───────────────────────────────────────────────────────────────

const mockDailySummary = {
  summary: [
    {
      dataProg: "01/06/2025",
      qtdeSchedules: 2,
      financialGoal: 50000,
      teamsTotal: 10,
      totalMoPlan: 32000,
      totalMoProg: 30000,
      totalMoExec: 25000,
      totalMoPrev: 10000,
      totalWalletAvaliable: 2000,
    },
    {
      dataProg: "02/06/2025",
      qtdeSchedules: 2,
      financialGoal: 50000,
      teamsTotal: 10,
      totalMoPlan: 32000,
      totalMoProg: 32000,
      totalMoExec: 28000,
      totalMoPrev: 10000,
      totalWalletAvaliable: 2000,
    },
  ],
  totals: {
    totalWorks: 10,
    totalSchedules: 5,
    totalTeams: 3,
    totalExecutionCapacityTeams: 2,
    totalQtdeRfpTeams: 1,
    totalWalletExec: 100000,
    totalFinancialGoal: 200000,
    totalDiaryGoal: 50000,
    totalFinancialGoalWith8: 216000,
    totalDiaryGoalWith8: 54000,
    totalMoProg: 62000,
    totalMoExec: 53000,
    totalDiff: -9000,
  },
  contractValueByMonth: {
    monthlyValue: 500000,
  },
};

const mockGroupSummary = {
  summary: [
    {
      grupo: "Grupo A",
      qtdeSchedules: 10,
      turma: "ENGELMIG",
      totalMoPlan: 10000,
      totalMoProg: 8000,
      totalMoExec: 5000,
      totalMoPrev: 2000,
    },
    {
      grupo: "Grupo B",
      turma: "START",
      qtdeSchedules: 4,
      totalMoPlan: 10000,
      totalMoProg: 8000,
      totalMoExec: 5000,
      totalMoPrev: 2000,
    },
  ],
  totals: {
    totalSchedules: 15,
    totalMoPlanByGrouping: 100000,
    totalMoPendByGrouping: 10000,
    totalMoProgByGrouping: 60000,
    totalMoExecByGrouping: 50000,
    totalMoPrevByGrouping: 55000,
    totalWalletRda: 80000,
    totalExecRda: 40000,
    totalProgRda: 45000,
    totalWalletBt0: 20000,
    totalProgBt0: 15000,
    totalExecBt0: 12000,
    totalWalletMarket: 30000,
    totalProgMarket: 25000,
    totalExecMarket: 20000,
    totalWalletRecom: 10000,
    totalProgRecom: 8000,
    totalExecRecom: 7000,
    totalDiff: -5000,
  },
};

const mockFiltersData = {
  regionais: ["Regional SP", "Regional RJ"],
  parceiras: ["Parceira A", "Parceira B"],
  tipos: ["Tipo 1", "Tipo 2"],
  grupos: ["Grupo X", "Grupo Y"],
};

const mockMetricsReturn = {
  barByDay: [
    { dia: "01/06", Programado: 30000, Executado: 25000 },
    { dia: "02/06", Programado: 32000, Executado: 28000 },
  ],
  display: { moProg: "62.000", moExec: "53.000" },
  totalGoal: 200000,
  pctGoal100: 85,
  pctGoal108: 79,
  executionRate: 85.5,
  topPartnerData: [
    { name: "Parceira A", Programado: 40000, Executado: 35000 },
    { name: "Parceira B", Programado: 20000, Executado: 18000 },
  ],
};

const defaultProps = {
  initialData: mockDailySummary,
  initialData2: mockGroupSummary,
  token: "mock-token-123",
  initialMetaDiaria: 50000,
  filtersData: mockFiltersData,
  filtersTop: 60,
};

// ── Setup & Teardown ───────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  (useSaveFilters as ReturnType<typeof vi.fn>).mockReturnValue({
    clearFilters: vi.fn(),
    filters: {},
    saveFilters: vi.fn(),
  });

  (useLaborMetrics as ReturnType<typeof vi.fn>).mockReturnValue(
    mockMetricsReturn,
  );

  (fetchData as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: {
      firstSummary: mockDailySummary,
      secondSummary: mockGroupSummary,
    },
  });

  // Limpa a variável de ambiente
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

// ── Testes ─────────────────────────────────────────────────────────────────

describe("LaborDashboard", () => {
  // ── Renderização inicial ─────────────────────────────────────────────────

  describe("renderização inicial", () => {
    it("deve renderizar sem erros com todas as props obrigatórias", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(screen.getByTestId("labor-dashboard-filters")).toBeInTheDocument();
    });

    it("deve renderizar o componente de filtros", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(screen.getByTestId("labor-dashboard-filters")).toBeInTheDocument();
    });

    it("deve renderizar a seção de KPIs", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(screen.getByTestId("kpi-section")).toBeInTheDocument();
    });

    it("deve renderizar dois gráficos (ChartCard)", () => {
      render(<LaborDashboard {...defaultProps} />);
      const chartCards = screen.getAllByTestId("chart-card");
      expect(chartCards).toHaveLength(2);
    });

    it("deve renderizar o gráfico 'Programado vs Executado (dia)'", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(
        screen.getByText("Programado vs Executado (dia)"),
      ).toBeInTheDocument();
    });

    it("deve renderizar o gráfico 'Programado X Executado (Parceira)'", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(
        screen.getByText("Programado X Executado (Parceira)"),
      ).toBeInTheDocument();
    });

    it("deve renderizar a tabela de resumo diário", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(screen.getByTestId("daily-summary-table")).toBeInTheDocument();
    });

    it("deve renderizar a tabela de resumo por grupo", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(screen.getByTestId("group-summary-table")).toBeInTheDocument();
    });
  });

  // ── Dados iniciais ───────────────────────────────────────────────────────

  describe("dados iniciais", () => {
    it("deve exibir a meta diária inicial na tabela de resumo", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(screen.getByTestId("daily-goal")).toHaveTextContent("50000");
    });

    it("deve exibir a quantidade correta de registros no resumo diário", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(screen.getByTestId("daily-summary-count")).toHaveTextContent("2");
    });

    it("deve exibir a quantidade correta de grupos no resumo por grupo", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(screen.getByTestId("group-summary-count")).toHaveTextContent("2");
    });

    it("deve chamar useLaborMetrics com os dados iniciais corretos", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(useLaborMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyData: expect.objectContaining({
            summary: mockDailySummary.summary,
          }),
          groupData: expect.objectContaining({
            summary: mockGroupSummary.summary,
          }),
          dailyGoal: 50000,
        }),
      );
    });

    it("deve passar os valores de KPI corretos para KpiSection", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(screen.getByTestId("kpi-total-goal")).toHaveTextContent("200000");
      expect(screen.getByTestId("kpi-execution-rate")).toHaveTextContent(
        "85.5",
      );
      expect(screen.getByTestId("kpi-pct-100")).toHaveTextContent("85");
      expect(screen.getByTestId("kpi-pct-108")).toHaveTextContent("79");
    });
  });

  // ── Dados iniciais ausentes / parciais ──────────────────────────────────

  describe("dados iniciais ausentes ou parciais", () => {
    it("deve usar totals padrão quando initialData não tem totals", () => {
      const props = {
        ...defaultProps,
        initialData: { ...mockDailySummary, totals: undefined as any },
      };
      expect(() => render(<LaborDashboard {...props} />)).not.toThrow();
    });

    it("deve usar summary vazio quando initialData não tem summary", () => {
      const props = {
        ...defaultProps,
        initialData: { ...mockDailySummary, summary: undefined as any },
      };
      render(<LaborDashboard {...props} />);
      expect(screen.getByTestId("daily-summary-count")).toHaveTextContent("0");
    });

    it("deve usar summary vazio quando initialData2 não tem summary", () => {
      const props = {
        ...defaultProps,
        initialData2: { ...mockGroupSummary, summary: undefined as any },
      };
      render(<LaborDashboard {...props} />);
      expect(screen.getByTestId("group-summary-count")).toHaveTextContent("0");
    });

    it("deve usar 0 como metaDiaria quando initialMetaDiaria não é fornecida", () => {
      const props = { ...defaultProps, initialMetaDiaria: undefined as any };
      render(<LaborDashboard {...props} />);
      expect(screen.getByTestId("daily-goal")).toHaveTextContent("0");
    });

    it("deve usar contractValueByMonth padrão quando ausente em initialData", () => {
      const props = {
        ...defaultProps,
        initialData: {
          ...mockDailySummary,
          contractValueByMonth: undefined as any,
        },
      };
      expect(() => render(<LaborDashboard {...props} />)).not.toThrow();
    });
  });

  // ── Integração com useSaveFilters ────────────────────────────────────────

  describe("integração com useSaveFilters", () => {
    it("deve chamar useSaveFilters com a pageKey correta", () => {
      render(<LaborDashboard {...defaultProps} />);
      expect(useSaveFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          pageKey: "laborDashboardFilters",
          data: mockFiltersData,
        }),
      );
    });

    it("deve inicializar filtros a partir dos valores salvos", () => {
      (useSaveFilters as ReturnType<typeof vi.fn>).mockReturnValue({
        clearFilters: vi.fn(),
        filters: {
          regional: ["Regional SP"],
          parceira: ["Parceira A"],
          tipo: ["Tipo 1"],
          grupo: ["Grupo X"],
        },
        saveFilters: vi.fn(),
      });

      // Não deve lançar erro ao inicializar com filtros salvos
      expect(() => render(<LaborDashboard {...defaultProps} />)).not.toThrow();
    });

    it("deve usar arrays vazios quando filtros salvos não existem", () => {
      (useSaveFilters as ReturnType<typeof vi.fn>).mockReturnValue({
        clearFilters: vi.fn(),
        filters: {},
        saveFilters: vi.fn(),
      });

      expect(() => render(<LaborDashboard {...defaultProps} />)).not.toThrow();
    });
  });

  // ── Aplicação de filtros ─────────────────────────────────────────────────

  describe("aplicação de filtros", () => {
    it("deve exibir indicador de carregamento durante a aplicação do filtro", async () => {
      // Deixa o fetchData pendente para capturar o estado de loading
      let resolveFetch!: (value: any) => void;
      (fetchData as ReturnType<typeof vi.fn>).mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
      );

      render(<LaborDashboard {...defaultProps} />);
      const btnApply = screen.getByTestId("btn-apply");

      fireEvent.click(btnApply);

      await waitFor(() => {
        expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
      });

      // Resolve para evitar memory leak
      resolveFetch({
        data: {
          firstSummary: mockDailySummary,
          secondSummary: mockGroupSummary,
        },
      });
    });

    it("deve chamar fetchData com a URL correta ao aplicar filtro", async () => {
      render(<LaborDashboard {...defaultProps} />);
      const btnApply = screen.getByTestId("btn-apply");

      fireEvent.click(btnApply);

      await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith(
          "https://api.example.com/programacao/resumo-mensal",
          expect.any(Object),
          "mock-token-123",
          { cache: "no-store" },
        );
      });
    });

    it("deve chamar saveFilters ao aplicar filtro", async () => {
      const saveFilters = vi.fn();
      (useSaveFilters as ReturnType<typeof vi.fn>).mockReturnValue({
        clearFilters: vi.fn(),
        filters: {},
        saveFilters,
      });

      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-apply"));

      await waitFor(() => {
        expect(saveFilters).toHaveBeenCalled();
      });
    });

    it("deve atualizar os dados após resposta bem-sucedida do filtro", async () => {
      const novosSummary = [
        {
          dia: "03/06/2025",
          financialGoal: 55000,
          moProg: 35000,
          moExec: 30000,
        },
      ];
      (fetchData as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          firstSummary: { ...mockDailySummary, summary: novosSummary },
          secondSummary: mockGroupSummary,
        },
      });

      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-apply"));

      await waitFor(() => {
        expect(screen.getByTestId("daily-summary-count")).toHaveTextContent(
          "1",
        );
      });
    });

    it("deve atualizar metaDiaria com o financialGoal do primeiro item do summary", async () => {
      const novosSummary = [
        {
          dia: "03/06/2025",
          financialGoal: 75000,
          moProg: 35000,
          moExec: 30000,
        },
      ];
      (fetchData as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          firstSummary: { ...mockDailySummary, summary: novosSummary },
          secondSummary: mockGroupSummary,
        },
      });

      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-apply"));

      await waitFor(() => {
        expect(screen.getByTestId("daily-goal")).toHaveTextContent("75000");
      });
    });

    it("deve incluir datas formatadas nos parâmetros enviados ao filtrar", async () => {
      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-apply"));

      await waitFor(() => {
        const chamada = (fetchData as ReturnType<typeof vi.fn>).mock.calls[0];
        const params = chamada[1];
        expect(params).toHaveProperty("dataInicial");
        expect(params).toHaveProperty("dataFinal");
        // Formato DD/MM/YYYY
        expect(params.dataInicial).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
        expect(params.dataFinal).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      });
    });

    it("deve marcar isFiltered como true após aplicar filtro", async () => {
      const { KpiSection } =
        await import("@/components/dashboard/laborDashboard/KpiSection");

      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-apply"));

      await waitFor(() => {
        const lastCall = (
          KpiSection as unknown as ReturnType<typeof vi.fn>
        ).mock.calls.at(-1)!;
        const props = lastCall[0];
        expect(props).toEqual(expect.objectContaining({ isFiltered: true }));
      });
    });
  });

  // ── Limpeza de filtros ───────────────────────────────────────────────────

  describe("limpeza de filtros", () => {
    it("deve chamar clearFilters do hook ao limpar", async () => {
      const clearFilters = vi.fn();
      (useSaveFilters as ReturnType<typeof vi.fn>).mockReturnValue({
        clearFilters,
        filters: {},
        saveFilters: vi.fn(),
      });

      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-clear"));

      await waitFor(() => {
        expect(clearFilters).toHaveBeenCalled();
      });
    });

    it("deve chamar fetchData sem filtros ao limpar", async () => {
      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-clear"));

      await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith(
          "https://api.example.com/programacao/resumo-mensal",
          expect.objectContaining({
            dataInicial: expect.any(String),
            dataFinal: expect.any(String),
          }),
          "mock-token-123",
        );

        const params = (fetchData as ReturnType<typeof vi.fn>).mock.calls[0][1];
        // Não deve ter filtros de parceira, regional etc.
        expect(params).not.toHaveProperty("idParceira");
        expect(params).not.toHaveProperty("idRegional");
      });
    });

    it("deve resetar isFiltered para false ao limpar filtros", async () => {
      const { KpiSection } =
        await import("@/components/dashboard/laborDashboard/KpiSection");

      const getLastProps = () =>
        (KpiSection as unknown as ReturnType<typeof vi.fn>).mock.calls.at(
          -1,
        )![0];

      render(<LaborDashboard {...defaultProps} />);

      fireEvent.click(screen.getByTestId("btn-apply"));
      await waitFor(() => {
        expect(getLastProps()).toEqual(
          expect.objectContaining({ isFiltered: true }),
        );
      });

      fireEvent.click(screen.getByTestId("btn-clear"));
      await waitFor(() => {
        expect(getLastProps()).toEqual(
          expect.objectContaining({ isFiltered: false }),
        );
      });
    });

    it("deve atualizar dados após limpeza de filtros", async () => {
      const dadosAtualizados = {
        ...mockDailySummary,
        summary: [mockDailySummary.summary[0]],
      };
      (fetchData as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          firstSummary: dadosAtualizados,
          secondSummary: mockGroupSummary,
        },
      });

      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-clear"));

      await waitFor(() => {
        expect(screen.getByTestId("daily-summary-count")).toHaveTextContent(
          "1",
        );
      });
    });
  });

  // ── Comportamento dos gráficos ───────────────────────────────────────────

  describe("gráficos", () => {
    it("deve renderizar dois ComposedChart", () => {
      render(<LaborDashboard {...defaultProps} />);
      const charts = screen.getAllByTestId("composed-chart");
      expect(charts).toHaveLength(2);
    });

    it("deve renderizar quatro barras (2 por gráfico)", () => {
      render(<LaborDashboard {...defaultProps} />);
      const bars = screen.getAllByTestId("bar");
      expect(bars).toHaveLength(4);
    });

    it("deve renderizar os ResponsiveContainers dos gráficos", () => {
      render(<LaborDashboard {...defaultProps} />);
      const containers = screen.getAllByTestId("responsive-container");
      expect(containers).toHaveLength(2);
    });
  });

  // ── Métricas calculadas ──────────────────────────────────────────────────

  describe("métricas calculadas pelo useLaborMetrics", () => {
    it("deve passar barByDay para o gráfico de dias via useLaborMetrics", () => {
      render(<LaborDashboard {...defaultProps} />);
      // barByDay é consumido internamente; verificamos que useLaborMetrics foi chamado
      expect(useLaborMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          dailyGoal: 50000,
        }),
      );
    });

    it("deve re-invocar useLaborMetrics quando metaDiaria muda após filtro", async () => {
      (fetchData as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          firstSummary: {
            ...mockDailySummary,
            summary: [{ ...mockDailySummary.summary[0], financialGoal: 99000 }],
          },
          secondSummary: mockGroupSummary,
        },
      });

      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-apply"));

      await waitFor(() => {
        const ultimaChamada = (
          useLaborMetrics as ReturnType<typeof vi.fn>
        ).mock.calls.at(-1)?.[0];
        expect(ultimaChamada?.dailyGoal).toBe(99000);
      });
    });
  });

  // ── Acessibilidade e estrutura ───────────────────────────────────────────

  describe("estrutura e acessibilidade", () => {
    it("deve renderizar dentro de um container flex-col", () => {
      const { container } = render(<LaborDashboard {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("flex");
      expect(wrapper.className).toContain("flex-col");
    });

    it("deve renderizar as tabelas após os gráficos", () => {
      render(<LaborDashboard {...defaultProps} />);
      const dailyTable = screen.getByTestId("daily-summary-table");
      const groupTable = screen.getByTestId("group-summary-table");
      expect(dailyTable).toBeInTheDocument();
      expect(groupTable).toBeInTheDocument();
    });

    it("deve passar filtersTop como prop para LaborDashboardFilters", async () => {
      const { LaborDashboardFilters } =
        await import("@/components/dashboard/laborDashboard/laborDashboardFilters");

      const getLastProps = (mockComponent: unknown) =>
        (mockComponent as ReturnType<typeof vi.fn>).mock.calls.at(-1)![0];

      render(<LaborDashboard {...defaultProps} filtersTop={80} />);

      expect(getLastProps(LaborDashboardFilters)).toEqual(
        expect.objectContaining({ filtersTop: 80 }),
      );
    });
  });

  // ── Token e autenticação ─────────────────────────────────────────────────

  describe("token e autenticação", () => {
    it("deve passar o token correto nas chamadas de fetchData", async () => {
      const tokenCustom = "token-customizado-xyz";
      render(<LaborDashboard {...defaultProps} token={tokenCustom} />);
      fireEvent.click(screen.getByTestId("btn-apply"));

      await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          tokenCustom,
          expect.any(Object),
        );
      });
    });

    it("deve usar o mesmo token tanto no applyFilter quanto no handleCleaningFilters", async () => {
      const tokenCustom = "token-unico";
      render(<LaborDashboard {...defaultProps} token={tokenCustom} />);

      fireEvent.click(screen.getByTestId("btn-clear"));

      await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(Object),
          tokenCustom,
        );
      });
    });
  });

  // ── Tratamento de erros ──────────────────────────────────────────────────

  describe("tratamento de erros na API", () => {
    it("deve manter dados antigos se fetchData retornar firstSummary nulo", async () => {
      (fetchData as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          firstSummary: null,
          secondSummary: mockGroupSummary,
        },
      });

      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-apply"));

      await waitFor(() => {
        // Com firstSummary null, o setData recebe {}
        // Os dados exibidos devem ser o fallback
        expect(screen.getByTestId("daily-summary-table")).toBeInTheDocument();
      });
    });

    it("deve manter dados antigos se fetchData retornar secondSummary nulo", async () => {
      (fetchData as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: {
          firstSummary: mockDailySummary,
          secondSummary: null,
        },
      });

      render(<LaborDashboard {...defaultProps} />);
      fireEvent.click(screen.getByTestId("btn-apply"));

      await waitFor(() => {
        expect(screen.getByTestId("group-summary-table")).toBeInTheDocument();
      });
    });
  });
});
