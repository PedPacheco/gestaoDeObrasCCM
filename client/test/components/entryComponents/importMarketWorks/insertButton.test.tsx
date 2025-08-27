import { InsertMarketWorksButton } from "@/components/entryComponents/importMarketWorks/insertButton";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
  InsertWorks: vi.fn(),
}));

describe("DeleteButton component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o botão", () => {
    render(<InsertMarketWorksButton storageKey="notesEntryData" />);

    expect(screen.getByText("Inserir obras de mercado")).toBeInTheDocument();
  });
});
