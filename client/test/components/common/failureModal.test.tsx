import ConfirmationModalComponent from "@/components/common/confirmationModal";
import FailureModalComponent from "@/components/common/failureModal";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("ErrorModal component", () => {
  const mockOnClose = vi.fn();
  const mockRejected = vi.fn();

  const mockRejectedSchedule = { id: 1, reject: true };

  const renderComponent = (open = true) => {
    render(
      <FailureModalComponent
        rejectedSchedule={mockRejectedSchedule}
        handleReject={mockRejected}
        open={open}
        onClose={mockOnClose}
      />,
    );
  };

  it("Deve renderizar com título, botão de fechar e conteúdo", () => {
    renderComponent();

    expect(screen.getByText("Motivo")).toBeInTheDocument();
    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Cancelar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Confirmar/i }),
    ).toBeInTheDocument();
  });

  it("Deve chamar onClose ao clicar no botão Cancelar", () => {
    renderComponent();

    const button = screen.getByRole("button", { name: /Cancelar/i });

    fireEvent.click(button);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("Deve alterar os valores dos estados ao digitar no input e selecionar uma opção", () => {
    renderComponent();

    const selectReason = screen.getByRole("combobox");
    const descriptionInput = screen.getByLabelText(
      "Descrição",
    ) as HTMLInputElement;

    fireEvent.mouseDown(selectReason);

    const option = screen.getByText("Data");
    fireEvent.click(option);

    fireEvent.change(descriptionInput, {
      target: { value: "Teste de descrição" },
    });

    expect(selectReason.textContent).toBe("Data");

    expect(descriptionInput.value).toBe("Teste de descrição");
  });

  it("Deve chamar a função handleRejectedSchedule ao clicar no botão, e caso tenha uma reprovação chamar a função da props handleReject", () => {
    renderComponent();

    const selectReason = screen.getByRole("combobox");
    const descriptionInput = screen.getByLabelText(
      "Descrição",
    ) as HTMLInputElement;

    fireEvent.mouseDown(selectReason);

    const option = screen.getByText("Data");
    fireEvent.click(option);

    fireEvent.change(descriptionInput, {
      target: { value: "Teste de descrição" },
    });

    const button = screen.getByRole("button", { name: /Confirmar/i });

    fireEvent.click(button);

    expect(mockRejected).toHaveBeenCalled();
    expect(mockRejected).toHaveBeenCalledWith({
      id: 1,
      reject: true,
      reason: "Data",
      description: "Teste de descrição",
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("Deve chamar a função handleRejectedSchedule ao clicar no botão, e caso não tenha uma reprovação, para execução da função", () => {
    render(
      <FailureModalComponent
        rejectedSchedule={null}
        handleReject={mockRejected}
        open={true}
        onClose={mockOnClose}
      />,
    );

    const button = screen.getByRole("button", { name: /Confirmar/i });

    fireEvent.click(button);

    expect(mockRejected).not.toHaveBeenCalled();
  });
});
