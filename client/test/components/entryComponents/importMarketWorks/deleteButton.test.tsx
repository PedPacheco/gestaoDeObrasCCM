import { DeleteWork } from "@/actions/works";
import { DeleteButton } from "@/components/entryComponents/importMarketWorks/deleteButton";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, vi, it } from "vitest";

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

vi.mock("@/hooks/useFeedback", () => ({
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe("DeleteButton component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o botão", () => {
    render(<DeleteButton storageKey="notesEntryData" id={56} />);

    expect(screen.getByText("Remover")).toBeInTheDocument();
  });

  it("deve renderizar a modal de sucesso no clique do usuário", async () => {
    const user = userEvent.setup();
    vi.mocked(DeleteWork).mockResolvedValue({
      success: true,
      message: "Obra deletad com sucesso",
    });

    render(<DeleteButton storageKey="notesEntryData" id={56} />);
    await user.click(screen.getByText("Remover"));

    await waitFor(() => {
      expect(DeleteWork).toHaveBeenCalledWith("notesEntryData", 56);
    });
  });
});
