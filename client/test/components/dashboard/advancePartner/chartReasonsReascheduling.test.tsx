// test/components/dashboard/advancePartner/chartReasonsReascheduling.test.tsx

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ChartReasonsReascheduling } from "@/components/dashboard/advancePartner/chartReasonsReascheduling";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOISTED MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const {
  mockResponsiveContainer,
  mockComposedChart,
  mockCartesianGrid,
  mockXAxis,
  mockYAxis,
  mockTooltip,
  mockBar,
  mockChartTooltip,
  mockSetMotivoTab,
} = vi.hoisted(() => ({
  mockResponsiveContainer: vi.fn(),
  mockComposedChart: vi.fn(),
  mockCartesianGrid: vi.fn(),
  mockXAxis: vi.fn(),
  mockYAxis: vi.fn(),
  mockTooltip: vi.fn(),
  mockBar: vi.fn(),
  mockChartTooltip: vi.fn(),
  mockSetMotivoTab: vi.fn(),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

vi.mock("recharts", () => ({
  ResponsiveContainer: (props: any) => {
    mockResponsiveContainer(props);

    return (
      <div
        data-testid="responsive-container"
        data-width={props.width}
        data-height={props.height}
      >
        {props.children}
      </div>
    );
  },

  ComposedChart: (props: any) => {
    mockComposedChart(props);

    return <div data-testid="composed-chart">{props.children}</div>;
  },

  CartesianGrid: (props: any) => {
    mockCartesianGrid(props);

    return <div data-testid="cartesian-grid" />;
  },

  XAxis: (props: any) => {
    mockXAxis(props);

    return <div data-testid="x-axis" />;
  },

  YAxis: (props: any) => {
    mockYAxis(props);

    return <div data-testid="y-axis" />;
  },

  Tooltip: (props: any) => {
    mockTooltip(props);

    return <div data-testid="tooltip">{props.content}</div>;
  },

  Bar: (props: any) => {
    mockBar(props);

    return <div data-testid="bar" />;
  },
}));

vi.mock("@/components/dashboard/common/ChartTooltip", () => ({
  ChartTooltip: (props: any) => {
    mockChartTooltip(props);

    return (
      <div
        data-testid="chart-tooltip"
        data-percentage-fields={props.percentageFields}
      >
        ChartTooltip
      </div>
    );
  },
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const defaultProps = {
  motivos: [
    {
      ovnota: "OV001",
      motivo: "Clima",
      responsavel: "Parceira",
      mo_nao_executada: 2,
    },
  ],
  aderencia: [
    {
      total: 10,
      executed: 5,
      notExecuted: 2,
      notInformed: 0,
      partialExecuted: 3,
      pct: 50,
      week: "Semana-2",
    },
  ],
  isPending: false,
};

function renderComponent(overrides: Partial<typeof defaultProps> = {}) {
  return render(<ChartReasonsReascheduling {...defaultProps} {...overrides} />);
}

function getLastCall<T = any>(mock: any): T {
  const calls = mock.mock.calls;
  return calls[calls.length - 1]?.[0] as T;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("ChartReasonsReascheduling", () => {
  describe("renderização base", () => {
    it("deve renderizar título e subtítulo com quantidade de registros", () => {
      renderComponent({
        motivos: [
          {
            ovnota: "OV001",
            motivo: "Clima",
            mo_nao_executada: 1,
            responsavel: "Edp",
          },
          {
            ovnota: "OV002",
            motivo: "Material",
            mo_nao_executada: 2,
            responsavel: "Terceiro",
          },
        ],
      });

      expect(screen.getByText("Motivos de Reprogramação")).toBeInTheDocument();

      expect(
        screen.getByText(/Top ocorrências por motivo/),
      ).toBeInTheDocument();

      expect(screen.getByText(/2 registros/)).toBeInTheDocument();
    });

    it("deve renderizar o container principal com as classes esperadas", () => {
      const { container } = renderComponent();

      const root = container.firstElementChild as HTMLElement;

      expect(root).toHaveClass(
        "bg-gradient-to-br",
        "rounded-2xl",
        "p-5",
        "border",
        "shadow-xl",
      );
    });
  });

  describe("estado de carregamento", () => {
    it("deve exibir mensagem de carregamento quando isPending é true", () => {
      renderComponent({
        isPending: true,
        motivos: [
          {
            ovnota: "OV001",
            motivo: "Clima",
            mo_nao_executada: 1,
            responsavel: "Edp",
          },
        ],
      });

      expect(screen.getByText("Carregando…")).toBeInTheDocument();

      expect(
        screen.queryByTestId("responsive-container"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("composed-chart")).not.toBeInTheDocument();
    });

    it("deve priorizar carregamento mesmo quando existem motivos", () => {
      renderComponent({
        isPending: true,
        motivos: [
          {
            ovnota: "OV001",
            motivo: "Clima",
            mo_nao_executada: 1,
            responsavel: "Edp",
          },
          {
            ovnota: "OV002",
            motivo: "Material",
            mo_nao_executada: 2,
            responsavel: "Edp",
          },
        ],
      });

      expect(screen.getByText("Carregando…")).toBeInTheDocument();

      expect(
        screen.queryByText(
          "Nenhum motivo de reprogramação para o período e filtro selecionados.",
        ),
      ).not.toBeInTheDocument();

      expect(screen.queryByTestId("composed-chart")).not.toBeInTheDocument();
    });
  });

  describe("estado vazio", () => {
    it("deve exibir mensagem vazia quando não existem motivos", () => {
      renderComponent({
        motivos: [],
        isPending: false,
      });

      expect(
        screen.getByText(
          "Nenhum motivo de reprogramação para o período e filtro selecionados.",
        ),
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId("responsive-container"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("composed-chart")).not.toBeInTheDocument();
    });

    it("deve mostrar 0 registros no subtítulo quando a lista está vazia", () => {
      renderComponent({
        motivos: [],
      });

      expect(screen.getByText(/0 registros/)).toBeInTheDocument();
    });
  });

  describe("dados do gráfico", () => {
    it("deve agregar motivos por nome normalizado em uppercase e trim", () => {
      renderComponent({
        motivos: [
          {
            ovnota: "OV001",
            motivo: " clima ",
            mo_nao_executada: 2,
            responsavel: "Edp",
          },
          {
            ovnota: "OV002",
            motivo: "CLIMA",
            mo_nao_executada: 3,
            responsavel: "Edp",
          },
          {
            ovnota: "OV003",
            motivo: "Material",
            mo_nao_executada: 4,
            responsavel: "Edp",
          },
        ],
      });

      expect(screen.getByTestId("composed-chart")).toBeInTheDocument();

      const chartProps = getLastCall(mockComposedChart);
      const data = chartProps.data;

      expect(data).toEqual([
        {
          motivo: "CLIMA",
          count: 2,
          moNaoExecutada: 5,
          pct: "20.00",
        },
        {
          motivo: "MATERIAL",
          count: 1,
          moNaoExecutada: 4,
          pct: "10.00",
        },
      ]);
    });

    it("deve usar 'Sem motivo informado' quando motivo está vazio ou ausente", () => {
      renderComponent({
        motivos: [
          {
            ovnota: "OV001",
            motivo: "",
            mo_nao_executada: null as any,
            responsavel: "Edp",
          },
        ],
      });

      const chartProps = getLastCall(mockComposedChart);
      const data = chartProps.data;

      expect(data).toEqual([
        {
          motivo: "SEM MOTIVO INFORMADO",
          count: 1,
          moNaoExecutada: 0,
          pct: "10.00",
        },
      ]);
    });

    it("deve converter mo_nao_executada para número antes de somar", () => {
      renderComponent({
        motivos: [
          {
            ovnota: "OV001",
            motivo: "Equipe",
            mo_nao_executada: "2" as any,
            responsavel: "Edp",
          },
          {
            ovnota: "OV002",
            motivo: "Equipe",
            mo_nao_executada: "3" as any,
            responsavel: "Edp",
          },
        ],
      });

      const chartProps = getLastCall(mockComposedChart);
      const data = chartProps.data;

      expect(data[0]).toEqual({
        motivo: "EQUIPE",
        count: 2,
        moNaoExecutada: 5,
        pct: "20.00",
      });
    });

    it("deve ordenar os motivos por maior quantidade de ocorrências", () => {
      renderComponent({
        motivos: [
          {
            ovnota: "OV001",
            motivo: "A",
            mo_nao_executada: 1,
            responsavel: "Edp",
          },
          {
            ovnota: "OV002",
            motivo: "B",
            mo_nao_executada: 1,
            responsavel: "Edp",
          },
          {
            ovnota: "OV003",
            motivo: "B",
            mo_nao_executada: 1,
            responsavel: "Edp",
          },
          {
            ovnota: "OV004",
            motivo: "C",
            mo_nao_executada: 1,
            responsavel: "Edp",
          },
        ],
      });

      const chartProps = getLastCall(mockComposedChart);
      const data = chartProps.data;

      expect(data.map((item: any) => item.motivo)).toEqual(["B", "A", "C"]);

      expect(data.map((item: any) => item.count)).toEqual([2, 1, 1]);
    });

    it("deve limitar o resultado aos 12 principais motivos", () => {
      const motivos = Array.from({ length: 14 }).flatMap((_, index) => {
        const motivoNumber = index + 1;

        return Array.from({ length: motivoNumber }).map((__, itemIndex) => ({
          ovnota: `OV-${motivoNumber}-${itemIndex}`,
          motivo: `Motivo ${motivoNumber}`,
          mo_nao_executada: 1,
          responsavel: "Edp",
        }));
      });

      renderComponent({
        motivos,
      });

      const chartProps = getLastCall(mockComposedChart);
      const data = chartProps.data;

      expect(data).toHaveLength(12);

      expect(data[0].motivo).toBe("MOTIVO 14");
      expect(data[1].motivo).toBe("MOTIVO 13");
      expect(data[11].motivo).toBe("MOTIVO 3");

      expect(data.some((item: any) => item.motivo === "MOTIVO 2")).toBe(false);

      expect(data.some((item: any) => item.motivo === "MOTIVO 1")).toBe(false);
    });

    it("deve cobrir fallback de pct 0 quando existem entradas agregadas mas length é 0", () => {
      const motivosArrayLike = {
        length: 0,
        forEach: (callback: any) => {
          callback({
            ovnota: "OV001",
            motivo: "Forçado",
            mo_nao_executada: 10,
          });
        },
      } as any;

      renderComponent({
        motivos: motivosArrayLike,
      });

      const chartProps = getLastCall(mockComposedChart);
      const data = chartProps.data;

      expect(data).toEqual([
        {
          motivo: "FORÇADO",
          count: 1,
          moNaoExecutada: 10,
          pct: "10.00",
        },
      ]);
    });
  });

  describe("configuração do Recharts", () => {
    it("deve renderizar ResponsiveContainer com width 100% e height 380", () => {
      renderComponent();

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();

      const props = getLastCall(mockResponsiveContainer);

      expect(props.width).toBe("100%");
      expect(props.height).toBe(380);
    });

    it("deve renderizar ComposedChart com data e margin corretos", () => {
      renderComponent();

      const props = getLastCall(mockComposedChart);

      expect(props.data).toEqual([
        {
          motivo: "CLIMA",
          count: 1,
          moNaoExecutada: 2,
          pct: "10.00",
        },
      ]);

      expect(props.margin).toEqual({
        top: 20,
        right: 10,
        left: 10,
        bottom: 5,
      });
    });

    it("deve configurar CartesianGrid corretamente", () => {
      renderComponent();

      const props = getLastCall(mockCartesianGrid);

      expect(props.strokeDasharray).toBe("3 3");
      expect(props.stroke).toBe("#ffffff08");
      expect(props.vertical).toBe(false);
    });

    it("deve configurar XAxis corretamente", () => {
      renderComponent();

      const props = getLastCall(mockXAxis);

      expect(props.type).toBe("category");
      expect(props.dataKey).toBe("motivo");
      expect(props.interval).toBe(0);
      expect(props.height).toBe(110);

      expect(props.tick).toEqual({
        fill: "#94a3b8",
        fontSize: 11,
        angle: -25,
        textAnchor: "end",
      });
    });

    it("deve formatar labels longas do XAxis com reticências", () => {
      renderComponent();

      const props = getLastCall(mockXAxis);

      expect(props.tickFormatter("Motivo curto")).toBe("Motivo curto");

      expect(
        props.tickFormatter("Motivo muito longo para ser exibido completo"),
      ).toBe("Motivo muito longo p…");
    });

    it("deve configurar YAxis corretamente", () => {
      renderComponent();

      const props = getLastCall(mockYAxis);

      expect(props.type).toBe("number");

      expect(props.tick).toEqual({
        fill: "#94a3b8",
        fontSize: 10,
      });

      expect(props.tickFormatter(75)).toBe("75%");
    });

    it("deve configurar Tooltip com ChartTooltip usando campo percentual pct", () => {
      renderComponent();

      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
      expect(screen.getByTestId("chart-tooltip")).toBeInTheDocument();

      expect(mockTooltip).toHaveBeenCalledTimes(1);

      expect(mockChartTooltip).toHaveBeenCalledWith({
        percentageFields: "pct",
      });

      expect(screen.getByTestId("chart-tooltip")).toHaveAttribute(
        "data-percentage-fields",
        "pct",
      );
    });

    it("deve configurar Bar corretamente", () => {
      renderComponent();

      const props = getLastCall(mockBar);

      expect(props.dataKey).toBe("pct");
      expect(props.name).toBe("% do total");
      expect(props.fill).toBe("#1d4ed8");
      expect(props.radius).toEqual([4, 4, 0, 0]);
      expect(props.maxBarSize).toBe(72);
    });

    it("deve configurar label do Bar e formatar valores com percentagem", () => {
      renderComponent();

      const props = getLastCall(mockBar);

      expect(props.label.position).toBe("top");
      expect(props.label.fill).toBe("#94a3b8");
      expect(props.label.fontSize).toBe(14);

      expect(props.label.formatter(33)).toBe("33%");
      expect(props.label.formatter(100)).toBe("100%");
    });
  });

  describe("atualização de props", () => {
    it("deve alternar de gráfico para carregamento quando isPending muda para true", () => {
      const { rerender } = renderComponent({
        isPending: false,
      });

      expect(screen.getByTestId("composed-chart")).toBeInTheDocument();

      rerender(
        <ChartReasonsReascheduling
          motivos={defaultProps.motivos}
          isPending={true}
          aderencia={[]}
        />,
      );

      expect(screen.getByText("Carregando…")).toBeInTheDocument();
      expect(screen.queryByTestId("composed-chart")).not.toBeInTheDocument();
    });

    it("deve alternar de gráfico para estado vazio quando motivos fica vazio", () => {
      const { rerender } = renderComponent({
        motivos: [
          {
            ovnota: "OV001",
            motivo: "Clima",
            mo_nao_executada: 1,
            responsavel: "Edp",
          },
        ],
      });

      expect(screen.getByTestId("composed-chart")).toBeInTheDocument();

      rerender(
        <ChartReasonsReascheduling
          motivos={[]}
          isPending={false}
          aderencia={[]}
        />,
      );

      expect(
        screen.getByText(
          "Nenhum motivo de reprogramação para o período e filtro selecionados.",
        ),
      ).toBeInTheDocument();

      expect(screen.queryByTestId("composed-chart")).not.toBeInTheDocument();
    });
  });
});
