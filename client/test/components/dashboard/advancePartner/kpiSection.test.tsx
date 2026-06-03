// test/components/dashboard/advancePartner/kpiSection.test.tsx

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KpiSection } from "@/components/dashboard/advancePartner/kpiSection";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOISTED MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const {
  mockRingCard,
  mockKpiCard,
  mockFormatCurrency,
  mockNUM,
  mockPctColor,
  mockPctExact,
} = vi.hoisted(() => ({
  mockRingCard: vi.fn(),
  mockKpiCard: vi.fn(),

  mockFormatCurrency: vi.fn((value: number) => `currency:${value}`),
  mockNUM: vi.fn((value: number) => `num:${value}`),

  mockPctColor: vi.fn((pct: number) => ({
    bg: `bg-${pct}`,
    text: `text-${pct}`,
    bar: `bar-${pct}`,
  })),

  mockPctExact: vi.fn((num: number, den: number) => {
    if (den === 0) return 0;
    return Math.round((num / den) * 100 * 10) / 10;
  }),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

vi.mock("@/utils/formatValue", () => ({
  FormatCurrency: mockFormatCurrency,
  NUM: mockNUM,
}));

vi.mock("@/components/dashboard/common/KpiCard", () => ({
  KpiCard: (props: any) => {
    mockKpiCard(props);

    return (
      <div
        data-testid="kpi-card"
        data-label={props.label}
        data-value={props.value}
        data-gradient={props.gradient}
        data-accent={props.accent}
      >
        {props.label}: {props.value}
      </div>
    );
  },
}));

vi.mock("@/components/dashboard/common/RingCard", () => ({
  RingCard: (props: any) => {
    mockRingCard(props);

    return (
      <div
        data-testid="ring-card"
        data-label={props.label}
        data-sublabel={props.subLabel}
        data-value={String(props.value)}
        data-color={props.color}
        data-sub={props.sub}
      >
        {props.label}: {props.value}
      </div>
    );
  },
}));

vi.mock("@/components/dashboard/DashboardClient", () => ({
  pctColor: mockPctColor,
}));

vi.mock("@/components/dashboard/advancePartner/advancePartner", () => ({
  pctExact: mockPctExact,
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const defaultProps = {
  eliminacao: [
    {
      month: "Jan",
      total: 100,
      withRestriction: 20,
      withoutRestriction: 80,
      pct: 80,
    },
    {
      month: "Fev",
      total: 50,
      withRestriction: 5,
      withoutRestriction: 45,
      pct: 90,
    },
  ],

  aderencia: [
    {
      week: "2026-W01",
      total: 100,
      executed: 90,
      partialExecuted: 5,
      notExecuted: 3,
      notInformed: 2,
      pct: 90,
    },
  ],

  taxaExec: {
    exec: 100,
    prog: 50,
  },

  reasonsReascheduling: [
    {
      ovnota: "OV001",
      motivo: "Clima",
      responsavel: "EDP",
      mo_nao_executada: 10,
    },
    {
      ovnota: "OV002",
      motivo: "Material",
      responsavel: "Parceira",
      mo_nao_executada: 5,
    },
  ],

  dailyGoal: 200,
};

function renderComponent(overrides: Partial<typeof defaultProps> = {}) {
  return render(<KpiSection {...defaultProps} {...overrides} />);
}

function getRingPropsByLabel(label: string) {
  return mockRingCard.mock.calls
    .map((call) => call[0])
    .find((props) => props.label === label);
}

function getKpiPropsByLabel(label: string) {
  return mockKpiCard.mock.calls
    .map((call) => call[0])
    .find((props) => props.label === label);
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

describe("KpiSection", () => {
  describe("renderização base", () => {
    it("deve renderizar 4 RingCards e 1 KpiCard", () => {
      renderComponent();

      expect(screen.getAllByTestId("ring-card")).toHaveLength(4);
      expect(screen.getAllByTestId("kpi-card")).toHaveLength(1);
    });

    it("deve renderizar o container principal com as classes esperadas", () => {
      const { container } = renderComponent();

      const root = container.firstElementChild as HTMLElement;

      expect(root).toHaveClass("grid", "grid-cols-5", "gap-2", "px-5");
    });

    it("deve renderizar todos os cards com os labels corretos", () => {
      renderComponent();

      expect(screen.getByText(/Rentabilidade Programado/)).toBeInTheDocument();
      expect(screen.getByText(/Rentabilidade Execução/)).toBeInTheDocument();
      expect(screen.getByText(/Aderência Programação/)).toBeInTheDocument();
      expect(screen.getByText(/Reprogramações/)).toBeInTheDocument();
      expect(screen.getByText(/Eliminação de Restrições/)).toBeInTheDocument();
    });
  });

  describe("Rentabilidade Programado", () => {
    it("deve calcular percentagem programada e enviar props corretas para RingCard", () => {
      renderComponent();

      const props = getRingPropsByLabel("Rentabilidade Programado");

      expect(props).toMatchObject({
        label: "Rentabilidade Programado",
        subLabel: "Meta / Programado",
        value: 25,
        color: "bar-25",
        sub: "currency:200 / currency:50",
      });

      expect(mockPctColor).toHaveBeenCalledWith(25);
      expect(mockFormatCurrency).toHaveBeenCalledWith(200);
      expect(mockFormatCurrency).toHaveBeenCalledWith(50);
    });

    it("deve retornar percentagem programada 0 quando taxaExec.prog for 0", () => {
      renderComponent({
        taxaExec: {
          exec: 100,
          prog: 0,
        },
      });

      const props = getRingPropsByLabel("Rentabilidade Programado");

      expect(props.value).toBe(0);
      expect(props.color).toBe("bar-0");

      expect(mockPctColor).toHaveBeenCalledWith(0);
    });
  });

  describe("Rentabilidade Execução", () => {
    it("deve calcular percentagem executada e enviar props corretas para RingCard", () => {
      renderComponent();

      const props = getRingPropsByLabel("Rentabilidade Execução");

      expect(props).toMatchObject({
        label: "Rentabilidade Execução",
        subLabel: "Meta / Executado",
        value: 50,
        color: "bar-50",
        sub: "currency:200 / currency:100",
      });

      expect(mockPctColor).toHaveBeenCalledWith(50);
      expect(mockFormatCurrency).toHaveBeenCalledWith(100);
    });

    it("deve retornar percentagem executada 0 quando taxaExec.exec for 0", () => {
      renderComponent({
        taxaExec: {
          exec: 0,
          prog: 50,
        },
      });

      const props = getRingPropsByLabel("Rentabilidade Execução");

      expect(props.value).toBe(0);
      expect(props.color).toBe("bar-0");

      expect(mockPctColor).toHaveBeenCalledWith(0);
    });
  });

  describe("Aderência Programação", () => {
    it("deve calcular totais de aderência e enviar props corretas", () => {
      renderComponent();

      const props = getRingPropsByLabel("Aderência Programação");

      expect(props).toMatchObject({
        label: "Aderência Programação",
        subLabel: "Obras / Executado / Parcial / Não exec.",
        value: 90,
        color: "#53FF75",
        sub: "num:100 / num:90 / num:5 / num:3",
      });

      expect(mockPctExact).toHaveBeenCalledWith(90, 100);

      expect(mockNUM).toHaveBeenCalledWith(100);
      expect(mockNUM).toHaveBeenCalledWith(90);
      expect(mockNUM).toHaveBeenCalledWith(5);
      expect(mockNUM).toHaveBeenCalledWith(3);
    });

    it("deve somar múltiplas linhas de aderência corretamente", () => {
      renderComponent({
        aderencia: [
          {
            week: "2026-W01",
            total: 100,
            executed: 50,
            partialExecuted: 10,
            notExecuted: 20,
            notInformed: 20,
            pct: 50,
          },
          {
            week: "2026-W02",
            total: 50,
            executed: 25,
            partialExecuted: 5,
            notExecuted: 10,
            notInformed: 10,
            pct: 50,
          },
        ],
      });

      const props = getRingPropsByLabel("Aderência Programação");

      expect(props.sub).toBe("num:150 / num:75 / num:15 / num:30");
      expect(props.value).toBe(50);
      expect(props.color).toBe("#ef4444");
    });
  });

  describe("Reprogramações", () => {
    it("deve somar mo_nao_executada e formatar como moeda", () => {
      renderComponent();

      const props = getKpiPropsByLabel("Reprogramações");

      expect(props).toMatchObject({
        label: "Reprogramações",
        value: "currency:15",
        gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
        accent: "#53FF75",
      });

      expect(mockFormatCurrency).toHaveBeenCalledWith(15);
    });

    it("deve converter mo_nao_executada para número antes de somar", () => {
      renderComponent({
        reasonsReascheduling: [
          {
            ovnota: "OV001",
            motivo: "Clima",
            mo_nao_executada: "10" as any,
            responsavel: "Edp",
          },
          {
            ovnota: "OV002",
            motivo: "Material",
            mo_nao_executada: "5" as any,
            responsavel: "Edp",
          },
        ],
      });

      const props = getKpiPropsByLabel("Reprogramações");

      expect(props.value).toBe("currency:15");
      expect(mockFormatCurrency).toHaveBeenCalledWith(15);
    });

    it("deve considerar mo_nao_executada como 0 quando vier null ou undefined", () => {
      renderComponent({
        reasonsReascheduling: [
          {
            ovnota: "OV001",
            motivo: "Clima",
            mo_nao_executada: undefined as any,
            responsavel: "Edp",
          },
          {
            ovnota: "OV002",
            motivo: "Material",
            mo_nao_executada: null as any,
            responsavel: "Edp",
          },
          {
            ovnota: "OV003",
            motivo: "Equipe",
            mo_nao_executada: 7,
            responsavel: "Edp",
          },
        ],
      });

      const props = getKpiPropsByLabel("Reprogramações");

      expect(props.value).toBe("currency:7");
      expect(mockFormatCurrency).toHaveBeenCalledWith(7);
    });
  });

  describe("Eliminação de Restrições", () => {
    it("deve calcular total, sem restrição, com restrição e percentagem", () => {
      renderComponent();

      const props = getRingPropsByLabel("Eliminação de Restrições");

      // Total = 100 + 50 = 150
      // Sem restrição = 80 + 45 = 125
      // Com restrição = 150 - 125 = 25
      // pctExact(125, 150) = 83.3
      // roundDisplay(83.3) = Math.floor(83.7) = 83

      expect(props).toMatchObject({
        label: "Eliminação de Restrições",
        subLabel: "Total / Sem restrição / Com restrição",
        value: 83,
        color: "#facc15",
        sub: "num:150 / num:125 / num:25",
      });

      expect(mockPctExact).toHaveBeenCalledWith(125, 150);
      expect(mockNUM).toHaveBeenCalledWith(150);
      expect(mockNUM).toHaveBeenCalledWith(125);
      expect(mockNUM).toHaveBeenCalledWith(25);
    });

    it("deve somar múltiplas linhas de eliminação corretamente", () => {
      renderComponent({
        eliminacao: [
          {
            month: "Jan",
            total: 10,
            withRestriction: 4,
            withoutRestriction: 6,
            pct: 60,
          },
          {
            month: "Fev",
            total: 20,
            withRestriction: 8,
            withoutRestriction: 12,
            pct: 60,
          },
        ],
      });

      const props = getRingPropsByLabel("Eliminação de Restrições");

      expect(props.sub).toBe("num:30 / num:18 / num:12");
      expect(props.value).toBe(60);
      expect(props.color).toBe("#ef4444");
    });
  });

  describe("cores de Aderência e Eliminação", () => {
    it("deve usar verde quando percentagem for maior ou igual a 85", () => {
      renderComponent({
        aderencia: [
          {
            week: "2026-W01",
            total: 100,
            executed: 90,
            partialExecuted: 0,
            notExecuted: 10,
            notInformed: 0,
            pct: 90,
          },
        ],
        eliminacao: [
          {
            month: "Jan",
            total: 100,
            withRestriction: 10,
            withoutRestriction: 90,
            pct: 90,
          },
        ],
      });

      const aderenciaProps = getRingPropsByLabel("Aderência Programação");
      const eliminacaoProps = getRingPropsByLabel("Eliminação de Restrições");

      expect(aderenciaProps.value).toBe(90);
      expect(aderenciaProps.color).toBe("#53FF75");

      expect(eliminacaoProps.value).toBe(90);
      expect(eliminacaoProps.color).toBe("#53FF75");
    });

    it("deve usar amarelo quando percentagem estiver entre 71 e 84", () => {
      renderComponent({
        aderencia: [
          {
            week: "2026-W01",
            total: 100,
            executed: 80,
            partialExecuted: 0,
            notExecuted: 20,
            notInformed: 0,
            pct: 80,
          },
        ],
        eliminacao: [
          {
            month: "Jan",
            total: 100,
            withRestriction: 20,
            withoutRestriction: 80,
            pct: 80,
          },
        ],
      });

      const aderenciaProps = getRingPropsByLabel("Aderência Programação");
      const eliminacaoProps = getRingPropsByLabel("Eliminação de Restrições");

      expect(aderenciaProps.value).toBe(80);
      expect(aderenciaProps.color).toBe("#facc15");

      expect(eliminacaoProps.value).toBe(80);
      expect(eliminacaoProps.color).toBe("#facc15");
    });

    it("deve usar vermelho quando percentagem for menor que 71", () => {
      renderComponent({
        aderencia: [
          {
            week: "2026-W01",
            total: 100,
            executed: 50,
            partialExecuted: 0,
            notExecuted: 50,
            notInformed: 0,
            pct: 50,
          },
        ],
        eliminacao: [
          {
            month: "Jan",
            total: 100,
            withRestriction: 50,
            withoutRestriction: 50,
            pct: 50,
          },
        ],
      });

      const aderenciaProps = getRingPropsByLabel("Aderência Programação");
      const eliminacaoProps = getRingPropsByLabel("Eliminação de Restrições");

      expect(aderenciaProps.value).toBe(50);
      expect(aderenciaProps.color).toBe("#ef4444");

      expect(eliminacaoProps.value).toBe(50);
      expect(eliminacaoProps.color).toBe("#ef4444");
    });
  });

  describe("roundDisplay", () => {
    it("deve arredondar usando Math.floor(x + 0.4)", () => {
      renderComponent({
        taxaExec: {
          prog: 84.5,
          exec: 84.6,
        },
        dailyGoal: 100,
      });

      const progProps = getRingPropsByLabel("Rentabilidade Programado");
      const execProps = getRingPropsByLabel("Rentabilidade Execução");

      // Math.floor(84.5 + 0.4) = Math.floor(84.9) = 84
      expect(progProps.value).toBe(84);

      // Math.floor(84.6 + 0.4) = Math.floor(85) = 85
      expect(execProps.value).toBe(85);
    });
  });

  describe("cenários com dados vazios", () => {
    it("deve renderizar corretamente quando aderencia, eliminacao e reasons vierem vazios", () => {
      renderComponent({
        aderencia: [],
        eliminacao: [],
        reasonsReascheduling: [],
        taxaExec: {
          exec: 0,
          prog: 0,
        },
        dailyGoal: 100,
      });

      const aderenciaProps = getRingPropsByLabel("Aderência Programação");
      const eliminacaoProps = getRingPropsByLabel("Eliminação de Restrições");
      const reprogramacoesProps = getKpiPropsByLabel("Reprogramações");

      expect(aderenciaProps).toMatchObject({
        value: 0,
        color: "#ef4444",
        sub: "num:0 / num:0 / num:0 / num:0",
      });

      expect(eliminacaoProps).toMatchObject({
        value: 0,
        color: "#ef4444",
        sub: "num:0 / num:0 / num:0",
      });

      expect(reprogramacoesProps.value).toBe("currency:0");

      expect(mockPctExact).toHaveBeenCalledWith(0, 0);
      expect(mockFormatCurrency).toHaveBeenCalledWith(0);
    });
  });

  describe("chamadas aos componentes filhos", () => {
    it("deve chamar RingCard com os quatro cards esperados", () => {
      renderComponent();

      const labels = mockRingCard.mock.calls.map((call) => call[0].label);

      expect(labels).toEqual([
        "Rentabilidade Programado",
        "Rentabilidade Execução",
        "Aderência Programação",
        "Eliminação de Restrições",
      ]);
    });

    it("deve chamar KpiCard apenas para Reprogramações", () => {
      renderComponent();

      expect(mockKpiCard).toHaveBeenCalledTimes(1);

      const props = mockKpiCard.mock.calls[0][0];

      expect(props.label).toBe("Reprogramações");
    });
  });
});
