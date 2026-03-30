import FailureModalComponent from "@/components/details/modals/failureModal";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

const defaultProps = {
  open: true,
  onClose: vi.fn(),
  handleReject: vi.fn(),
  rejectedSchedule: {
    id: 1,
    reject: true,
  },
};

describe("FailureModal", () => {
  it("deve renderizar o modal quando open = true", () => {
    render(<FailureModalComponent {...defaultProps} />);

    expect(screen.getByText("Reprovação da programação")).toBeInTheDocument();

    expect(screen.getByRole("combobox")).toBeInTheDocument();

    expect(screen.getByLabelText("Descrição")).toBeInTheDocument();
  });

  it("deve habilitar o botão confirmar quando formulário estiver válido", async () => {
    const user = userEvent.setup();

    render(<FailureModalComponent {...defaultProps} />);

    // abre select
    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Data"));

    // digita descrição
    await user.type(screen.getByLabelText("Descrição"), "Erro na execução");

    const confirmButton = screen.getByRole("button", {
      name: /confirmar/i,
    });

    expect(confirmButton).toBeEnabled();
  });

  it("deve chamar handleReject com os dados corretos", async () => {
    const user = userEvent.setup();
    const handleRejectMock = vi.fn();

    render(
      <FailureModalComponent
        {...defaultProps}
        handleReject={handleRejectMock}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByText("Data"));

    await user.type(screen.getByLabelText("Descrição"), "Teste descrição");

    await user.click(screen.getByRole("button", { name: /confirmar/i }));

    expect(handleRejectMock).toHaveBeenCalledWith({
      id: 1,
      reject: true,
      reason: "Data",
      description: "Teste descrição",
    });
  });

  it("deve chamar onClose ao clicar em cancelar", async () => {
    const user = userEvent.setup();
    const onCloseMock = vi.fn();

    render(<FailureModalComponent {...defaultProps} onClose={onCloseMock} />);

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(onCloseMock).toHaveBeenCalled();
  });

  it("deve resetar o formulário ao fechar", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <FailureModalComponent {...defaultProps} open={true} />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "Data" }));

    await user.type(screen.getByLabelText("Descrição"), "Teste");

    await user.click(screen.getByRole("button", { name: /cancelar/i }));

    rerender(<FailureModalComponent {...defaultProps} open={false} />);

    rerender(<FailureModalComponent {...defaultProps} open={true} />);

    expect(screen.getByLabelText("Descrição")).toHaveValue("");
  });

  it("deve exibir mensagens de erro ao tentar confirmar com campos vazios", async () => {
    const user = userEvent.setup();

    render(<FailureModalComponent {...defaultProps} />);

    const confirmButton = screen.getByRole("button", {
      name: /confirmar/i,
    });

    await user.click(confirmButton);

    expect(screen.getByText("Motivo é obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Descrição é obrigatória")).toBeInTheDocument();
  });

  it("deve retornar e não chamar a função handleReject, caso rejectedSchedule não exista", async () => {
    const user = userEvent.setup();
    render(<FailureModalComponent {...defaultProps} rejectedSchedule={null} />);

    const confirmButton = screen.getByRole("button", {
      name: /confirmar/i,
    });

    await user.click(confirmButton);

    expect(defaultProps.handleReject).not.toHaveBeenCalled();
  });
});
