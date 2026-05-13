// financialValuesModal.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { FinancialValuesModal } from "@/components/executionCapacity/financialValuesModal";

// Mock do Modal
vi.mock("@/components/common/Modal", () => ({
  default: ({
    children,
    title,
    open,
  }: {
    children: React.ReactNode;
    title: string;
    open: boolean;
  }) =>
    open ? (
      <div data-testid="modal-component">
        <span>{title}</span>
        {children}
      </div>
    ) : null,
}));

// Mock do formatter
vi.mock("@/utils/formatValue", () => ({
  FormatCurrency: vi.fn((value: number) => `R$ ${value}`),
}));

describe("FinancialValuesModal", () => {
  const onCloseMock = vi.fn();

  const mockData = [
    {
      ano: 2025,
      regional: "Sul",
      parceira: "Parceira A",
      total_rfp: 1000,
      jan: 100,
      fev: 200,
      mar: 300,
      abr: 400,
      mai: 500,
      jun: 600,
      jul: 700,
      ago: 800,
      set: 900,
      out: 1000,
      nov: 1100,
      dez: 1200,
    },
    {
      ano: 2026,
      regional: "Norte",
      parceira: "Parceira B",
      total_rfp: 2000,
      jan: 150,
      fev: 250,
      mar: 350,
      abr: 450,
      mai: 550,
      jun: 650,
      jul: 750,
      ago: 850,
      set: 950,
      out: 1050,
      nov: 1150,
      dez: 1250,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderização", () => {
    it("deve renderizar o modal corretamente quando open=true", () => {
      render(
        <FinancialValuesModal
          data={mockData}
          open={true}
          onClose={onCloseMock}
        />,
      );

      expect(screen.getByTestId("modal-component")).toBeInTheDocument();

      expect(screen.getByText("FINANCEIRO")).toBeInTheDocument();
    });

    it("não deve renderizar o modal quando open=false", () => {
      render(
        <FinancialValuesModal
          data={mockData}
          open={false}
          onClose={onCloseMock}
        />,
      );

      expect(screen.queryByTestId("modal-component")).not.toBeInTheDocument();
    });

    it("deve renderizar todas as colunas da tabela", () => {
      render(
        <FinancialValuesModal
          data={mockData}
          open={true}
          onClose={onCloseMock}
        />,
      );

      const expectedHeaders = [
        "Ano",
        "Regional",
        "Parceira",
        "Total RFP",
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
      ];

      expectedHeaders.forEach((header) => {
        expect(screen.getByText(header)).toBeInTheDocument();
      });
    });

    it("deve renderizar os dados da tabela corretamente", () => {
      render(
        <FinancialValuesModal
          data={mockData}
          open={true}
          onClose={onCloseMock}
        />,
      );

      expect(screen.getByText("Sul")).toBeInTheDocument();
      expect(screen.getByText("Norte")).toBeInTheDocument();

      expect(screen.getByText("Parceira A")).toBeInTheDocument();
      expect(screen.getByText("Parceira B")).toBeInTheDocument();
    });
  });

  describe("Formatação de valores", () => {
    it("deve formatar todos os valores numéricos usando FormatCurrency", async () => {
      const { FormatCurrency } = await import("@/utils/formatValue");

      render(
        <FinancialValuesModal
          data={mockData}
          open={true}
          onClose={onCloseMock}
        />,
      );

      expect(FormatCurrency).toHaveBeenCalled();

      expect(screen.getAllByText(/R\$ /)).not.toHaveLength(0);
    });

    it("deve renderizar valores string sem formatação", () => {
      render(
        <FinancialValuesModal
          data={mockData}
          open={true}
          onClose={onCloseMock}
        />,
      );

      expect(screen.getByText("Sul")).toBeInTheDocument();
      expect(screen.getByText("Parceira A")).toBeInTheDocument();
    });
  });

  describe("Totais do footer", () => {
    it("deve calcular e renderizar os totais corretamente", () => {
      render(
        <FinancialValuesModal
          data={mockData}
          open={true}
          onClose={onCloseMock}
        />,
      );

      // total_rfp = 1000 + 2000
      expect(screen.getByText("R$ 3000")).toBeInTheDocument();

      // jan = 100 + 150
      expect(screen.getAllByText("R$ 250")).toHaveLength(2);

      // dez = 1200 + 1250
      expect(screen.getByText("R$ 2450")).toBeInTheDocument();
    });

    it('deve renderizar "TOTAL" na primeira coluna do footer', () => {
      render(
        <FinancialValuesModal
          data={mockData}
          open={true}
          onClose={onCloseMock}
        />,
      );

      expect(screen.getByText("TOTAL")).toBeInTheDocument();
    });

    it("deve renderizar vazio na segunda e terceira coluna do footer", () => {
      render(
        <FinancialValuesModal
          data={mockData}
          open={true}
          onClose={onCloseMock}
        />,
      );

      const emptyCells = screen
        .getAllByRole("cell")
        .filter((cell) => cell.textContent === "");

      expect(emptyCells.length).toBeGreaterThan(0);
    });

    it("deve renderizar total 0 quando não houver valores numéricos", () => {
      const emptyData = [
        {
          ano: "2025",
          regional: "Sul",
          parceira: "Parceira A",
        },
      ];

      render(
        <FinancialValuesModal
          data={emptyData}
          open={true}
          onClose={onCloseMock}
        />,
      );

      expect(screen.getAllByText("R$ 0").length).toBeGreaterThan(0);
    });
  });

  describe("Cobertura de branches", () => {
    it("deve lidar corretamente com valores undefined", () => {
      const dataWithUndefined = [
        {
          ano: 2025,
          regional: "Sul",
          parceira: "Parceira A",
          jan: undefined,
          fev: null,
          mar: 100,
        },
      ];

      render(
        <FinancialValuesModal
          data={dataWithUndefined as any}
          open={true}
          onClose={onCloseMock}
        />,
      );

      expect(screen.getAllByText("R$ 100")).toHaveLength(2);
    });

    it("deve renderizar tabela vazia corretamente", () => {
      render(
        <FinancialValuesModal data={[]} open={true} onClose={onCloseMock} />,
      );

      expect(screen.getByText("TOTAL")).toBeInTheDocument();
    });
  });
});
