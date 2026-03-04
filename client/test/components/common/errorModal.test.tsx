import { render, screen, fireEvent } from "@testing-library/react";
import ErrorModal from "@/components/common/ErrorModal";
import { describe, it, vi, expect } from "vitest";

describe("ErrorModal component", () => {
  const mockOnClose = vi.fn();

  const icon = <div data-testid="error-icon" />;

  const renderComponent = (open = true) => {
    render(
      <ErrorModal
        open={open}
        onClose={mockOnClose}
        icon={icon}
        message="Algo deu errado!"
      />,
    );
  };

  it("não renderiza quando `open` é false", () => {
    renderComponent(false);
    const modalText = screen.queryByText(/Algo deu errado/i);
    expect(modalText).not.toBeInTheDocument();
  });

  it("renderiza o modal corretamente quando `open` é true", () => {
    renderComponent();
    expect(screen.getByText("Algo deu errado!")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fechar/i })).toBeInTheDocument();
    expect(screen.getByTestId("error-icon")).toBeInTheDocument();
  });

  it('chama onClose ao clicar no botão "Fechar"', () => {
    renderComponent();
    const button = screen.getByRole("button", { name: /fechar/i });
    fireEvent.click(button);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("possui descrição acessível", () => {
    renderComponent();
    expect(screen.getByText("Algo deu errado!").closest("p")?.id).toBe(
      "error-modal-description",
    );
  });
});
