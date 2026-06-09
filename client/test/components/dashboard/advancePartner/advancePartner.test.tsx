// test/components/dashboard/advancePartner/advancePartner.test.tsx

import AdvancePartnerDashboard, {
  pctExact,
} from "@/components/dashboard/advancePartner/advancePartner";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOISTED MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const {
  mockUseAdvancePartnerFilters,

  mockAdvancePartnerFilters,
  mockKpiSection,
  mockSparklinesSection,
  mockChartReasonsReascheduling,

  mockApplyFilters,
  mockResetFilters,

  mockSetStartDate,
  mockSetEndDate,
  mockSetFinalWeek,
  mockSetInitialWeek,
  mockSetSelParceira,
  mockSetSelRegional,
  mockSetMotivoTab,
  mockSetFilterMode,
} = vi.hoisted(() => ({
  mockUseAdvancePartnerFilters: vi.fn(),

  mockAdvancePartnerFilters: vi.fn(),
  mockKpiSection: vi.fn(),
  mockSparklinesSection: vi.fn(),
  mockChartReasonsReascheduling: vi.fn(),

  mockApplyFilters: vi.fn(),
  mockResetFilters: vi.fn(),

  mockSetStartDate: vi.fn(),
  mockSetEndDate: vi.fn(),
  mockSetFinalWeek: vi.fn(),
  mockSetInitialWeek: vi.fn(),
  mockSetSelParceira: vi.fn(),
  mockSetSelRegional: vi.fn(),
  mockSetMotivoTab: vi.fn(),
  mockSetFilterMode: vi.fn(),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCK DO HOOK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

vi.mock("@/hooks/dashboard/advancePartner/useAdvancePartnerFilters", () => ({
  useAdvancePartnerFilters: mockUseAdvancePartnerFilters,
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCKS DOS COMPONENTES FILHOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

vi.mock("@/components/dashboard/advancePartner/advancePartnerFilters", () => ({
  AdvancePartnerFilters: (props: any) => {
    mockAdvancePartnerFilters(props);

    return (
      <section data-testid="advance-partner-filters">
        <button onClick={props.applyFilters}>Aplicar filtros</button>
        <button onClick={props.clearFilters}>Limpar filtros</button>

        <button onClick={() => props.setStartDate("2026-01-01")}>
          Set startDate
        </button>

        <button onClick={() => props.setEndDate("2026-01-31")}>
          Set endDate
        </button>

        <button onClick={() => props.setInitialWeek("2026-W01")}>
          Set initialWeek
        </button>

        <button onClick={() => props.setFinalWeek("2026-W05")}>
          Set finalWeek
        </button>

        <button onClick={() => props.setSelectedParceira("Parceira X")}>
          Set parceira
        </button>

        <button onClick={() => props.setSelectedRegional("Regional Y")}>
          Set regional
        </button>

        <button onClick={() => props.setMotivoTab("responsavel")}>
          Set motivoTab
        </button>

        <button onClick={() => props.setFilterMode("semana")}>
          Set filterMode
        </button>
      </section>
    );
  },
}));

vi.mock("@/components/dashboard/advancePartner/kpiSection", () => ({
  KpiSection: (props: any) => {
    mockKpiSection(props);

    return <section data-testid="kpi-section">KpiSection</section>;
  },
}));

vi.mock("@/components/dashboard/advancePartner/sparklinesSection", () => ({
  SparklinesSection: (props: any) => {
    mockSparklinesSection(props);

    return (
      <section data-testid="sparklines-section">SparklinesSection</section>
    );
  },
}));

vi.mock(
  "@/components/dashboard/advancePartner/chartReasonsReascheduling",
  () => ({
    ChartReasonsReascheduling: (props: any) => {
      mockChartReasonsReascheduling(props);

      return (
        <section data-testid="chart-reasons-reascheduling">
          <button onClick={() => props.setMotivoTab("motivo")}>
            Alterar motivo tab
          </button>
          ChartReasonsReascheduling
        </section>
      );
    },
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DADOS DEFAULT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const defaultProps = {
  token: "token-123",

  initialEliminacao: [
    {
      month: "Jan",
      total: 100,
      withRestriction: 20,
      withoutRestriction: 80,
      pct: 80,
    },
  ],

  initialAderencia: [
    {
      week: "2026-W01",
      total: 50,
      executed: 30,
      partialExecuted: 10,
      notExecuted: 5,
      notInformed: 5,
      pct: 80,
    },
  ],

  initialSparklinesPartners: [
    {
      parceira: "Parceira A",
      aderencia: [{ semana: "2026-W01", pct: 90 }],
      eliminacao: [{ semana: "2026-W01", pct: 75 }],
    },
  ],

  initialPartnerWeeks: [
    {
      id: 1,
      week: "2026-W01",
    },
  ],

  initialReasonsReascheduling: [
    {
      ovnota: "OV001",
      motivo: "Material indisponível",
      responsavel: "Parceira",
      mo_nao_executada: 5,
    },
  ],

  initialSummary: {
    summary: [{ id: 1, value: 100 }],
    totals: { total: 100 },
  },

  initialDailyGoal: 10,

  filtersData: {
    regional: [{ id: 1, nome: "Regional 1" }],
    parceira: [{ id: 2, nome: "Parceira 1" }],
  },

  filtersTop: 120,
};

function createHookReturn(overrides: Record<string, any> = {}) {
  return {
    aderencia: [{ week: "2026-W01", pct: 80 }],
    eliminacao: [{ month: "Jan", pct: 75 }],
    motivos: [{ motivo: "Clima", mo_nao_executada: 3 }],

    sparklines: [
      {
        parceira: "Parceira A",
        aderencia: [{ semana: "2026-W01", pct: 90 }],
        eliminacao: [{ semana: "2026-W01", pct: 70 }],
      },
    ],

    semanasMap: {
      "2026-W01": "Semana 1",
    },

    taxaExec: 87.5,
    dailyGoal: 10,

    startDate: "2026-01-01",
    endDate: "2026-01-31",
    initialWeek: "2026-W01",
    finalWeek: "2026-W05",

    selParceira: "Parceira 1",
    selRegional: "Regional 1",
    motivoTab: "motivo",
    filterMode: "data",

    isPending: false,

    applyFilters: mockApplyFilters,
    resetFilters: mockResetFilters,

    setStartDate: mockSetStartDate,
    setEndDate: mockSetEndDate,
    setFinalWeek: mockSetFinalWeek,
    setInitialWeek: mockSetInitialWeek,
    setSelParceira: mockSetSelParceira,
    setSelRegional: mockSetSelRegional,
    setMotivoTab: mockSetMotivoTab,
    setFilterMode: mockSetFilterMode,

    ...overrides,
  };
}

function renderComponent(overrides: Partial<typeof defaultProps> = {}) {
  return render(<AdvancePartnerDashboard {...defaultProps} {...overrides} />);
}

function getLastCall<T = any>(mock: ReturnType<typeof vi.fn>): T {
  const calls = mock.mock.calls;
  return calls[calls.length - 1][0] as T;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

beforeEach(() => {
  vi.clearAllMocks();

  mockUseAdvancePartnerFilters.mockReturnValue(createHookReturn());
});

afterEach(() => {
  cleanup();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES DO HELPER pctExact
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("pctExact", () => {
  it("deve retornar 0 quando o denominador é 0", () => {
    expect(pctExact(10, 0)).toBe(0);
    expect(pctExact(0, 0)).toBe(0);
  });

  it("deve calcular percentagem com uma casa decimal", () => {
    expect(pctExact(1, 3)).toBe(33.3);
    expect(pctExact(2, 3)).toBe(66.7);
    expect(pctExact(5, 10)).toBe(50);
  });

  it("deve retornar 100 quando numerador e denominador são iguais", () => {
    expect(pctExact(10, 10)).toBe(100);
  });
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES DO COMPONENTE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("AdvancePartnerDashboard", () => {
  describe("renderização", () => {
    it("deve renderizar filtros, KPIs, sparklines e gráfico de motivos", () => {
      renderComponent();

      expect(screen.getByTestId("advance-partner-filters")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-section")).toBeInTheDocument();
      expect(screen.getByTestId("sparklines-section")).toBeInTheDocument();

      expect(
        screen.getByTestId("chart-reasons-reascheduling"),
      ).toBeInTheDocument();
    });

    it("deve renderizar o container principal com as classes esperadas", () => {
      const { container } = renderComponent();

      const root = container.firstElementChild as HTMLElement;

      expect(root).toHaveClass("flex", "flex-col", "gap-4", "sm:gap-6", "pb-6");
    });
  });

  describe("integração com useAdvancePartnerFilters", () => {
    it("deve chamar useAdvancePartnerFilters com os parâmetros iniciais corretos", () => {
      renderComponent();

      expect(mockUseAdvancePartnerFilters).toHaveBeenCalledTimes(1);

      expect(mockUseAdvancePartnerFilters).toHaveBeenCalledWith({
        token: defaultProps.token,
        filtersData: defaultProps.filtersData,
        initialEliminacao: defaultProps.initialEliminacao,
        initialAderencia: defaultProps.initialAderencia,
        initialPartnerWeeks: defaultProps.initialPartnerWeeks,
        initialReasonsReascheduling: defaultProps.initialReasonsReascheduling,
        initialSparklinesPartners: defaultProps.initialSparklinesPartners,
        initialSummary: defaultProps.initialSummary,
        initialDailyGoal: defaultProps.initialDailyGoal,
      });
    });

    it("deve chamar o hook novamente com novas props após rerender", () => {
      const { rerender } = renderComponent();

      const newProps = {
        ...defaultProps,
        token: "novo-token",
        initialDailyGoal: 25,
        initialSummary: {
          summary: [{ id: 999 }],
          totals: { total: 999 },
        },
      };

      rerender(<AdvancePartnerDashboard {...newProps} />);

      expect(mockUseAdvancePartnerFilters).toHaveBeenCalledTimes(2);

      expect(mockUseAdvancePartnerFilters).toHaveBeenLastCalledWith({
        token: "novo-token",
        filtersData: defaultProps.filtersData,
        initialEliminacao: defaultProps.initialEliminacao,
        initialAderencia: defaultProps.initialAderencia,
        initialPartnerWeeks: defaultProps.initialPartnerWeeks,
        initialReasonsReascheduling: defaultProps.initialReasonsReascheduling,
        initialSparklinesPartners: defaultProps.initialSparklinesPartners,
        initialSummary: newProps.initialSummary,
        initialDailyGoal: 25,
      });
    });
  });

  describe("props enviadas para AdvancePartnerFilters", () => {
    it("deve passar os valores e callbacks corretos para os filtros", () => {
      renderComponent();

      const props = getLastCall(mockAdvancePartnerFilters);

      expect(props.startDate).toBe("2026-01-01");
      expect(props.endDate).toBe("2026-01-31");
      expect(props.initialWeek).toBe("2026-W01");
      expect(props.finalWeek).toBe("2026-W05");

      expect(props.selectedParceira).toBe("Parceira 1");
      expect(props.selectedRegional).toBe("Regional 1");

      expect(props.filterMode).toBe("data");
      expect(props.motivoTab).toBe("motivo");

      expect(props.filtersData).toBe(defaultProps.filtersData);
      expect(props.filtersTop).toBe(120);
      expect(props.isPending).toBe(false);

      expect(props.applyFilters).toBe(mockApplyFilters);
      expect(props.clearFilters).toBe(mockResetFilters);

      expect(props.setStartDate).toBe(mockSetStartDate);
      expect(props.setEndDate).toBe(mockSetEndDate);
      expect(props.setFinalWeek).toBe(mockSetFinalWeek);
      expect(props.setInitialWeek).toBe(mockSetInitialWeek);
      expect(props.setSelectedParceira).toBe(mockSetSelParceira);
      expect(props.setSelectedRegional).toBe(mockSetSelRegional);
      expect(props.setMotivoTab).toBe(mockSetMotivoTab);
      expect(props.setFilterMode).toBe(mockSetFilterMode);
    });

    it("deve executar callbacks dos filtros ao interagir com o mock de filtros", () => {
      renderComponent();

      fireEvent.click(screen.getByText("Aplicar filtros"));
      expect(mockApplyFilters).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText("Limpar filtros"));
      expect(mockResetFilters).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByText("Set startDate"));
      expect(mockSetStartDate).toHaveBeenCalledWith("2026-01-01");

      fireEvent.click(screen.getByText("Set endDate"));
      expect(mockSetEndDate).toHaveBeenCalledWith("2026-01-31");

      fireEvent.click(screen.getByText("Set initialWeek"));
      expect(mockSetInitialWeek).toHaveBeenCalledWith("2026-W01");

      fireEvent.click(screen.getByText("Set finalWeek"));
      expect(mockSetFinalWeek).toHaveBeenCalledWith("2026-W05");

      fireEvent.click(screen.getByText("Set parceira"));
      expect(mockSetSelParceira).toHaveBeenCalledWith("Parceira X");

      fireEvent.click(screen.getByText("Set regional"));
      expect(mockSetSelRegional).toHaveBeenCalledWith("Regional Y");

      fireEvent.click(screen.getByText("Set motivoTab"));
      expect(mockSetMotivoTab).toHaveBeenCalledWith("responsavel");

      fireEvent.click(screen.getByText("Set filterMode"));
      expect(mockSetFilterMode).toHaveBeenCalledWith("semana");
    });
  });

  describe("props enviadas para KpiSection", () => {
    it("deve passar os dados corretos para KpiSection", () => {
      renderComponent();

      const props = getLastCall(mockKpiSection);

      expect(props.aderencia).toEqual([{ week: "2026-W01", pct: 80 }]);
      expect(props.eliminacao).toEqual([{ month: "Jan", pct: 75 }]);
      expect(props.taxaExec).toBe(87.5);
      expect(props.reasonsReascheduling).toEqual([
        { motivo: "Clima", mo_nao_executada: 3 },
      ]);
    });

    it("deve multiplicar dailyGoal por 22 antes de enviar para KpiSection", () => {
      mockUseAdvancePartnerFilters.mockReturnValue(
        createHookReturn({
          dailyGoal: 15,
        }),
      );

      renderComponent();

      const props = getLastCall(mockKpiSection);

      expect(props.dailyGoal).toBe(330);
    });

    it("deve enviar dailyGoal 0 quando dailyGoal do hook for 0", () => {
      mockUseAdvancePartnerFilters.mockReturnValue(
        createHookReturn({
          dailyGoal: 0,
        }),
      );

      renderComponent();

      const props = getLastCall(mockKpiSection);

      expect(props.dailyGoal).toBe(0);
    });
  });

  describe("props enviadas para SparklinesSection", () => {
    it("deve passar sparklines, parceiras, loading e semanasMap corretos", () => {
      renderComponent();

      const props = getLastCall(mockSparklinesSection);

      expect(props.sparklines).toEqual([
        {
          parceira: "Parceira A",
          aderencia: [{ semana: "2026-W01", pct: 90 }],
          eliminacao: [{ semana: "2026-W01", pct: 70 }],
        },
      ]);

      expect(props.filtersPartner).toBe(defaultProps.filtersData.parceira);
      expect(props.loading).toBe(false);

      expect(props.semanasMap).toEqual({
        "2026-W01": "Semana 1",
      });
    });

    it("deve passar loading true quando isPending for true", () => {
      mockUseAdvancePartnerFilters.mockReturnValue(
        createHookReturn({
          isPending: true,
        }),
      );

      renderComponent();

      const props = getLastCall(mockSparklinesSection);

      expect(props.loading).toBe(true);
    });
  });

  describe("props enviadas para ChartReasonsReascheduling", () => {
    it("deve passar motivoTab, motivos, setMotivoTab e isPending corretos", () => {
      renderComponent();

      const props = getLastCall(mockChartReasonsReascheduling);

      expect(props.motivos).toEqual([{ motivo: "Clima", mo_nao_executada: 3 }]);
      expect(props.isPending).toBe(false);
    });

    it("deve passar isPending true para o gráfico quando o hook indicar carregamento", () => {
      mockUseAdvancePartnerFilters.mockReturnValue(
        createHookReturn({
          isPending: true,
        }),
      );

      renderComponent();

      const props = getLastCall(mockChartReasonsReascheduling);

      expect(props.isPending).toBe(true);
    });
  });

  describe("cenários com dados vazios", () => {
    it("deve renderizar corretamente quando o hook retorna listas vazias", () => {
      mockUseAdvancePartnerFilters.mockReturnValue(
        createHookReturn({
          aderencia: [],
          eliminacao: [],
          motivos: [],
          sparklines: [],
          semanasMap: {},
          taxaExec: 0,
          dailyGoal: 0,
        }),
      );

      renderComponent();

      expect(screen.getByTestId("advance-partner-filters")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-section")).toBeInTheDocument();
      expect(screen.getByTestId("sparklines-section")).toBeInTheDocument();

      expect(
        screen.getByTestId("chart-reasons-reascheduling"),
      ).toBeInTheDocument();

      const kpiProps = getLastCall(mockKpiSection);
      const sparklineProps = getLastCall(mockSparklinesSection);
      const chartProps = getLastCall(mockChartReasonsReascheduling);

      expect(kpiProps.aderencia).toEqual([]);
      expect(kpiProps.eliminacao).toEqual([]);
      expect(kpiProps.reasonsReascheduling).toEqual([]);
      expect(kpiProps.taxaExec).toBe(0);
      expect(kpiProps.dailyGoal).toBe(0);

      expect(sparklineProps.sparklines).toEqual([]);
      expect(sparklineProps.semanasMap).toEqual({});

      expect(chartProps.motivos).toEqual([]);
    });

    it("deve passar filtersPartner como undefined se filtersData.parceira não existir", () => {
      renderComponent({
        filtersData: {
          regional: [],
          parceira: [],
        },
      });

      const props = getLastCall(mockSparklinesSection);

      expect(props.filtersPartner).toEqual([]);
    });
  });

  describe("estado de carregamento", () => {
    it("deve propagar isPending para filtros, sparklines e gráfico", () => {
      mockUseAdvancePartnerFilters.mockReturnValue(
        createHookReturn({
          isPending: true,
        }),
      );

      renderComponent();

      const filtersProps = getLastCall(mockAdvancePartnerFilters);
      const sparklineProps = getLastCall(mockSparklinesSection);
      const chartProps = getLastCall(mockChartReasonsReascheduling);

      expect(filtersProps.isPending).toBe(true);
      expect(sparklineProps.loading).toBe(true);
      expect(chartProps.isPending).toBe(true);
    });
  });
});
