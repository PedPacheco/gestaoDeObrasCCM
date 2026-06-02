// test/components/dashboard/DashboardClient.test.tsx

import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DashboardClient, {
  pctColor,
} from "@/components/dashboard/DashboardClient";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

vi.mock("next/image", () => ({
  default: ({ fill, ...props }: any) => {
    return <img {...props} />;
  },
}));

vi.mock("@/contexts/userContext", () => ({
  useUser: vi.fn(() => ({
    permissions: {
      id_area: 8,
      tipo_usuario: "INTERNO",
      is_admin: true,
    },
  })),
}));

vi.mock("@/components/dashboard/ForecastDashboard", () => ({
  default: (props: any) => (
    <div data-testid="forecast-dashboard" data-props={JSON.stringify(props)}>
      ForecastDashboard
    </div>
  ),
}));

vi.mock("@/components/dashboard/laborDashboard/laborDashboard", () => ({
  default: (props: any) => (
    <div data-testid="labor-dashboard" data-props={JSON.stringify(props)}>
      LaborDashboard
    </div>
  ),
}));

vi.mock(
  "@/components/dashboard/recompositionGoalsDashboard/RecompositionGoalsDashboard",
  () => ({
    default: (props: any) => (
      <div
        data-testid="recomposition-goals-dashboard"
        data-props={JSON.stringify(props)}
      >
        RecompositionGoalsDashboard
      </div>
    ),
  }),
);

vi.mock(
  "@/components/dashboard/monitoringExecutionDashboard/monitoringExecutionDashboard",
  () => ({
    default: (props: any) => (
      <div
        data-testid="monitoring-execution-dashboard"
        data-props={JSON.stringify(props)}
      >
        MonitoringExecutionDashboard
      </div>
    ),
  }),
);

vi.mock("@/components/dashboard/advancePartner/advancePartner", () => ({
  default: (props: any) => (
    <div
      data-testid="advance-partner-dashboard"
      data-props={JSON.stringify(props)}
    >
      AdvancePartnerDashboard
    </div>
  ),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESIZE OBSERVER MOCK
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class ResizeObserverMock {
  static instances: ResizeObserverMock[] = [];

  callback: ResizeObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    ResizeObserverMock.instances.push(this);
  }

  trigger(height: number) {
    this.callback(
      [
        {
          contentRect: {
            height,
          },
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const defaultProps = {
  token: "token-123",

  initialMaodeObra: {
    summary: [{ id: 1, name: "labor-summary" }],
    totals: { total: 10 },
  },
  initialMaodeObra2: [{ id: 2, name: "labor-detail" }],
  initialMetaDiaria: 150,

  initialForecastFirst: {
    summary: [{ id: "forecast-first" }],
  },
  initialForecastSecond: {
    summary: [{ id: "forecast-second" }],
  },

  initialMetasRecomposicao: [{ id: 3, goal: "meta" }],
  goalsFilters: {
    regional: [{ id: 1, name: "Regional 1" }],
    parceira: [{ id: 2, name: "Parceira 1" }],
    tipo: [{ id: 3, name: "Tipo 1" }],
    tecnico: [{ id: 4, name: "Técnico 1" }],
  },

  initialExecMonitoring: [{ id: 4, month: "Janeiro" }],

  initialEliminacaoRestricao: [{ id: 5, type: "eliminação" }],
  initialAderenciaParceira: [{ id: 6, type: "aderência" }],
  initialSparklinesPartners: [{ id: 7, value: 90 }],
  initialPartnerWeeks: [{ id: 8, week: "Semana 1" }],
  initialReasonsReascheduling: [{ id: 9, reason: "Motivo 1" }],

  initialLaborMoveForwardPartner: {
    summary: [{ id: 10, name: "avanca-summary" }],
    totals: { total: 20 },
  },
  initialDailyGoalMoveForwardPartner: 75,

  filtersData: {
    regional: [{ id: 11, name: "Filtro Regional" }],
    parceira: [{ id: 12, name: "Filtro Parceira" }],
    tipo: [{ id: 13, name: "Filtro Tipo" }],
    municipio: [{ id: 14, name: "Filtro Município" }],
    grupo: [{ id: 15, name: "Filtro Grupo" }],
  },
};

function renderComponent(overrides: Partial<typeof defaultProps> = {}) {
  return render(<DashboardClient {...defaultProps} {...overrides} />);
}

function getJsonProps(testId: string) {
  const element = screen.getByTestId(testId);
  return JSON.parse(element.dataset.props ?? "{}");
}

function getLastResizeObserver() {
  return ResizeObserverMock.instances[ResizeObserverMock.instances.length - 1];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

beforeEach(() => {
  ResizeObserverMock.instances = [];
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("pctColor", () => {
  it("deve retornar cores verdes quando pct é maior ou igual a 100", () => {
    expect(pctColor(100)).toEqual({
      bg: "#053715",
      text: "#53FF75",
      bar: "#53FF75",
    });

    expect(pctColor(120)).toEqual({
      bg: "#053715",
      text: "#53FF75",
      bar: "#53FF75",
    });
  });

  it("deve retornar cores amarelas quando pct está entre 89 e 99.99", () => {
    expect(pctColor(89)).toEqual({
      bg: "#451a03",
      text: "#facc15",
      bar: "#facc15",
    });

    expect(pctColor(99.99)).toEqual({
      bg: "#451a03",
      text: "#facc15",
      bar: "#facc15",
    });
  });

  it("deve retornar cores vermelhas quando pct é menor que 89", () => {
    expect(pctColor(88.99)).toEqual({
      bg: "#450a0a",
      text: "#f87171",
      bar: "#ef4444",
    });

    expect(pctColor(0)).toEqual({
      bg: "#450a0a",
      text: "#f87171",
      bar: "#ef4444",
    });
  });
});

describe("DashboardClient", () => {
  describe("renderização inicial", () => {
    it("deve renderizar a tab de mão de obra por padrão", () => {
      renderComponent();

      expect(screen.getByTestId("labor-dashboard")).toBeInTheDocument();

      expect(
        screen.queryByTestId("recomposition-goals-dashboard"),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId("monitoring-execution-dashboard"),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId("advance-partner-dashboard"),
      ).not.toBeInTheDocument();
    });

    it("deve renderizar todos os botões de navegação", () => {
      renderComponent();

      expect(
        screen.getByRole("button", {
          name: "Resumo — Mão de Obra Parceira",
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: "Metas Recomposição",
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: "Acompanhamento da Execução",
        }),
      ).toBeInTheDocument();

      expect(
        screen.getByRole("button", {
          name: "Avança Parceiro",
        }),
      ).toBeInTheDocument();
    });

    it("deve aplicar classe ativa ao botão da tab inicial", () => {
      renderComponent();

      const activeButton = screen.getByRole("button", {
        name: "Resumo — Mão de Obra Parceira",
      });

      const inactiveButton = screen.getByRole("button", {
        name: "Metas Recomposição",
      });

      expect(activeButton.className).toContain("text-white");
      expect(activeButton.className).toContain("bg-gradient-to-br");

      expect(inactiveButton.className).toContain("text-zinc-500");
      expect(inactiveButton.className).not.toContain("text-white");
    });

    it("deve renderizar os logótipos das parceiras", () => {
      renderComponent();

      const partners = [
        "Engelmig",
        "LIG",
        "Start",
        "Manserv",
        "OCA",
        "Cosampa",
        "Compel",
        "Baramaia",
      ];

      partners.forEach((partner) => {
        expect(screen.getByTitle(partner)).toBeInTheDocument();
      });

      expect(screen.getByAltText("Parceira 1")).toHaveAttribute(
        "src",
        "/engelmig-logo.png",
      );
      expect(screen.getByAltText("Parceira 8")).toHaveAttribute(
        "src",
        "/baramaia-logo.png",
      );
    });
  });

  describe("props enviadas para LaborDashboard", () => {
    it("deve passar as props corretas para LaborDashboard", () => {
      renderComponent();

      const props = getJsonProps("labor-dashboard");

      expect(props).toEqual({
        initialData: defaultProps.initialMaodeObra,
        initialData2: defaultProps.initialMaodeObra2,
        token: defaultProps.token,
        initialMetaDiaria: defaultProps.initialMetaDiaria,
        filtersData: defaultProps.filtersData,
        filtersTop: 76,
      });
    });
  });

  describe("navegação entre tabs", () => {
    it("deve renderizar RecompositionGoalsDashboard ao clicar em Metas Recomposição", () => {
      renderComponent();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Metas Recomposição",
        }),
      );

      expect(
        screen.getByTestId("recomposition-goals-dashboard"),
      ).toBeInTheDocument();

      expect(screen.queryByTestId("labor-dashboard")).not.toBeInTheDocument();

      const props = getJsonProps("recomposition-goals-dashboard");

      expect(props).toEqual({
        initialGoals: defaultProps.initialMetasRecomposicao,
        filtersData: defaultProps.goalsFilters,
        token: defaultProps.token,
        filtersTop: 76,
      });
    });

    it("deve renderizar MonitoringExecutionDashboard ao clicar em Acompanhamento da Execução", () => {
      renderComponent();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Acompanhamento da Execução",
        }),
      );

      expect(
        screen.getByTestId("monitoring-execution-dashboard"),
      ).toBeInTheDocument();

      expect(screen.queryByTestId("labor-dashboard")).not.toBeInTheDocument();

      const props = getJsonProps("monitoring-execution-dashboard");

      expect(props).toEqual({
        initialData: defaultProps.initialExecMonitoring,
        filtersData: defaultProps.goalsFilters,
        token: defaultProps.token,
        filtersTop: 76,
      });
    });

    it("deve renderizar AdvancePartnerDashboard ao clicar em Avança Parceiro", () => {
      renderComponent();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Avança Parceiro",
        }),
      );

      expect(
        screen.getByTestId("advance-partner-dashboard"),
      ).toBeInTheDocument();

      expect(screen.queryByTestId("labor-dashboard")).not.toBeInTheDocument();

      const props = getJsonProps("advance-partner-dashboard");

      expect(props).toEqual({
        initialEliminacao: defaultProps.initialEliminacaoRestricao,
        initialAderencia: defaultProps.initialAderenciaParceira,
        initialSparklinesPartners: defaultProps.initialSparklinesPartners,
        initialPartnerWeeks: defaultProps.initialPartnerWeeks,
        initialSummary: defaultProps.initialLaborMoveForwardPartner,
        initialReasonsReascheduling: defaultProps.initialReasonsReascheduling,
        initialDailyGoal: defaultProps.initialDailyGoalMoveForwardPartner,
        filtersData: defaultProps.goalsFilters,
        filtersTop: 76,
        token: defaultProps.token,
      });
    });

    it("deve voltar para LaborDashboard ao clicar novamente em Resumo — Mão de Obra Parceira", () => {
      renderComponent();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Avança Parceiro",
        }),
      );

      expect(
        screen.getByTestId("advance-partner-dashboard"),
      ).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", {
          name: "Resumo — Mão de Obra Parceira",
        }),
      );

      expect(screen.getByTestId("labor-dashboard")).toBeInTheDocument();

      expect(
        screen.queryByTestId("advance-partner-dashboard"),
      ).not.toBeInTheDocument();
    });

    it("deve atualizar a classe ativa quando muda de tab", () => {
      renderComponent();

      const laborButton = screen.getByRole("button", {
        name: "Resumo — Mão de Obra Parceira",
      });

      const metasButton = screen.getByRole("button", {
        name: "Metas Recomposição",
      });

      expect(laborButton.className).toContain("text-white");
      expect(metasButton.className).toContain("text-zinc-500");

      fireEvent.click(metasButton);

      expect(metasButton.className).toContain("text-white");
      expect(laborButton.className).toContain("text-zinc-500");
    });
  });

  describe("ResizeObserver e filtersTop", () => {
    it("deve criar ResizeObserver e observar o tab switcher", () => {
      renderComponent();

      const observer = getLastResizeObserver();

      expect(observer).toBeDefined();
      expect(observer.observe).toHaveBeenCalledTimes(1);
    });

    it("deve atualizar filtersTop quando a altura do tab switcher muda", () => {
      renderComponent();

      let props = getJsonProps("labor-dashboard");
      expect(props.filtersTop).toBe(76);

      const observer = getLastResizeObserver();

      act(() => {
        observer.trigger(44);
      });

      props = getJsonProps("labor-dashboard");

      expect(props.filtersTop).toBe(120);
    });

    it("deve propagar filtersTop atualizado para as outras tabs", () => {
      renderComponent();

      const observer = getLastResizeObserver();

      act(() => {
        observer.trigger(30);
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Metas Recomposição",
        }),
      );

      const props = getJsonProps("recomposition-goals-dashboard");

      expect(props.filtersTop).toBe(106);
    });

    it("deve desconectar ResizeObserver ao desmontar o componente", () => {
      const { unmount } = renderComponent();

      const observer = getLastResizeObserver();

      expect(observer.disconnect).not.toHaveBeenCalled();

      unmount();

      expect(observer.disconnect).toHaveBeenCalledTimes(1);
    });
  });

  describe("sobrescrita de props", () => {
    it("deve usar props atualizadas quando recebe valores diferentes", () => {
      renderComponent({
        token: "novo-token",
        initialMetaDiaria: 999,
        filtersData: {
          tipo: [],
          parceira: [],
          regional: [],
          grupo: [],
          municipio: [],
        },
      });

      const props = getJsonProps("labor-dashboard");

      expect(props.token).toBe("novo-token");
      expect(props.initialMetaDiaria).toBe(999);
      expect(props.filtersData).toEqual({
        tipo: [],
        parceira: [],
        regional: [],
        grupo: [],
        municipio: [],
      });
    });

    it("deve passar goalsFilters atualizado para as tabs que usam esse filtro", () => {
      const goalsFilters = {
        regional: [{ id: 99, name: "Regional Nova" }],
        tipo: [],
        parceira: [],
        tecnico: [],
      };

      renderComponent({
        goalsFilters,
      });

      fireEvent.click(
        screen.getByRole("button", {
          name: "Acompanhamento da Execução",
        }),
      );

      const props = getJsonProps("monitoring-execution-dashboard");

      expect(props.filtersData).toEqual(goalsFilters);
    });
  });
});
