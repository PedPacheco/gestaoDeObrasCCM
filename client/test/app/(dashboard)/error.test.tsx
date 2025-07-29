import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorComponent from "@/app/(dashboard)/error";

// Mock do ícone (se necessário)
vi.mock("@heroicons/react/20/solid", () => ({
  ExclamationCircleIcon: () => <svg data-testid="error-icon" />,
}));

// Mock do roteador
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock do modal
vi.mock("@/components/common/ErrorModal", () => ({
  __esModule: true,
  default: ({ open, onClose, message, icon }: any) =>
    open && (
      <div data-testid="error-modal">
        <div>{icon}</div>
        <p>{message}</p>
        <button onClick={onClose} data-testid="close-button">
          Fechar
        </button>
      </div>
    ),
}));

describe("Error component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o modal com a mensagem de erro", () => {
    render(<ErrorComponent error={new Error("Erro de teste")} />);

    expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    expect(screen.getByText("Erro de teste")).toBeInTheDocument();
    expect(screen.getByTestId("error-icon")).toBeInTheDocument();
  });

  it("deve redirecionar para '/' ao fechar o modal", () => {
    render(<ErrorComponent error={new Error("Erro de teste")} />);

    const closeButton = screen.getByTestId("close-button");
    fireEvent.click(closeButton);

    expect(pushMock).toHaveBeenCalledWith("/");
  });
});
