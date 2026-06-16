// GroupSummaryTable.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

import type {
  GroupSummary,
  GroupSummaryItem,
} from "@/types/dashboard/labor/labor";
import { GroupSummaryTable } from "@/components/dashboard/laborDashboard/GroupSummaryTable";

// ── Mocks ────────────────────────────────────────────────────────
vi.mock("@/utils/formatValue", () => ({
  FormatCurrency: vi.fn((v: number) => `R$ ${v.toFixed(2)}`),
}));

vi.mock("./GroupSummaryRow", () => ({
  GroupSummaryRow: vi.fn(({ row, index }) => (
    <tr data-testid={`group-row-${index}`}>
      <td data-testid="row-grupo">{row.grupo}</td>
      <td data-testid="row-turma">{row.turma}</td>
      <td data-testid="row-prog">{row.totalMoProg}</td>
      <td data-testid="row-exec">{row.totalMoExec}</td>
    </tr>
  )),
}));

vi.mock("../common/performanceBadge", () => ({
  PerformanceBadge: vi.fn(({ percentage, colors }) => (
    <span
      data-testid="performance-badge"
      data-percentage={percentage.toFixed(2)}
      data-color={colors?.text ?? ""}
    >
      {percentage.toFixed(2)}%
    </span>
  )),
}));

vi.mock("@/components/dashboard/DashboardClient", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/components/dashboard/DashboardClient")
    >();

  return {
    ...actual,
    pctColor: vi.fn(actual.pctColor),
  };
});

import { pctColor } from "@/components/dashboard/DashboardClient";

// ── Helpers ──────────────────────────────────────────────────────
const makeSummaryRow = (
  overrides: Partial<GroupSummaryItem> = {},
): GroupSummaryItem => ({
  grupo: "Grupo A",
  turma: "Parceira Alpha",
  qtdeSchedules: 5,
  totalMoPlan: 12000,
  totalMoProg: 10000,
  totalMoExec: 8000,
  totalMoPrev: 9000,
  ...overrides,
});

const makeTotals = (
  overrides: Partial<GroupSummary["totals"]> = {},
): GroupSummary["totals"] => ({
  totalSchedules: 0,
  totalMoPlanByGrouping: 0,
  totalMoPendByGrouping: 0,
  totalMoProgByGrouping: 0,
  totalMoExecByGrouping: 0,
  totalMoPrevByGrouping: 0,
  totalWalletRda: 0,
  totalProgRda: 0,
  totalExecRda: 0,
  totalWalletBt0: 0,
  totalProgBt0: 0,
  totalExecBt0: 0,
  totalWalletRecom: 0,
  totalProgRecom: 0,
  totalExecRecom: 0,
  totalWalletMarket: 0,
  totalProgMarket: 0,
  totalExecMarket: 0,
  totalDiff: 0,
  ...overrides,
});

const makeData = (overrides: Partial<GroupSummary> = {}): GroupSummary => ({
  summary: [
    makeSummaryRow({
      grupo: "Grupo A",
      turma: "Parceira Alpha",
      qtdeSchedules: 5,
      totalMoPlan: 12000,
      totalMoProg: 10000,
      totalMoExec: 8000,
      totalMoPrev: 9000,
    }),
    makeSummaryRow({
      grupo: "Grupo B",
      turma: "Parceira Beta",
      qtdeSchedules: 3,
      totalMoPlan: 22000,
      totalMoProg: 20000,
      totalMoExec: 15000,
      totalMoPrev: 18000,
    }),
  ],
  totals: makeTotals({
    totalSchedules: 5,
    totalMoProgByGrouping: 30000,
    totalMoExecByGrouping: 15000,
    totalMoPrevByGrouping: 5000,
  }),
  ...overrides,
});

const renderTable = (data?: GroupSummary) =>
  render(<GroupSummaryTable data={data ?? makeData()} />);

// ── Testes ───────────────────────────────────────────────────────
describe("GroupSummaryTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Renderização básica
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("renderização básica", () => {
    it("exibe o título 'Detalhe por Grupo / Parceira'", () => {
      renderTable();
      expect(
        screen.getByText("Detalhe por Grupo / Parceira"),
      ).toBeInTheDocument();
    });

    it("renderiza os 6 cabeçalhos da tabela", () => {
      renderTable();
      ["Grupo", "Parceira", "Programado", "Executado", "Previsto", "%"].forEach(
        (header) => {
          expect(screen.getByText(header)).toBeInTheDocument();
        },
      );
    });

    it("renderiza o label 'Totais' no footer", () => {
      renderTable();
      expect(screen.getByText("Totais")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Linhas do body (GroupSummaryRow)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("linhas do body", () => {
    it("renderiza uma GroupSummaryRow para cada item do summary", () => {
      renderTable();
      expect(screen.getByTestId("group-row-0")).toBeInTheDocument();
      expect(screen.getByTestId("group-row-1")).toBeInTheDocument();
      expect(screen.queryByTestId("group-row-2")).toBeNull();
    });

    it("renderiza zero linhas quando summary está vazio", () => {
      renderTable(
        makeData({
          summary: [],
          totals: makeTotals({
            totalMoProgByGrouping: 0,
            totalMoExecByGrouping: 0,
            totalMoPrevByGrouping: 0,
          }),
        }),
      );
      expect(screen.queryByTestId("group-row-0")).toBeNull();
    });

    it("passa row e index corretos para cada GroupSummaryRow", async () => {
      const { GroupSummaryRow } =
        await import("@/components/dashboard/laborDashboard/GroupSummaryRow");

      renderTable();

      const calls = (GroupSummaryRow as unknown as ReturnType<typeof vi.fn>)
        .mock.calls;

      expect(calls[0][0]).toEqual(
        expect.objectContaining({
          index: expect.any(Number),
          row: expect.objectContaining({ grupo: expect.any(String) }),
        }),
      );
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. Ordenação
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("ordenação", () => {
    it("ordena por grupo (alfabético) como critério primário", () => {
      const data = makeData({
        summary: [
          makeSummaryRow({ grupo: "Grupo C", turma: "T1", totalMoProg: 100 }),
          makeSummaryRow({ grupo: "Grupo A", turma: "T1", totalMoProg: 100 }),
          makeSummaryRow({ grupo: "Grupo B", turma: "T1", totalMoProg: 100 }),
        ],
      });

      renderTable(data);

      const row0 = within(screen.getByTestId("group-row-0"));
      const row1 = within(screen.getByTestId("group-row-1"));
      const row2 = within(screen.getByTestId("group-row-2"));

      expect(row0.getByTestId("row-grupo").textContent).toBe("Grupo A");
      expect(row1.getByTestId("row-grupo").textContent).toBe("Grupo B");
      expect(row2.getByTestId("row-grupo").textContent).toBe("Grupo C");
    });

    it("ordena por turma (alfabético) como critério secundário dentro do mesmo grupo", () => {
      const data = makeData({
        summary: [
          makeSummaryRow({ grupo: "Grupo A", turma: "Zeta", totalMoProg: 100 }),
          makeSummaryRow({
            grupo: "Grupo A",
            turma: "Alpha",
            totalMoProg: 100,
          }),
          makeSummaryRow({ grupo: "Grupo A", turma: "Beta", totalMoProg: 100 }),
        ],
      });

      renderTable(data);

      const row0 = within(screen.getByTestId("group-row-0"));
      const row1 = within(screen.getByTestId("group-row-1"));
      const row2 = within(screen.getByTestId("group-row-2"));

      expect(row0.getByTestId("row-turma").textContent).toBe("Alpha");
      expect(row1.getByTestId("row-turma").textContent).toBe("Beta");
      expect(row2.getByTestId("row-turma").textContent).toBe("Zeta");
    });

    it("ordena por totalMoProg (decrescente) como critério terciário", () => {
      const data = makeData({
        summary: [
          makeSummaryRow({
            grupo: "Grupo A",
            turma: "Alpha",
            totalMoProg: 500,
          }),
          makeSummaryRow({
            grupo: "Grupo A",
            turma: "Alpha",
            totalMoProg: 2000,
          }),
          makeSummaryRow({
            grupo: "Grupo A",
            turma: "Alpha",
            totalMoProg: 1000,
          }),
        ],
      });

      renderTable(data);

      const row0 = within(screen.getByTestId("group-row-0"));
      const row1 = within(screen.getByTestId("group-row-1"));
      const row2 = within(screen.getByTestId("group-row-2"));

      expect(row0.getByTestId("row-prog").textContent).toBe("2000");
      expect(row1.getByTestId("row-prog").textContent).toBe("1000");
      expect(row2.getByTestId("row-prog").textContent).toBe("500");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. Footer — totais formatados
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("footer — totais", () => {
    it("exibe totalMoProgByGrouping formatado como moeda", () => {
      renderTable();
      expect(screen.getByText("R$ 30000.00")).toBeInTheDocument();
    });

    it("exibe totalMoExecByGrouping formatado como moeda", () => {
      renderTable();
      expect(screen.getByText("R$ 23000.00")).toBeInTheDocument();
    });

    it("exibe totalMoPrevByGrouping formatado como moeda", () => {
      renderTable();
      expect(screen.getByText("R$ 27000.00")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. Footer — taxa de execução (PerformanceBadge)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("footer — taxa de execução", () => {
    it("calcula a taxa corretamente (exec / prog * 100)", () => {
      // 23000 / 30000 * 100 = 76.666...
      renderTable();
      const badge = screen.getByTestId("performance-badge");
      const pct = parseFloat(badge.getAttribute("data-percentage")!);
      expect(pct).toBeCloseTo(76.67, 1);
    });

    it("exibe taxa 0% quando totalMoProgByGrouping é 0 (evita divisão por zero)", () => {
      renderTable(
        makeData({
          summary: [],
          totals: makeTotals({
            totalMoProgByGrouping: 0,
            totalMoExecByGrouping: 0,
            totalMoPrevByGrouping: 0,
          }),
        }),
      );
      const badge = screen.getByTestId("performance-badge");
      expect(badge.getAttribute("data-percentage")).toBe("0.00");
    });

    it("exibe taxa 100% quando exec === prog", () => {
      renderTable(
        makeData({
          totals: makeTotals({
            totalMoProgByGrouping: 50000,
            totalMoExecByGrouping: 50000,
            totalMoPrevByGrouping: 50000,
          }),
        }),
      );
      const badge = screen.getByTestId("performance-badge");
      expect(badge.getAttribute("data-percentage")).toBe("100.00");
    });

    it("exibe taxa > 100% quando exec > prog", () => {
      renderTable(
        makeData({
          totals: makeTotals({
            totalMoProgByGrouping: 10000,
            totalMoExecByGrouping: 12000,
            totalMoPrevByGrouping: 11000,
          }),
        }),
      );
      const badge = screen.getByTestId("performance-badge");
      const pct = parseFloat(badge.getAttribute("data-percentage")!);
      expect(pct).toBeCloseTo(120.0, 1);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. pctColor — integração
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("pctColor — cores por faixa", () => {
    beforeEach(() => {
      vi.mocked(pctColor).mockClear();
    });

    it("passa cor 'red' para taxa < 80%", async () => {
      renderTable(
        makeData({
          totals: makeTotals({
            totalMoProgByGrouping: 100,
            totalMoExecByGrouping: 50,
            totalMoPrevByGrouping: 60,
          }),
        }),
      );

      expect(pctColor).toHaveBeenCalledWith(50);
      const badge = screen.getByTestId("performance-badge");
      expect(badge.getAttribute("data-color")).toBe("red");
    });

    it("passa cor 'yellow' para taxa entre 80% e 99%", async () => {
      renderTable(
        makeData({
          totals: makeTotals({
            totalMoProgByGrouping: 100,
            totalMoExecByGrouping: 90,
            totalMoPrevByGrouping: 95,
          }),
        }),
      );

      expect(pctColor).toHaveBeenCalledWith(90);
      const badge = screen.getByTestId("performance-badge");
      expect(badge.getAttribute("data-color")).toBe("yellow");
    });

    it("passa cor 'green' para taxa >= 100%", async () => {
      renderTable(
        makeData({
          totals: makeTotals({
            totalMoProgByGrouping: 100,
            totalMoExecByGrouping: 100,
            totalMoPrevByGrouping: 100,
          }),
        }),
      );

      expect(pctColor).toHaveBeenCalledWith(100);
      const badge = screen.getByTestId("performance-badge");
      expect(badge.getAttribute("data-color")).toBe("green");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. Muitas linhas
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("muitas linhas", () => {
    it("renderiza corretamente com muitos itens no summary", () => {
      const summary = Array.from({ length: 50 }, (_, i) =>
        makeSummaryRow({
          grupo: `Grupo ${String.fromCharCode(65 + (i % 26))}`,
          turma: `Turma ${i}`,
          totalMoProg: 1000 * (i + 1),
          totalMoExec: 800 * (i + 1),
        }),
      );

      renderTable(
        makeData({
          summary,
          totals: makeTotals({
            totalMoProgByGrouping: 1275000,
            totalMoExecByGrouping: 1020000,
            totalMoPrevByGrouping: 1100000,
          }),
        }),
      );

      // Verifica que todas as 50 linhas foram renderizadas
      for (let i = 0; i < 50; i++) {
        expect(screen.getByTestId(`group-row-${i}`)).toBeInTheDocument();
      }
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. FormatCurrency — chamadas
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("FormatCurrency — chamadas", () => {
    it("chama FormatCurrency 3 vezes no footer (prog, exec, prev)", async () => {
      const { FormatCurrency } = await import("@/utils/formatValue");

      renderTable();

      const calls = (FormatCurrency as unknown as ReturnType<typeof vi.fn>).mock
        .calls;
      const values = calls.map((c) => c[0]);

      expect(values).toContain(30000);
      expect(values).toContain(23000);
      expect(values).toContain(27000);
    });
  });
});
