import TabActions from "@/components/details/tabPanel/tabsActions";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ onClick, text, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  ),
}));

describe("TabActions", () => {
  beforeEach(vi.clearAllMocks);

  const setup = (props?: Partial<React.ComponentProps<typeof TabActions>>) => {
    const defaultProps = {
      statusWork: 1,
      permissions: { permissao_visualizacao: "completa" },
      onNewSchedule: vi.fn(),
      onValidate: vi.fn(),
      onConfirm: vi.fn(),
      onRejected: vi.fn(),
      valueTab: 0,
      handleChange: vi.fn(),
      feasibilityExists: [{ id: 1, id_obra: 1, caminho_arquivo: "teste.pdf" }],
    };
    return render(<TabActions {...defaultProps} {...props} />);
  };

  it("deve renderizar corretamente as abas", () => {
    setup();
    expect(screen.getByText("Custos")).toBeInTheDocument();
    expect(screen.getByText("Programações")).toBeInTheDocument();
    expect(screen.getByText("Relatórios execuções")).toBeInTheDocument();
    expect(screen.getByText("Reprovações")).toBeInTheDocument();
  });

  it("deve chamar handleChange ao trocar de aba", () => {
    const handleChange = vi.fn();
    setup({ handleChange });
    const tab = screen.getByText("Programações");
    fireEvent.click(tab);
    expect(handleChange).toHaveBeenCalled();
  });

  it("não deve renderizar botões quando valueTab !== 1", () => {
    setup({ valueTab: 0 });
    expect(screen.queryByText("Nova programação")).not.toBeInTheDocument();
  });

  it("deve renderizar todos os botões quando valueTab === 1", () => {
    setup({ valueTab: 1 });
    expect(screen.getByText("Nova programação")).toBeInTheDocument();
    expect(screen.getByText("Reprovar programação")).toBeInTheDocument();
    expect(screen.getByText("Validar programação")).toBeInTheDocument();
    expect(screen.getByText("Confirmar programação")).toBeInTheDocument();
  });

  it("deve desabilitar 'Nova programação' quando statusWork = 2 ou 3", () => {
    setup({ valueTab: 1, statusWork: 2 });
    expect(screen.getByText("Nova programação")).toBeDisabled();
  });

  it("deve desabilitar 'Reprovar programação' quando statusWork === 2 ou statusWork === 3", () => {
    setup({ valueTab: 1, statusWork: 2 });
    expect(screen.getByText("Reprovar programação")).toBeDisabled();
  });

  it("deve desabilitar 'Validar programação' e 'Reprovar programação' quando permissao_visualizacao = 'parcial'", () => {
    setup({
      valueTab: 1,
      statusWork: 43,
      permissions: { permissao_visualizacao: "parcial" },
    });
    expect(screen.getByText("Validar programação")).toBeDisabled();
    expect(screen.getByText("Reprovar programação")).toBeDisabled();
  });

  it("deve desabilitar 'Confirmar programação' quando statusWork != 37", () => {
    setup({
      valueTab: 1,
      statusWork: 1,
      permissions: { permissao_visualizacao: "parcial" },
    });
    expect(screen.getByText("Confirmar programação")).toBeDisabled();
  });

  it("deve desabilitar 'Confirmar programação' quando permissao_visualizacao = 'parcial'", () => {
    setup({
      valueTab: 1,
      statusWork: 37,
      permissions: { permissao_visualizacao: "parcial" },
    });
    expect(screen.getByText("Confirmar programação")).toBeDisabled();
  });

  it('Deve desabilitar todos os botões, quando permissao.permissao = "Sem permissão"', () => {
    setup({
      valueTab: 1,
      statusWork: 1,
      permissions: { permissao: "Sem permissão" },
    });

    expect(screen.getByText("Confirmar programação")).toBeDisabled();
    expect(screen.getByText("Nova programação")).toBeDisabled();
  });

  it('Deve desabilitar todos os botões, quando permissao.permissao = "Sem permissão"', () => {
    setup({
      valueTab: 1,
      statusWork: 43,
      permissions: { permissao: "Sem permissão" },
    });

    expect(screen.getByText("Validar programação")).toBeDisabled();
    expect(screen.getByText("Reprovar programação")).toBeDisabled();
  });

  it("Deve desabilitar o botão nova programação, caso a viabilidade não existir", () => {
    setup({
      valueTab: 1,
      statusWork: 37,
      feasibilityExists: [],
    });

    expect(screen.getByText("Nova programação")).toBeDisabled();
  });
});
