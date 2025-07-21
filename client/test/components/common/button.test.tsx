// test/components/common/ButtonComponent.test.tsx
import { ButtonComponent } from "@/components/common/Button";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

describe("ButtonComponent", () => {
  it("deve renderizar o texto corretamente", () => {
    render(<ButtonComponent text="Clique aqui" />);
    expect(screen.getByText("Clique aqui")).toBeInTheDocument();
  });

  it("deve aplicar classes personalizadas passadas via props", () => {
    render(<ButtonComponent text="Teste" styled="meu-estilo-custom" />);
    const button = screen.getByRole("button");
    expect(button.className).toContain("meu-estilo-custom");
  });

  it("deve chamar a função onClick quando clicado", () => {
    const handleClick = vi.fn();
    render(<ButtonComponent text="Clique" onClick={handleClick} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });

  it("deve estar desabilitado quando prop disabled for true", () => {
    render(<ButtonComponent text="Desativado" disabled />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("deve renderizar conteúdo ReactNode no texto", () => {
    render(
      <ButtonComponent
        text={
          <span>
            <strong>Custom</strong> Text
          </span>
        }
      />
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
});
