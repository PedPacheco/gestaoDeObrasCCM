// test/components/dashboard/AvancaParceiro/kpiSection.test.tsx

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { KpiSection } from "@/components/dashboard/AvancaParceiro/DashAvancaParceiro/kpiSection";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOISTED MOCKS (somente UI / IO)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { mockRingCard, mockKpiCard, mockFormatCurrency, mockNUM, mockPctColor } =
  vi.hoisted(() => ({
    mockRingCard: vi.fn(),
    mockKpiCard: vi.fn(),

    mockFormatCurrency: vi.fn((value: number) => `currency:${value}`),
    mockNUM: vi.fn((value: number) => `num:${value}`),

    mockPctColor: vi.fn((pct: number) => ({
      bar: `bar-${pct}`,
    })),
  }));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCKS VÁLIDOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

vi.mock("@/utils/formatValue", () => ({
  FormatCurrency: mockFormatCurrency,
  NUM: mockNUM,
}));

vi.mock("@/components/dashboard/common/KpiCard", () => ({
  KpiCard: (props: any) => {
    mockKpiCard(props);
    return <div data-testid="kpi-card" />;
  },
}));

vi.mock("@/components/dashboard/common/RingCard", () => ({
  RingCard: (props: any) => {
    mockRingCard(props);
    return <div data-testid="ring-card" />;
  },
}));

// ✅ apenas pctColor continua mockado (vem de outro módulo)
vi.mock("@/components/dashboard/DashboardClient", () => ({
  pctColor: mockPctColor,
}));

// ❌ NÃO mockar:
// pctExact
// pctColorGripSchedule
// pctColorRestrictionsElimination

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
  ],

  dailyGoal: 200,
};

function renderComponent(overrides: Partial<typeof defaultProps> = {}) {
  return render(<KpiSection {...defaultProps} {...overrides} />);
}

function getRingProps(label: string) {
  return mockRingCard.mock.calls
    .map((c) => c[0])
    .find((p) => p.label === label);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("KpiSection", () => {
  describe("render base", () => {
    it("renderiza 4 ring cards e 1 kpi card", () => {
      renderComponent();

      expect(screen.getAllByTestId("ring-card")).toHaveLength(4);
      expect(screen.getAllByTestId("kpi-card")).toHaveLength(1);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENTABILIDADE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Rentabilidade Programado", () => {
    it("calcula corretamente", () => {
      renderComponent();

      const props = getRingProps("Rentabilidade Programado");

      expect(props.value).toBe(25);
      expect(props.color).toBe("bar-25");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ADERÊNCIA (usa lógica real)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Aderência Programação", () => {
    it("usa verde quando >= 85", () => {
      renderComponent();

      const props = getRingProps("Aderência Programação");

      expect(props.value).toBe(90);
      expect(props.color).toBe("#53FF75");
    });

    it("usa amarelo entre 71 e 84", () => {
      renderComponent({
        aderencia: [
          {
            week: "W1",
            total: 100,
            executed: 80,
            partialExecuted: 0,
            notExecuted: 20,
            notInformed: 0,
            pct: 80,
          },
        ],
      });

      const props = getRingProps("Aderência Programação");

      expect(props.color).toBe("#facc15");
    });

    it("usa vermelho < 71", () => {
      renderComponent({
        aderencia: [
          {
            week: "W1",
            total: 100,
            executed: 50,
            partialExecuted: 0,
            notExecuted: 50,
            notInformed: 0,
            pct: 50,
          },
        ],
      });

      const props = getRingProps("Aderência Programação");

      expect(props.color).toBe("#ef4444");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ELIMINAÇÃO (AGORA TESTANDO BRANCH REAL 🔥)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Eliminação de Restrições", () => {
    it("usa vermelho < 86", () => {
      renderComponent();

      const props = getRingProps("Eliminação de Restrições");

      expect(props.value).toBe(83);
      expect(props.color).toBe("#ef4444"); // 83 → amarelo
    });

    it("usa amarelo entre 86 e 99", () => {
      renderComponent({
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

      const props = getRingProps("Eliminação de Restrições");

      expect(props.value).toBe(90);
      expect(props.color).toBe("#facc15");
    });

    it("usa verde quando >= 100 ✅ (branch crítico)", () => {
      renderComponent({
        eliminacao: [
          {
            month: "Jan",
            total: 100,
            withRestriction: 0,
            withoutRestriction: 100,
            pct: 100,
          },
        ],
      });

      const props = getRingProps("Eliminação de Restrições");

      expect(props.value).toBe(100);
      expect(props.color).toBe("#53FF75"); // ✅ branch coberto
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // KPI CARD
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("Reprogramações", () => {
    it("soma corretamente", () => {
      renderComponent();

      const props = mockKpiCard.mock.calls[0][0];

      expect(props.value).toBe("currency:10");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EDGE CASES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("edge cases", () => {
    it("funciona com dados vazios", () => {
      renderComponent({
        aderencia: [],
        eliminacao: [],
        reasonsReascheduling: [],
        taxaExec: { exec: 0, prog: 0 },
      });

      const elim = getRingProps("Eliminação de Restrições");

      expect(elim.value).toBe(0);
      expect(elim.color).toBe("#ef4444");
    });
  });
});
