import { DeleteWork } from "@/actions/works";
import { DeleteButton } from "@/components/entryComponents/importMarketWorks/deleteButton";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, vi, it } from "vitest";

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ text, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  ),
}));

vi.mock("@/components/common/ErrorModal", () => ({
  default: ({ open, message, onClose, icon }: any) =>
    open ? (
      <div data-testid="error-modal">
        <p>{message}</p>
        <button onClick={onClose} data-testid="error-close">
          Fechar
        </button>
        {icon}
      </div>
    ) : null,
}));

vi.mock("@/components/common/Modal", () => ({
  default: ({ open, children, onClose, title }: any) =>
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
        <button onClick={onClose} data-testid="modal-close">
          Fechar
        </button>
      </div>
    ) : null,
}));

vi.mock("@/actions/works", () => ({
  DeleteWork: vi.fn(),
}));

describe("DeleteButton component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o botão", () => {
    render(<DeleteButton storageKey="notesEntryData" />);

    expect(screen.getByText("Limpar Importações")).toBeInTheDocument();
  });

  it("deve renderizar a modal de sucesso no clique do usuário", async () => {
    const user = userEvent.setup();
    vi.mocked(DeleteWork).mockResolvedValue({
      success: true,
      message: "Obra deletad com sucesso",
    });

    render(<DeleteButton storageKey="notesEntryData" />);
    await user.click(screen.getByText("Limpar Importações"));

    await waitFor(() => {
      expect(DeleteWork).toHaveBeenCalledWith("notesEntryData");
    });
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("deve renderizar a modal de erro no clique do usuário", async () => {
    const user = userEvent.setup();
    vi.mocked(DeleteWork).mockResolvedValue({
      success: false,
      error: "Erro ao inserir obra",
    });

    render(<DeleteButton storageKey="notesEntryData" />);
    await user.click(screen.getByText("Limpar Importações"));

    await waitFor(() => {
      expect(DeleteWork).toHaveBeenCalledWith("notesEntryData");
    });
    expect(screen.getByTestId("error-modal")).toBeInTheDocument();
  });

  it("deve renderizar a modal de erro caso aconteça um erro ao deletar obra", async () => {
    const user = userEvent.setup();
    vi.mocked(DeleteWork).mockRejectedValue(new Error("Network error"));

    render(<DeleteButton storageKey="notesEntryData" />);
    await user.click(screen.getByText("Limpar Importações"));

    await waitFor(() => {
      expect(DeleteWork).toHaveBeenCalledWith("notesEntryData");
    });
    expect(screen.getByTestId("error-modal")).toBeInTheDocument();
  });

  it("deve fechar o modal de erro ao clicar em close", async () => {
    const user = userEvent.setup();
    render(<DeleteButton storageKey="notesEntryData" />);

    await user.click(screen.getByText("Limpar Importações"));

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId("error-close");
    await user.click(closeButton);

    expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
  });

  it("deve fechar o modal de sucesso ao clicar em close", async () => {
    const user = userEvent.setup();
    vi.mocked(DeleteWork).mockResolvedValue({
      success: true,
      message: "Obra deletad com sucesso",
    });

    render(<DeleteButton storageKey="notesEntryData" />);

    await user.click(screen.getByText("Limpar Importações"));

    await waitFor(() => {
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId("modal-close");
    await user.click(closeButton);

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });
});
