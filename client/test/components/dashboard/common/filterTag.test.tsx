import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "vitest";

import { FilterTag } from "@/components/dashboard/common/FilterTag";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETUP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

afterEach(() => {
  cleanup();
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("FilterTag", () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("renderização", () => {
    it("deve renderizar o label corretamente", () => {
      render(<FilterTag label="Teste" />);

      expect(screen.getByText("Teste")).toBeInTheDocument();
    });

    it("deve renderizar como span", () => {
      render(<FilterTag label="Teste" />);

      const element = screen.getByText("Teste");

      expect(element.tagName).toBe("SPAN");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VARIANT DEFAULT
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("variant default", () => {
    it("deve aplicar estilos padrão quando variant não for informado", () => {
      render(<FilterTag label="Default" />);

      const el = screen.getByText("Default");

      expect(el).toHaveClass("bg-white/5", "border-white/10", "text-zinc-400");
    });

    it("deve aplicar estilos padrão quando variant = default", () => {
      render(<FilterTag label="Default" variant="default" />);

      const el = screen.getByText("Default");

      expect(el).toHaveClass("bg-white/5", "border-white/10", "text-zinc-400");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // VARIANT BLUE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("variant blue", () => {
    it("deve aplicar estilos azuis quando variant = blue", () => {
      render(<FilterTag label="Blue" variant="blue" />);

      const el = screen.getByText("Blue");

      expect(el).toHaveClass(
        "bg-[#3b82f6]/15",
        "border-[#3b82f6]/30",
        "text-[#60a5fa]",
      );
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CLASSES FIXAS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("classes base", () => {
    it("deve sempre aplicar as classes fixas do componente", () => {
      render(<FilterTag label="Base" />);

      const el = screen.getByText("Base");

      expect(el).toHaveClass(
        "text-[10px]",
        "border",
        "rounded-full",
        "px-2",
        "py-0.5",
      );
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // EDGE CASES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe("edge cases", () => {
    it("deve funcionar com label vazio", () => {
      const { container } = render(<FilterTag label="" />);

      const el = container.querySelector("span");

      expect(el).toBeInTheDocument();
    });

    it("deve trocar estilos corretamente ao mudar variant", () => {
      const { rerender } = render(<FilterTag label="Teste" />);

      let el = screen.getByText("Teste");
      expect(el).toHaveClass("bg-white/5");

      rerender(<FilterTag label="Teste" variant="blue" />);

      el = screen.getByText("Teste");
      expect(el).toHaveClass("bg-[#3b82f6]/15");
    });
  });
});
