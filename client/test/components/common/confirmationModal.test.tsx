import ConfirmationModalComponent from "@/components/details/modals/confirmationModal";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("ErrorModal component", () => {
  const mockOnClose = vi.fn();
  const mockConfirm = vi.fn();

  const renderComponent = (open = true, closeButton = true) => {
    render(
      <ConfirmationModalComponent
        message="Sucesso"
        idSchedule={3}
        onConfirm={mockConfirm}
        open={open}
        onClose={mockOnClose}
        title="Teste Modal"
        closeButton={closeButton}
      />
    );
  };

  it("Deve renderizar com título, botão de fechar e conteúdo", () => {
    renderComponent();

    expect(screen.getByText("Teste Modal")).toBeInTheDocument();
    expect(screen.getByText("Sucesso")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cancelar/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar/i })
    ).toBeInTheDocument();
  });

  it("Deve chamar onClose ao clicar no botão Cancelar", () => {
    renderComponent();

    const button = screen.getByRole("button", { name: /Cancelar/i });

    fireEvent.click(button);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("Deve chamar onClose ao clicar no botão Cancelar", () => {
    renderComponent();

    const button = screen.getByRole("button", { name: /Confirmar/i });

    fireEvent.click(button);
    expect(mockConfirm).toHaveBeenCalled();
    expect(mockConfirm).toHaveBeenCalledWith(3);
  });
});
