import ModalComponent from "@/components/common/Modal";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("ErrorModal component", () => {
  const mockOnClose = vi.fn();

  const renderComponent = (open = true, closeButton = true) => {
    render(
      <ModalComponent
        open={open}
        onClose={mockOnClose}
        title="Teste Modal"
        closeButton={closeButton}
      >
        <p>Conteúdo da modal</p>
      </ModalComponent>
    );
  };

  it("Deve renderizar com título, botão de fechar e conteúdo", () => {
    renderComponent();

    expect(screen.getByText("Teste Modal")).toBeInTheDocument();
    expect(screen.getByText("Conteúdo da modal")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Fechar/i })).toBeInTheDocument();
  });

  it('Deve chamar o onClose ao clicar no botão "Fechar"', () => {
    renderComponent();

    const button = screen.getByRole("button", { name: /Fechar/i });
    fireEvent.click(button);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("Deve chamar o onClose ao clicar no botão X", () => {
    renderComponent(true, false);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
