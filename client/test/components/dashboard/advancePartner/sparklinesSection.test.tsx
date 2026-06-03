import { SparklinesSection } from "@/components/dashboard/advancePartner/sparklinesSection";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

const { mockPctColor } = vi.hoisted(() => ({
  mockPctColor: vi.fn((pct: number) => ({
    text: pct >= 80 ? "#10b981" : "#ef4444",
  })),
}));

vi.mock("@/components/dashboard/DashboardClient", () => ({
  pctColor: mockPctColor,
}));

vi.mock("recharts", async () => {
  const React = await import("react");

  return {
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive-container">{children}</div>
    ),

    LineChart: ({ children, data }: any) => (
      <div data-testid="line-chart">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return child;

          return React.cloneElement(child as any, {
            __data: data,
          });
        })}
      </div>
    ),

    Line: ({ dataKey, dot, label, __data = [] }: any) => (
      <svg data-testid={`line-${dataKey}`}>
        {__data.map((point: any, index: number) => (
          <g key={`${point.semana}-${index}`}>
            {dot
              ? React.cloneElement(dot as any, {
                  cx: 10 + index * 20,
                  cy: 30 + index * 5,
                  payload: point,
                })
              : null}

            {label
              ? React.cloneElement(label as any, {
                  x: 10 + index * 20,
                  y: 50,
                  value: point[dataKey],
                  index,
                })
              : null}
          </g>
        ))}
      </svg>
    ),
  };
});

describe("SparklinesSection", () => {
  const filtersPartner = [
    { turma: "ALPHA" },
    { turma: "BETA" },
    { turma: "START VALE" },
  ];

  const sparklines = [
    {
      parceira: "BETA",
      eliminacao: [{ pct: 70, semana: "2" }],
      aderencia: [{ pct: 80, semana: "2" }],
    },
    {
      parceira: "ALPHA",
      eliminacao: [{ pct: 90, semana: "3" }],
      aderencia: [{ pct: 95, semana: "3" }],
    },
    {
      parceira: "START VALE",
      eliminacao: [{ pct: 50, semana: "4" }],
      aderencia: [{ pct: 60, semana: "4" }],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar loading nos três cards", () => {
    render(
      <SparklinesSection
        loading
        filtersPartner={[]}
        semanasMap={{}}
        sparklines={[]}
      />,
    );

    expect(screen.getAllByText("Carregando…")).toHaveLength(3);
  });

  it("deve renderizar estado vazio", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={[]}
        semanasMap={{}}
        sparklines={[]}
      />,
    );

    expect(screen.getByText("Nenhum dado.")).toBeInTheDocument();

    expect(screen.getAllByText("Nenhum dado encontrado.")).toHaveLength(2);
  });

  it("deve exibir apenas empresas presentes em filtersPartner", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={[{ turma: "ALPHA" }, { turma: "START VALE" }]}
        semanasMap={{
          ALPHA: 8,
          "START VALE": 5,
        }}
        sparklines={sparklines}
      />,
    );

    expect(screen.getByText("ALPHA")).toBeInTheDocument();

    expect(screen.getByText("START VALE")).toBeInTheDocument();

    expect(screen.queryByText("BETA")).not.toBeInTheDocument();
  });

  it("deve ordenar empresas alfabeticamente", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={filtersPartner}
        semanasMap={{
          ALPHA: 8,
          BETA: 7,
          "START VALE": 5,
        }}
        sparklines={sparklines}
      />,
    );

    const empresas = screen.getAllByText(/ALPHA|BETA|START VALE/);

    expect(empresas[0]).toHaveTextContent("ALPHA");
    expect(empresas[1]).toHaveTextContent("BETA");
    expect(empresas[2]).toHaveTextContent("START VALE");
  });

  it("deve exibir a quantidade de semanas", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={filtersPartner}
        semanasMap={{
          ALPHA: 8,
          BETA: 6,
          "START VALE": 4,
        }}
        sparklines={sparklines}
      />,
    );

    expect(screen.getByText("8 semanas")).toBeInTheDocument();
    expect(screen.getByText("6 semanas")).toBeInTheDocument();
    expect(screen.getByText("4 semanas")).toBeInTheDocument();
  });

  it("deve exibir traço quando não houver semanas cadastradas", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={[{ turma: "ALPHA" }]}
        semanasMap={{}}
        sparklines={[
          {
            parceira: "ALPHA",
            eliminacao: [],
            aderencia: [],
          },
        ]}
      />,
    );

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("deve usar start-logo para START VALE", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={[{ turma: "START VALE" }]}
        semanasMap={{
          "START VALE": 8,
        }}
        sparklines={[
          {
            parceira: "START VALE",
            eliminacao: [],
            aderencia: [],
          },
        ]}
      />,
    );

    expect(screen.getByAltText("Logo START VALE")).toHaveAttribute(
      "src",
      "start-logo.png",
    );
  });

  it("deve usar logo padrão para outras empresas", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={[{ turma: "ALPHA" }]}
        semanasMap={{
          ALPHA: 8,
        }}
        sparklines={[
          {
            parceira: "ALPHA",
            eliminacao: [],
            aderencia: [],
          },
        ]}
      />,
    );

    expect(screen.getByAltText("Logo ALPHA")).toHaveAttribute(
      "src",
      "alpha-logo.png",
    );
  });

  it("deve renderizar os dois gráficos quando houver dados", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={[{ turma: "ALPHA" }]}
        semanasMap={{
          ALPHA: 8,
        }}
        sparklines={[
          {
            parceira: "ALPHA",
            eliminacao: [{ pct: 80, semana: "2" }],
            aderencia: [{ pct: 90, semana: "2" }],
          },
        ]}
      />,
    );

    expect(screen.getAllByTestId("responsive-container")).toHaveLength(2);

    expect(screen.getAllByTestId("line-chart")).toHaveLength(2);

    expect(screen.getAllByTestId("line-pct")).toHaveLength(2);
  });

  it("deve renderizar placeholder para sparklines vazias", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={[{ turma: "ALPHA" }]}
        semanasMap={{
          ALPHA: 8,
        }}
        sparklines={[
          {
            parceira: "ALPHA",
            eliminacao: [],
            aderencia: [],
          },
        ]}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(2);
  });

  it("deve aceitar filtersPartner nulo", () => {
    render(
      <SparklinesSection
        loading={false}
        filtersPartner={null}
        semanasMap={{}}
        sparklines={sparklines}
      />,
    );

    expect(screen.getByText("Nenhum dado.")).toBeInTheDocument();
  });
});
