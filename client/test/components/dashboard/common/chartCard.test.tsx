// test/components/dashboard/common/chartCard.test.tsx

import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";

import { ChartCard } from "@/components/dashboard/common/ChartCard";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

afterEach(() => {
  cleanup();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("ChartCard", () => {
  describe("renderização base", () => {
    it("deve renderizar o título corretamente", () => {
      render(
        <ChartCard title="Meu Título">
          <div>Conteúdo</div>
        </ChartCard>,
      );

      expect(screen.getByText("Meu Título")).toBeInTheDocument();
    });

    it("deve renderizar os children corretamente", () => {
      render(
        <ChartCard title="Teste">
          <span>Child content</span>
        </ChartCard>,
      );

      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    it("deve renderizar o container principal", () => {
      const { container } = render(
        <ChartCard title="Teste">
          <div>Conteúdo</div>
        </ChartCard>,
      );

      const root = container.firstElementChild as HTMLElement;

      expect(root).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLASSES CSS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("classes e estilos", () => {
    it("deve aplicar as classes padrão corretamente", () => {
      const { container } = render(
        <ChartCard title="Teste">
          <div>Conteúdo</div>
        </ChartCard>,
      );

      const root = container.firstElementChild as HTMLElement;

      expect(root).toHaveClass(
        "bg-gradient-to-br",
        "from-[#1e2f42]",
        "to-[#192535]",
        "rounded-2xl",
        "p-6",
        "border",
        "border-white/5",
        "shadow-xl",
      );
    });

    it("deve aplicar classes adicionais via props", () => {
      const { container } = render(
        <ChartCard title="Teste" className="extra-class">
          <div>Conteúdo</div>
        </ChartCard>,
      );

      const root = container.firstElementChild as HTMLElement;

      expect(root).toHaveClass("extra-class");
    });

    it("deve concatenar classes padrão e customizadas", () => {
      const { container } = render(
        <ChartCard title="Teste" className="custom">
          <div>Conteúdo</div>
        </ChartCard>,
      );

      const root = container.firstElementChild as HTMLElement;

      expect(root.className).toMatch(/bg-gradient-to-br/);
      expect(root.className).toMatch(/custom/);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TÍTULO (ESTILO)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("título", () => {
    it("deve aplicar classes corretas no título", () => {
      render(
        <ChartCard title="Título Teste">
          <div>Conteúdo</div>
        </ChartCard>,
      );

      const title = screen.getByText("Título Teste");

      expect(title).toHaveClass(
        "text-white",
        "font-bold",
        "text-sm",
        "mb-5",
        "tracking-wide",
        "uppercase",
      );
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EDGE CASES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("edge cases", () => {
    it("deve renderizar sem className opcional", () => {
      const { container } = render(
        <ChartCard title="Teste">
          <div>Conteúdo</div>
        </ChartCard>,
      );

      const root = container.firstElementChild as HTMLElement;

      expect(root).toBeInTheDocument();
    });

    it("deve renderizar children complexos", () => {
      render(
        <ChartCard title="Teste">
          <div>
            <span>Item 1</span>
            <span>Item 2</span>
          </div>
        </ChartCard>,
      );

      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 2")).toBeInTheDocument();
    });
  });
});
