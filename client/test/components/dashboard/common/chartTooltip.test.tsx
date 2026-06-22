// ChartTooltip.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChartTooltip } from "@/components/dashboard/common/ChartTooltip";

// ── Mocks das funções de formatação ──────────────────────────────
vi.mock("@/utils/formatValue", () => ({
  FormatCurrency: vi.fn((v: number) => `R$ ${v.toFixed(2)}`),
  formatPercentage: vi.fn((v: number) => `${(v * 100).toFixed(1)}%`),
  NUM: vi.fn((v: number) => v.toLocaleString("pt-BR")),
}));

// ── Helpers ──────────────────────────────────────────────────────
const basePayloadItem = (overrides: Record<string, any> = {}) => ({
  name: "Receita",
  value: 1500,
  dataKey: "receita",
  color: "#3b82f6",
  fill: "#3b82f6",
  payload: {},
  ...overrides,
});

const renderTooltip = (props: Record<string, any>) =>
  render(<ChartTooltip {...props} />);

// ── Testes ───────────────────────────────────────────────────────
describe("ChartTooltip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Renderização condicional — não renderiza
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("quando não deve renderizar", () => {
    it("retorna null se active=false", () => {
      const { container } = renderTooltip({
        active: false,
        payload: [basePayloadItem()],
        label: "Jan",
      });
      expect(container.innerHTML).toBe("");
    });

    it("retorna null se payload está vazio", () => {
      const { container } = renderTooltip({
        active: true,
        payload: [],
        label: "Jan",
      });
      expect(container.innerHTML).toBe("");
    });

    it("retorna null se payload é undefined", () => {
      const { container } = renderTooltip({
        active: true,
        payload: undefined,
        label: "Jan",
      });
      expect(container.innerHTML).toBe("");
    });

    it("retorna null se payload é null", () => {
      const { container } = renderTooltip({
        active: true,
        payload: null,
        label: "Jan",
      });
      expect(container.innerHTML).toBe("");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Label e Turma
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("label e turma", () => {
    it("exibe o label quando fornecido", () => {
      renderTooltip({
        active: true,
        payload: [basePayloadItem()],
        label: "Janeiro",
      });
      expect(screen.getByText("Janeiro")).toBeInTheDocument();
    });

    it("não exibe label quando ausente", () => {
      const { container } = renderTooltip({
        active: true,
        payload: [basePayloadItem()],
      });
      // Não deve haver o div de label (font-bold text-white mb-2 text-sm)
      expect(container.querySelector(".font-bold.text-sm")).toBeNull();
    });

    it("exibe a turma quando presente no payload data", () => {
      renderTooltip({
        active: true,
        payload: [basePayloadItem({ payload: { turma: "Turma A" } })],
        label: "Jan",
      });
      expect(screen.getByText("Turma A")).toBeInTheDocument();
    });

    it("não exibe turma quando ausente no payload data", () => {
      renderTooltip({
        active: true,
        payload: [basePayloadItem({ payload: {} })],
        label: "Jan",
      });
      expect(screen.queryByText(/Turma/)).toBeNull();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. Formatação de valores — Currency (default)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("formatação currency (padrão)", () => {
    it("formata como moeda quando metricConfig não é 'number' e campo não é percentual", () => {
      renderTooltip({
        active: true,
        payload: [basePayloadItem({ value: 2500 })],
        label: "Fev",
        metricConfig: "currency",
        percentageFields: [],
      });
      expect(screen.getByText("R$ 2500.00")).toBeInTheDocument();
    });

    it("formata como moeda quando metricConfig é undefined", () => {
      renderTooltip({
        active: true,
        payload: [basePayloadItem({ value: 100 })],
        label: "Mar",
      });
      expect(screen.getByText("R$ 100.00")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. Formatação de valores — Number
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("formatação number", () => {
    it("formata como número quando metricConfig='number'", () => {
      renderTooltip({
        active: true,
        payload: [basePayloadItem({ value: 42000 })],
        label: "Abr",
        metricConfig: "number",
        percentageFields: [],
      });
      // NUM(42000) → "42.000" (pt-BR locale)
      expect(screen.getByText("42.000")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. Formatação de valores — Percentage
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("formatação percentual", () => {
    it("formata como percentual quando dataKey está em percentageFields", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({ dataKey: "taxa", value: 0.85, name: "Taxa" }),
        ],
        label: "Mai",
        percentageFields: ["taxa"],
      });
      expect(screen.getByText("85.0%")).toBeInTheDocument();
    });

    it("não formata como percentual quando dataKey NÃO está em percentageFields", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({ dataKey: "receita", value: 0.85, name: "Receita" }),
        ],
        label: "Mai",
        percentageFields: ["taxa"],
      });
      // Deve cair no FormatCurrency, não no formatPercentage
      expect(screen.getByText("R$ 0.85")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. Múltiplos itens no payload
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("múltiplos itens", () => {
    it("renderiza todos os itens do payload", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({ name: "Receita", value: 1000, color: "#3b82f6" }),
          basePayloadItem({ name: "Custo", value: 500, color: "#ef4444" }),
          basePayloadItem({ name: "Lucro", value: 500, color: "#22c55e" }),
        ],
        label: "Jun",
      });
      expect(screen.getByText("Receita:")).toBeInTheDocument();
      expect(screen.getByText("Custo:")).toBeInTheDocument();
      expect(screen.getByText("Lucro:")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. Cor do bullet — fallback para fill
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("cor do indicador", () => {
    it("usa p.color quando disponível", () => {
      const { container } = renderTooltip({
        active: true,
        payload: [basePayloadItem({ color: "#ff0000", fill: "#00ff00" })],
        label: "Jul",
      });
      const dot = container.querySelector(".rounded-full");
      expect(dot).toHaveStyle({ background: "#ff0000" });
    });

    it("faz fallback para p.fill quando color é undefined", () => {
      const { container } = renderTooltip({
        active: true,
        payload: [basePayloadItem({ color: undefined, fill: "#00ff00" })],
        label: "Ago",
      });
      const dot = container.querySelector(".rounded-full");
      expect(dot).toHaveStyle({ background: "#00ff00" });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. Campo extra — Diferença Acum.
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("Diferença Acum.", () => {
    it("exibe com sinal + e cor verde quando positivo", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({
            payload: { "Diferença Acum.": 5 },
          }),
        ],
        label: "Set",
      });
      const el = screen.getByText("+5");
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass("text-green-400");
    });

    it("exibe com cor vermelha quando negativo", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({
            payload: { "Diferença Acum.": -3 },
          }),
        ],
        label: "Out",
      });
      const el = screen.getByText("-3");
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass("text-red-500");
    });

    it("exibe com cor vermelha quando zero (não é > 0)", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({
            payload: { "Diferença Acum.": 0 },
          }),
        ],
        label: "Nov",
      });
      const el = screen.getByText("0");
      expect(el).toBeInTheDocument();
      expect(el).toHaveClass("text-red-500");
    });

    it("não exibe quando Diferença Acum. é undefined", () => {
      renderTooltip({
        active: true,
        payload: [basePayloadItem({ payload: {} })],
        label: "Dez",
      });
      expect(screen.queryByText("Diferença Acum.:")).toBeNull();
    });

    it("não exibe quando Diferença Acum. é null", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({
            payload: { "Diferença Acum.": null },
          }),
        ],
        label: "Dez",
      });
      expect(screen.queryByText("Diferença Acum.:")).toBeNull();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. Campo extra — count (Quantidade)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("count (Quantidade)", () => {
    it("exibe a quantidade quando count está presente", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({
            payload: { count: 42 },
          }),
        ],
        label: "Jan",
      });
      expect(screen.getByText("Quantidade")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("não exibe quando count é falsy (0)", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({
            payload: { count: 0 },
          }),
        ],
        label: "Jan",
      });
      expect(screen.queryByText("Quantidade")).toBeNull();
    });

    it("não exibe quando count é undefined", () => {
      renderTooltip({
        active: true,
        payload: [basePayloadItem({ payload: {} })],
        label: "Jan",
      });
      expect(screen.queryByText("Quantidade")).toBeNull();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 10. Campo extra — moNaoExecutada
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("moNaoExecutada", () => {
    it("exibe MO não executada formatada como moeda", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({
            payload: { moNaoExecutada: 7500 },
          }),
        ],
        label: "Fev",
      });
      expect(screen.getByText("MO não executada")).toBeInTheDocument();
      expect(screen.getByText("R$ 7500.00")).toBeInTheDocument();
    });

    it("não exibe quando moNaoExecutada é falsy (0)", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({
            payload: { moNaoExecutada: 0 },
          }),
        ],
        label: "Fev",
      });
      expect(screen.queryByText("MO não executada")).toBeNull();
    });

    it("não exibe quando moNaoExecutada é undefined", () => {
      renderTooltip({
        active: true,
        payload: [basePayloadItem({ payload: {} })],
        label: "Fev",
      });
      expect(screen.queryByText("MO não executada")).toBeNull();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 11. Separador visual
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("separador", () => {
    it("renderiza o separador horizontal", () => {
      const { container } = renderTooltip({
        active: true,
        payload: [basePayloadItem()],
        label: "Mar",
      });
      const separator = container.querySelector(".border-t.border-white\\/10");
      expect(separator).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 12. Cenário completo — todos os campos extras presentes
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("cenário completo", () => {
    it("renderiza turma, label, payload items e todos os campos extras", () => {
      const fullPayload = {
        turma: "Turma B",
        "Diferença Acum.": 12,
        count: 99,
        moNaoExecutada: 3200,
      };

      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({
            name: "Realizado",
            value: 5000,
            dataKey: "realizado",
            payload: fullPayload,
          }),
          basePayloadItem({
            name: "Meta",
            value: 4000,
            dataKey: "meta",
            color: "#f59e0b",
            payload: fullPayload,
          }),
        ],
        label: "2024-Q1",
        metricConfig: "currency",
        percentageFields: [],
      });

      // Turma
      expect(screen.getByText("Turma B")).toBeInTheDocument();
      // Label
      expect(screen.getByText("2024-Q1")).toBeInTheDocument();
      // Payload items
      expect(screen.getByText("Realizado:")).toBeInTheDocument();
      expect(screen.getByText("Meta:")).toBeInTheDocument();
      // Diferença Acum.
      expect(screen.getByText("+12")).toBeInTheDocument();
      // Quantidade
      expect(screen.getByText("99")).toBeInTheDocument();
      // MO não executada
      expect(screen.getByText("R$ 3200.00")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 13. Prioridade de formatação — percentage > number > currency
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("prioridade de formatação", () => {
    it("percentageFields tem prioridade sobre metricConfig='number'", () => {
      renderTooltip({
        active: true,
        payload: [
          basePayloadItem({ dataKey: "taxa", value: 0.75, name: "Taxa" }),
        ],
        label: "Abr",
        metricConfig: "number",
        percentageFields: ["taxa"],
      });
      // Deve usar formatPercentage, não NUM
      expect(screen.getByText("75.0%")).toBeInTheDocument();
    });
  });
});
