// test/components/dashboard/common/performanceBadge.test.tsx

import { PerformanceBadge } from "@/components/dashboard/common/performanceBadge";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

afterEach(() => {
  cleanup();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const defaultColors = {
  bg: "#000000",
  text: "#ffffff",
  bar: "#ff0000",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("PerformanceBadge", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("renderização", () => {
    it("deve renderizar o percentual formatado corretamente", () => {
      render(<PerformanceBadge percentage={75} colors={defaultColors} />);

      expect(screen.getByText("75%")).toBeInTheDocument();
    });

    it("deve arredondar o percentual para inteiro", () => {
      render(<PerformanceBadge percentage={75.6} colors={defaultColors} />);

      expect(screen.getByText("76%")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROGRESS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("barra de progresso", () => {
    it("deve renderizar o LinearProgress", () => {
      render(<PerformanceBadge percentage={50} colors={defaultColors} />);

      // MUI usa role="progressbar"
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("deve usar o valor correto no progress", () => {
      render(<PerformanceBadge percentage={60} colors={defaultColors} />);

      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveAttribute("aria-valuenow", "60");
    });

    it("deve limitar o valor máximo a 100", () => {
      render(<PerformanceBadge percentage={150} colors={defaultColors} />);

      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveAttribute("aria-valuenow", "100");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CORES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("cores", () => {
    it("deve aplicar cores no Chip", () => {
      render(
        <PerformanceBadge
          percentage={80}
          colors={{
            bg: "#111111",
            text: "#222222",
            bar: "#333333",
          }}
        />,
      );

      const chip = screen.getByText("80%");

      // MUI aplica isso via style inline
      expect(chip).toHaveStyle({
        backgroundColor: "#111111",
        color: "#222222",
      });
    });

    it("deve aplicar cor na barra do LinearProgress", () => {
      const { container } = render(
        <PerformanceBadge
          percentage={40}
          colors={{
            bg: "#000",
            text: "#fff",
            bar: "#ff0000",
          }}
        />,
      );

      const bar = container.querySelector(".MuiLinearProgress-bar");

      expect(bar).toHaveStyle({
        backgroundColor: "#ff0000",
      });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ESTRUTURA
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("estrutura", () => {
    it("deve renderizar container com flex layout", () => {
      const { container } = render(
        <PerformanceBadge percentage={50} colors={defaultColors} />,
      );

      const root = container.firstChild as HTMLElement;

      expect(root).toBeInTheDocument();
    });

    it("deve conter chip e progress", () => {
      render(<PerformanceBadge percentage={30} colors={defaultColors} />);

      expect(screen.getByText("30%")).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EDGE CASES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("edge cases", () => {
    it("deve lidar com percentual 0", () => {
      render(<PerformanceBadge percentage={0} colors={defaultColors} />);

      expect(screen.getByText("0%")).toBeInTheDocument();

      const progress = screen.getByRole("progressbar");
      expect(progress).toHaveAttribute("aria-valuenow", "0");
    });

    it("deve lidar com percentual negativo", () => {
      render(<PerformanceBadge percentage={-10} colors={defaultColors} />);

      expect(screen.getByText("-10%")).toBeInTheDocument();

      const progress = screen.getByRole("progressbar");

      expect(progress).toHaveAttribute("aria-valuenow", "-10");
    });

    it("deve funcionar com cores customizadas", () => {
      render(
        <PerformanceBadge
          percentage={20}
          colors={{
            bg: "red",
            text: "blue",
            bar: "green",
          }}
        />,
      );

      const chip = screen.getByText("20%");
      expect(chip).toBeInTheDocument();
    });
  });
});
