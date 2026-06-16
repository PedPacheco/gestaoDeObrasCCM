// RingCard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RingCard } from "@/components/dashboard/common/RingCard";

// ── Helpers ──────────────────────────────────────────────────────
const defaultProps = {
  label: "Execução",
  value: 75,
  color: "#3b82f6",
};

const renderRing = (overrides: Record<string, any> = {}) =>
  render(<RingCard {...defaultProps} {...overrides} />);

const RADIUS = 36;
const CIRC = 2 * Math.PI * RADIUS;

const expectedOffset = (pct: number) => {
  const visual = Math.min(Math.max(pct, 0), 100);
  return CIRC - (visual / 100) * CIRC;
};

// ── Testes ───────────────────────────────────────────────────────
describe("RingCard", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Renderização básica
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("renderização básica", () => {
    it("exibe o label", () => {
      renderRing();
      expect(screen.getByText("Execução")).toBeInTheDocument();
    });

    it("exibe a percentagem formatada sem casas decimais", () => {
      renderRing({ value: 75 });
      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("exibe a percentagem com valor inteiro quando value tem decimais", () => {
      renderRing({ value: 83.7 });
      expect(screen.getByText("84%")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. subLabel
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("subLabel", () => {
    it("exibe subLabel quando fornecido", () => {
      renderRing({ subLabel: "Meta mensal" });
      expect(screen.getByText("Meta mensal")).toBeInTheDocument();
    });

    it("não renderiza subLabel quando undefined", () => {
      renderRing();
      const content = screen.getByText("Execução").parentElement!;
      const spans = content.querySelectorAll("span");
      // Apenas label + nenhum subLabel/sub
      expect(spans).toHaveLength(1);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. sub
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("sub", () => {
    it("exibe sub quando fornecido", () => {
      renderRing({ sub: "12 de 16 concluídos" });
      expect(screen.getByText("12 de 16 concluídos")).toBeInTheDocument();
    });

    it("não renderiza sub quando undefined", () => {
      renderRing();
      expect(screen.queryByText("concluídos")).toBeNull();
    });

    it("renderiza subLabel e sub simultaneamente", () => {
      renderRing({ subLabel: "Sprint 4", sub: "8 tarefas restantes" });
      expect(screen.getByText("Sprint 4")).toBeInTheDocument();
      expect(screen.getByText("8 tarefas restantes")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. Cor (color)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("cor", () => {
    it("aplica a cor no texto da percentagem", () => {
      renderRing({ value: 50, color: "#ef4444" });
      const pctText = screen.getByText("50%");
      expect(pctText).toHaveStyle({ color: "#ef4444" });
    });

    it("aplica a cor no stroke do círculo de progresso", () => {
      const { container } = renderRing({ color: "#22c55e" });
      const circles = container.querySelectorAll("circle");
      const progressCircle = circles[1]; // segundo circle = progresso
      expect(progressCircle.getAttribute("stroke")).toBe("#22c55e");
    });

    it("aplica a cor na barra de progresso inferior", () => {
      const { container } = renderRing({ color: "#f59e0b" });
      const barTrack = container.querySelector(".bg-white\\/5");
      const barFill = barTrack!.firstChild as HTMLElement;
      expect(barFill).toHaveStyle({ background: "#f59e0b" });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. Cálculo do SVG ring
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("cálculo do SVG ring", () => {
    it("define strokeDasharray igual à circunferência", () => {
      const { container } = renderRing({ value: 60 });
      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle.getAttribute("stroke-dasharray")).toBe(
        CIRC.toString(),
      );
    });

    it("define strokeDashoffset correto para 75%", () => {
      const { container } = renderRing({ value: 75 });
      const progressCircle = container.querySelectorAll("circle")[1];
      const offset = expectedOffset(75);
      expect(progressCircle.getAttribute("stroke-dashoffset")).toBe(
        offset.toString(),
      );
    });

    it("define strokeDashoffset = circunferência total para 0%", () => {
      const { container } = renderRing({ value: 0 });
      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle.getAttribute("stroke-dashoffset")).toBe(
        CIRC.toString(),
      );
    });

    it("define strokeDashoffset = 0 para 100%", () => {
      const { container } = renderRing({ value: 100 });
      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle.getAttribute("stroke-dashoffset")).toBe("0");
    });

    it("o círculo de fundo tem stroke '#ffffff08'", () => {
      const { container } = renderRing();
      const bgCircle = container.querySelectorAll("circle")[0];
      expect(bgCircle.getAttribute("stroke")).toBe("#ffffff08");
    });

    it("o círculo de progresso tem strokeLinecap='round'", () => {
      const { container } = renderRing();
      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle.getAttribute("stroke-linecap")).toBe("round");
    });

    it("o círculo de progresso tem transform rotate(-90)", () => {
      const { container } = renderRing();
      const progressCircle = container.querySelectorAll("circle")[1];
      expect(progressCircle.getAttribute("transform")).toBe(
        "rotate(-90 44 44)",
      );
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. Limites (clamping)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("limites de valor", () => {
    it("clamp visual em 100% quando value > 100 (ring não ultrapassa)", () => {
      const { container } = renderRing({ value: 150 });
      const progressCircle = container.querySelectorAll("circle")[1];
      // visualPct = min(150, 100) = 100 → offset = 0
      expect(progressCircle.getAttribute("stroke-dashoffset")).toBe("0");
    });

    it("exibe o valor real no texto mesmo acima de 100%", () => {
      renderRing({ value: 150 });
      expect(screen.getByText("150%")).toBeInTheDocument();
    });

    it("a barra inferior também é limitada a 100% de largura", () => {
      const { container } = renderRing({ value: 200 });
      const barTrack = container.querySelector(".bg-white\\/5");
      const barFill = barTrack!.firstChild as HTMLElement;
      expect(barFill.style.width).toBe("100%");
    });

    it("clamp em 0% quando value é negativo", () => {
      const { container } = renderRing({ value: -10 });
      const progressCircle = container.querySelectorAll("circle")[1];
      // pct = max(-10, 0) = 0 → visualPct = 0 → offset = CIRC
      expect(progressCircle.getAttribute("stroke-dashoffset")).toBe(
        CIRC.toString(),
      );
    });

    it("exibe 0% no texto quando value é negativo", () => {
      renderRing({ value: -10 });
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("a barra inferior tem largura 0% quando value é negativo", () => {
      const { container } = renderRing({ value: -5 });
      const barTrack = container.querySelector(".bg-white\\/5");
      const barFill = barTrack!.firstChild as HTMLElement;
      expect(barFill.style.width).toBe("0%");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. Barra de progresso inferior
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("barra de progresso inferior", () => {
    it("tem largura proporcional ao visualPct", () => {
      const { container } = renderRing({ value: 40 });
      const barTrack = container.querySelector(".bg-white\\/5");
      const barFill = barTrack!.firstChild as HTMLElement;
      expect(barFill.style.width).toBe("40%");
    });

    it("tem transition para animação suave", () => {
      const { container } = renderRing({ value: 60 });
      const barTrack = container.querySelector(".bg-white\\/5");
      const barFill = barTrack!.firstChild as HTMLElement;
      expect(barFill.className).toContain("transition-all");
      expect(barFill.className).toContain("duration-700");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. Cenário completo
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("cenário completo", () => {
    it("renderiza todos os elementos com todas as props", () => {
      const { container } = renderRing({
        label: "Progresso Geral",
        subLabel: "Q2 2025",
        sub: "45 de 60 tarefas",
        value: 75,
        color: "#8b5cf6",
      });

      // Textos
      expect(screen.getByText("Progresso Geral")).toBeInTheDocument();
      expect(screen.getByText("Q2 2025")).toBeInTheDocument();
      expect(screen.getByText("45 de 60 tarefas")).toBeInTheDocument();
      expect(screen.getByText("75%")).toBeInTheDocument();

      // Cor no texto
      expect(screen.getByText("75%")).toHaveStyle({ color: "#8b5cf6" });

      // SVG presente
      const circles = container.querySelectorAll("circle");
      expect(circles).toHaveLength(2);

      // Barra inferior
      const barTrack = container.querySelector(".bg-white\\/5");
      const barFill = barTrack!.firstChild as HTMLElement;
      expect(barFill.style.width).toBe("75%");
      expect(barFill).toHaveStyle({ background: "#8b5cf6" });
    });
  });
});
