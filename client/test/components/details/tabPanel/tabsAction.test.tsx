import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================
// vi.hoisted — variáveis acessíveis dentro dos vi.mock factories
// ============================================================

const { mockButtonComponent } = vi.hoisted(() => ({
  mockButtonComponent: vi.fn(),
}));

// ============================================================
// MOCKS
// ============================================================

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: (props: any) => {
    mockButtonComponent(props);
    return (
      <button
        data-testid={`btn-${props.text?.replace(/\s+/g, "-").toLowerCase()}`}
        onClick={props.onClick}
        disabled={props.disabled}
      >
        {props.text}
      </button>
    );
  },
}));

// ============================================================
// IMPORT (após os mocks)
// ============================================================

import TabActions from "@/components/details/tabPanel/tabsActions";

// ============================================================
// HELPERS
// ============================================================

const defaultProps = {
  statusWork: 1,
  permissions: {
    permissao_edicao: true,
    tipo_usuario: "ADMIN",
    id_area: 8,
  },
  onNewSchedule: vi.fn(),
  onValidate: vi.fn(),
  onConfirm: vi.fn(),
  onRejected: vi.fn(),
  valueTab: 1,
  handleChange: vi.fn(),
  feasibilityExists: [{ id: 1 }],
  canSeeTabs: true,
};

const renderComponent = (overrides: Partial<typeof defaultProps> = {}) =>
  render(<TabActions {...defaultProps} {...overrides} />);

const getButton = (name: string) =>
  screen.getByTestId(`btn-${name.replace(/\s+/g, "-").toLowerCase()}`);

// ============================================================
// TESTES
// ============================================================

describe("TabActions", () => {
<<<<<<< HEAD
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
=======
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // Renderização base
  // ----------------------------------------------------------
  describe("Renderização", () => {
    it("deve renderizar sem erros", () => {
      expect(() => renderComponent()).not.toThrow();
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a
    });

    it("deve renderizar as tabs fixas (Programações, Reprovações, Relatórios, Restrições)", () => {
      renderComponent();

      expect(screen.getByText("Programações")).toBeInTheDocument();
      expect(screen.getByText("Reprovações")).toBeInTheDocument();
      expect(screen.getByText("Relatórios execuções")).toBeInTheDocument();
      expect(screen.getByText("Restrições Publicação")).toBeInTheDocument();
    });

    it("deve renderizar o container com flex e justify-between", () => {
      const { container } = renderComponent();

      const wrapper = container.firstElementChild;
      expect(wrapper?.className).toContain("flex");
      expect(wrapper?.className).toContain("items-center");
      expect(wrapper?.className).toContain("justify-between");
    });
  });

  // ----------------------------------------------------------
  // Tabs condicionais (canSeeTabs)
  // ----------------------------------------------------------
  describe("Tabs condicionais (canSeeTabs)", () => {
    it("deve mostrar tab Custos quando canSeeTabs=true", () => {
      renderComponent({ canSeeTabs: true });

      expect(screen.getByText("Custos")).toBeInTheDocument();
    });

    it("deve mostrar tab Serviços quando canSeeTabs=true", () => {
      renderComponent({ canSeeTabs: true });

      expect(screen.getByText("Serviços")).toBeInTheDocument();
    });

    it("NÃO deve mostrar tab Custos quando canSeeTabs=false", () => {
      renderComponent({ canSeeTabs: false });

      expect(screen.queryByText("Custos")).not.toBeInTheDocument();
    });

    it("NÃO deve mostrar tab Serviços quando canSeeTabs=false", () => {
      renderComponent({ canSeeTabs: false });

      expect(screen.queryByText("Serviços")).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // Botões de ação — visibilidade
  // ----------------------------------------------------------
  describe("Botões de ação — visibilidade", () => {
    it("deve mostrar os 4 botões quando valueTab=1 e canSeeTabs=true", () => {
      renderComponent({ valueTab: 1, canSeeTabs: true });

      expect(getButton("nova-programação")).toBeInTheDocument();
      expect(getButton("reprovar-programação")).toBeInTheDocument();
      expect(getButton("validar-programação")).toBeInTheDocument();
      expect(getButton("confirmar-programação")).toBeInTheDocument();
    });

    it("NÃO deve mostrar botões quando valueTab !== 1", () => {
      renderComponent({ valueTab: 0 });

      expect(
        screen.queryByTestId("btn-nova-programação"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("btn-reprovar-programação"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("btn-validar-programação"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("btn-confirmar-programação"),
      ).not.toBeInTheDocument();
    });

    it.each([0, 2, 3, 4, 5])(
      "NÃO deve mostrar botões quando valueTab=%i",
      (tab) => {
        renderComponent({ valueTab: tab });

        expect(
          screen.queryByTestId("btn-nova-programação"),
        ).not.toBeInTheDocument();
      },
    );

    it("NÃO deve mostrar botões quando canSeeTabs=false mesmo com valueTab=1", () => {
      renderComponent({ valueTab: 1, canSeeTabs: false });

      expect(
        screen.queryByTestId("btn-nova-programação"),
      ).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // Botões — callbacks
  // ----------------------------------------------------------
  describe("Botões — callbacks", () => {
    it("deve chamar onNewSchedule ao clicar em 'Nova programação'", () => {
      renderComponent({ statusWork: 1 });

      fireEvent.click(getButton("nova-programação"));

      expect(defaultProps.onNewSchedule).toHaveBeenCalledOnce();
    });

    it("deve chamar onRejected ao clicar em 'Reprovar programação'", () => {
      renderComponent({ statusWork: 1 });

      fireEvent.click(getButton("reprovar-programação"));

      expect(defaultProps.onRejected).toHaveBeenCalledOnce();
    });

    it("deve chamar onValidate ao clicar em 'Validar programação'", () => {
      renderComponent({ statusWork: 43 });

      fireEvent.click(getButton("validar-programação"));

      expect(defaultProps.onValidate).toHaveBeenCalledOnce();
    });

    it("deve chamar onConfirm ao clicar em 'Confirmar programação'", () => {
      renderComponent({ statusWork: 37 });

      fireEvent.click(getButton("confirmar-programação"));

      expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
    });
  });

  // ----------------------------------------------------------
  // "Nova programação" — disabled states
  // ----------------------------------------------------------
  describe("Nova programação — disabled", () => {
    it("deve estar habilitado quando statusWork != 2|3, feasibility existe e tem permissão", () => {
      renderComponent({
        statusWork: 1,
        feasibilityExists: [{ id: 1 }],
        permissions: {
          permissao_edicao: true,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("nova-programação")).not.toBeDisabled();
    });

    it("deve estar desabilitado quando statusWork === 2", () => {
      renderComponent({ statusWork: 2 });

      expect(getButton("nova-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando statusWork === 3", () => {
      renderComponent({ statusWork: 3 });

      expect(getButton("nova-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando feasibilityExists está vazio", () => {
      renderComponent({ feasibilityExists: [] });

      expect(getButton("nova-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando permissao_edicao é false", () => {
      renderComponent({
        permissions: {
          permissao_edicao: false,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("nova-programação")).toBeDisabled();
    });
  });

  // ----------------------------------------------------------
  // "Reprovar programação" — disabled states
  // ----------------------------------------------------------
  describe("Reprovar programação — disabled", () => {
    it("deve estar habilitado quando statusWork != 2|3 e canValidateOrConfirm", () => {
      renderComponent({
        statusWork: 1,
        permissions: {
          permissao_edicao: true,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("reprovar-programação")).not.toBeDisabled();
    });

    it("deve estar desabilitado quando statusWork === 2", () => {
      renderComponent({ statusWork: 2 });

      expect(getButton("reprovar-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando statusWork === 3", () => {
      renderComponent({ statusWork: 3 });

      expect(getButton("reprovar-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando tipo_usuario é PARCEIRA", () => {
      renderComponent({
        permissions: {
          permissao_edicao: true,
          tipo_usuario: "PARCEIRA",
          id_area: 8,
        },
      });

      expect(getButton("reprovar-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando permissao_edicao é false", () => {
      renderComponent({
        permissions: {
          permissao_edicao: false,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("reprovar-programação")).toBeDisabled();
    });
  });

  // ----------------------------------------------------------
  // "Validar programação" — disabled states
  // ----------------------------------------------------------
  describe("Validar programação — disabled", () => {
    it("deve estar habilitado quando statusWork === 43 e canValidateOrConfirm", () => {
      renderComponent({
        statusWork: 43,
        permissions: {
          permissao_edicao: true,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("validar-programação")).not.toBeDisabled();
    });

    it("deve estar desabilitado quando statusWork !== 43", () => {
      renderComponent({ statusWork: 1 });

      expect(getButton("validar-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando tipo_usuario é PARCEIRA", () => {
      renderComponent({
        statusWork: 43,
        permissions: {
          permissao_edicao: true,
          tipo_usuario: "PARCEIRA",
          id_area: 8,
        },
      });

      expect(getButton("validar-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando permissao_edicao é false", () => {
      renderComponent({
        statusWork: 43,
        permissions: {
          permissao_edicao: false,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("validar-programação")).toBeDisabled();
    });
  });

  // ----------------------------------------------------------
  // "Confirmar programação" — disabled states
  // ----------------------------------------------------------
  describe("Confirmar programação — disabled", () => {
    it("deve estar habilitado quando statusWork === 37 e canValidateOrConfirm", () => {
      renderComponent({
        statusWork: 37,
        permissions: {
          permissao_edicao: true,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("confirmar-programação")).not.toBeDisabled();
    });

    it("deve estar desabilitado quando statusWork !== 37", () => {
      renderComponent({ statusWork: 1 });

      expect(getButton("confirmar-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando tipo_usuario é PARCEIRA", () => {
      renderComponent({
        statusWork: 37,
        permissions: {
          permissao_edicao: true,
          tipo_usuario: "PARCEIRA",
          id_area: 8,
        },
      });

      expect(getButton("confirmar-programação")).toBeDisabled();
    });

    it("deve estar desabilitado quando permissao_edicao é false", () => {
      renderComponent({
        statusWork: 37,
        permissions: {
          permissao_edicao: false,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("confirmar-programação")).toBeDisabled();
    });
  });

  // ----------------------------------------------------------
  // canValidateOrConfirm — combinações
  // ----------------------------------------------------------
  describe("canValidateOrConfirm — combinações", () => {
    it("deve ser true quando permissao_edicao=true e tipo_usuario != PARCEIRA", () => {
      renderComponent({
        statusWork: 43,
        permissions: {
          permissao_edicao: true,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("validar-programação")).not.toBeDisabled();
    });

    it("deve ser false quando permissao_edicao=true mas tipo_usuario=PARCEIRA", () => {
      renderComponent({
        statusWork: 43,
        permissions: {
          permissao_edicao: true,
          tipo_usuario: "PARCEIRA",
          id_area: 8,
        },
      });

      expect(getButton("validar-programação")).toBeDisabled();
    });

    it("deve ser false quando permissao_edicao=false mesmo com tipo_usuario != PARCEIRA", () => {
      renderComponent({
        statusWork: 43,
        permissions: {
          permissao_edicao: false,
          tipo_usuario: "ADMIN",
          id_area: 8,
        },
      });

      expect(getButton("validar-programação")).toBeDisabled();
    });

    it("deve ser false quando permissao_edicao=false e tipo_usuario=PARCEIRA", () => {
      renderComponent({
        statusWork: 43,
        permissions: {
          permissao_edicao: false,
          tipo_usuario: "PARCEIRA",
          id_area: 8,
        },
      });

      expect(getButton("validar-programação")).toBeDisabled();
    });
  });

  // ----------------------------------------------------------
  // handleChange
  // ----------------------------------------------------------
  describe("handleChange", () => {
    it("deve chamar handleChange ao clicar numa tab", () => {
      renderComponent();

      const tab = screen.getByText("Reprovações");
      fireEvent.click(tab);

      expect(defaultProps.handleChange).toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // memo
  // ----------------------------------------------------------
  describe("memo", () => {
    it("deve ter displayName definido", () => {
      expect(TabActions.displayName).toBe("TabActions");
    });
  });
});
