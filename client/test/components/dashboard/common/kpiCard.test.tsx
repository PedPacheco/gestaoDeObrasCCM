// KpiCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { KpiCard } from "@/components/dashboard/common/KpiCard";

// ── Helpers ──────────────────────────────────────────────────────
const defaultProps = {
  label: "Receita Total",
  value: "R$ 150.000",
  gradient: "bg-gradient-to-br from-blue-900 to-blue-800",
  accent: "#3b82f6",
};

const renderCard = (overrides: Record<string, any> = {}) =>
  render(<KpiCard {...defaultProps} {...overrides} />);

// ── Testes ───────────────────────────────────────────────────────
describe("KpiCard", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Renderização básica
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("renderização básica", () => {
    it("exibe o label", () => {
      renderCard();
      expect(screen.getByText("Receita Total")).toBeInTheDocument();
    });

    it("exibe o value quando é string", () => {
      renderCard({ value: "R$ 50.000" });
      expect(screen.getByText("R$ 50.000")).toBeInTheDocument();
    });

    it("exibe o value quando é number", () => {
      renderCard({ value: 42000 });
      expect(screen.getByText("42000")).toBeInTheDocument();
    });

    it("exibe o value zero", () => {
      renderCard({ value: 0 });
      expect(screen.getByText("0")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. Accent bar
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("accent bar", () => {
    it("renderiza a barra com a cor accent correta", () => {
      const { container } = renderCard({ accent: "#ef4444" });
      const bar = container.querySelector(".absolute.top-0.left-0.w-1");
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveStyle({ background: "#ef4444" });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. Gradient
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("gradient", () => {
    it("aplica a classe de gradient no container", () => {
      const { container } = renderCard({
        gradient: "bg-gradient-to-br from-emerald-900 to-emerald-800",
      });
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("bg-gradient-to-br");
      expect(card.className).toContain("from-emerald-900");
      expect(card.className).toContain("to-emerald-800");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. Comportamento clicável
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("comportamento clicável", () => {
    it("chama onClick ao clicar quando fornecido", () => {
      const handleClick = vi.fn();
      renderCard({ onClick: handleClick });

      const card = screen.getByText("Receita Total").closest(".rounded-2xl")!;
      fireEvent.click(card);

      expect(handleClick).toHaveBeenCalledOnce();
    });

    it("aplica classes de interação quando onClick está presente", () => {
      const { container } = renderCard({ onClick: vi.fn() });
      const card = container.firstChild as HTMLElement;

      expect(card.className).toContain("cursor-pointer");
      expect(card.className).toContain("hover:scale-[1.02]");
      expect(card.className).toContain("hover:shadow-2xl");
      expect(card.className).toContain("active:scale-[0.99]");
    });

    it("não aplica classes de interação quando onClick é undefined", () => {
      const { container } = renderCard();
      const card = container.firstChild as HTMLElement;

      expect(card.className).not.toContain("cursor-pointer");
      expect(card.className).not.toContain("hover:scale-[1.02]");
      expect(card.className).not.toContain("active:scale-[0.99]");
    });

    it("não dispara erro ao clicar sem onClick", () => {
      const { container } = renderCard();
      const card = container.firstChild as HTMLElement;

      expect(() => fireEvent.click(card)).not.toThrow();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. Sub-itens
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("sub-itens", () => {
    const subItems = [
      { subLabel: "Meta:", subValue: "R$ 120.000" },
      { subLabel: "Realizado:", subValue: "R$ 150.000" },
    ];

    it("renderiza todos os sub-itens quando fornecidos", () => {
      renderCard({ sub: subItems });

      expect(screen.getByText("Meta:")).toBeInTheDocument();
      expect(screen.getByText("R$ 120.000")).toBeInTheDocument();
      expect(screen.getByText("Realizado:")).toBeInTheDocument();
      expect(screen.getAllByText("R$ 150.000")).toHaveLength(2);
    });

    it("renderiza o grid com grid-cols-2", () => {
      const { container } = renderCard({ sub: subItems });
      const grid = container.querySelector(".grid.grid-cols-2");
      expect(grid).toBeInTheDocument();
    });

    it("não renderiza a seção de sub-itens quando sub é undefined", () => {
      const { container } = renderCard();
      const grid = container.querySelector(".grid.grid-cols-2");
      expect(grid).toBeNull();
    });

    it("não renderiza a seção de sub-itens quando sub é array vazio", () => {
      const { container } = renderCard({ sub: [] });
      const grid = container.querySelector(".grid.grid-cols-2");
      expect(grid).toBeNull();
    });

    it("renderiza corretamente com um único sub-item", () => {
      renderCard({ sub: [{ subLabel: "Variação:", subValue: "+12%" }] });

      expect(screen.getByText("Variação:")).toBeInTheDocument();
      expect(screen.getByText("+12%")).toBeInTheDocument();
    });

    it("renderiza corretamente com muitos sub-itens", () => {
      const manySubs = Array.from({ length: 6 }, (_, i) => ({
        subLabel: `Item ${i}:`,
        subValue: `Val ${i}`,
      }));
      renderCard({ sub: manySubs });

      manySubs.forEach((item) => {
        expect(screen.getByText(item.subLabel)).toBeInTheDocument();
        expect(screen.getByText(item.subValue)).toBeInTheDocument();
      });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. ringCard (slot de conteúdo)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("ringCard", () => {
    it("renderiza o ReactNode passado como ringCard", () => {
      renderCard({
        ringCard: <div data-testid="ring-mock">85%</div>,
      });
      expect(screen.getByTestId("ring-mock")).toBeInTheDocument();
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("não renderiza nada extra quando ringCard é undefined", () => {
      const { container } = renderCard();
      expect(container.querySelector("[data-testid='ring-mock']")).toBeNull();
    });

    it("renderiza componentes complexos como ringCard", () => {
      renderCard({
        ringCard: (
          <div data-testid="complex-ring">
            <svg>
              <circle cx="20" cy="20" r="15" />
            </svg>
            <span>90%</span>
          </div>
        ),
      });
      expect(screen.getByTestId("complex-ring")).toBeInTheDocument();
      expect(screen.getByText("90%")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. Estrutura e layout
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("estrutura e layout", () => {
    it("o container raiz tem altura fixa h-[120px]", () => {
      const { container } = renderCard();
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("h-[120px]");
    });

    it("o container raiz tem rounded-2xl e shadow-lg", () => {
      const { container } = renderCard();
      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain("rounded-2xl");
      expect(card.className).toContain("shadow-lg");
    });

    it("o label tem classes de estilo uppercase e tracking-widest", () => {
      renderCard();
      const label = screen.getByText("Receita Total");
      expect(label.className).toContain("uppercase");
      expect(label.className).toContain("tracking-widest");
    });

    it("o value tem classe font-black e text-3xl", () => {
      renderCard({ value: "R$ 99.999" });
      const value = screen.getByText("R$ 99.999");
      expect(value.className).toContain("font-black");
      expect(value.className).toContain("text-3xl");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. Cenário completo
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("cenário completo", () => {
    it("renderiza todos os elementos juntos corretamente", () => {
      const handleClick = vi.fn();

      renderCard({
        label: "Faturamento",
        value: "R$ 1.200.000",
        gradient: "bg-gradient-to-br from-violet-900 to-violet-800",
        accent: "#8b5cf6",
        onClick: handleClick,
        ringCard: <div data-testid="ring">78%</div>,
        sub: [
          { subLabel: "Previsto:", subValue: "R$ 1.000.000" },
          { subLabel: "Desvio:", subValue: "+20%" },
        ],
      });

      // Label e value
      expect(screen.getByText("Faturamento")).toBeInTheDocument();
      expect(screen.getByText("R$ 1.200.000")).toBeInTheDocument();

      // Ring
      expect(screen.getByTestId("ring")).toBeInTheDocument();
      expect(screen.getByText("78%")).toBeInTheDocument();

      // Sub-itens
      expect(screen.getByText("Previsto:")).toBeInTheDocument();
      expect(screen.getByText("R$ 1.000.000")).toBeInTheDocument();
      expect(screen.getByText("Desvio:")).toBeInTheDocument();
      expect(screen.getByText("+20%")).toBeInTheDocument();

      // Click
      const card = screen.getByText("Faturamento").closest(".rounded-2xl")!;
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledOnce();
    });
  });
});
