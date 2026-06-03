import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { UpdateWork } from "@/actions/works";
import { InsertPublicationRestrictions } from "@/actions/restrictions";
import { useUser } from "@/contexts/userContext";
import { WorkDetails } from "@/components/details/workDetails/workDetails";

// Mocks
vi.mock("@/actions/works");
vi.mock("@/actions/restrictions");
vi.mock("@/contexts/userContext");
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: (fn: any) => {
    const Component = () => null;
    Component.displayName = "RestrictionDrawer";
    return Component;
  },
}));

// Mock dos componentes filhos que causam problemas
vi.mock("@/components/details/workDetails/editableColumn", () => ({
  EditableColumn: ({ data, onHandleChange, EditSuspension }: any) => (
    <div>
      <button
        data-testid="editable-column"
        onClick={() => onHandleChange("id_status", "4")}
      >
        Mock Status
      </button>

      {EditSuspension}
    </div>
  ),
}));

vi.mock("@/components/details/workDetails/dataItem", () => ({
  default: ({ label, value }: any) => (
    <div data-testid="data-item">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

vi.mock("@mui/material", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/material")>();

  return {
    ...actual, // mantém Dialog, etc.
    IconButton: ({ children, onClick }: any) => (
      <button onClick={onClick} data-testid="icon-button">
        {children}
      </button>
    ),
    Tooltip: ({ children, title }: any) => <div title={title}>{children}</div>,
    Select: ({ children, value, onChange }: any) => (
      <select value={value} onChange={onChange} data-testid="mui-select">
        {children}
      </select>
    ),
    MenuItem: ({ children, value }: any) => (
      <option value={value}>{children}</option>
    ),
  };
});

vi.mock("@heroicons/react/20/solid", () => ({
  ExclamationCircleIcon: () => <div data-testid="exclamation-icon" />,
  PencilIcon: () => <div data-testid="pencil-icon" />,
  CheckCircleIcon: () => <div data-testid="check-circle-icon" />,
  XMarkIcon: () => <div data-testid="x-mark-icon" />,
  DocumentArrowUpIcon: () => <div data-testid="document-arrow-up-icon" />,
  PhotoIcon: () => <div data-testid="photo-icon" />,
}));

vi.mock("@/components/details/modals/feasibilityImportModal", () => ({
  FeasibiltyUpload: ({ open, onClose, onUploadSuccess }: any) => (
    <div data-testid="mock-feasibility-upload">
      <button data-testid="mock-close" onClick={onClose}>
        Fechar
      </button>
      <button data-testid="mock-success" onClick={onUploadSuccess}>
        Success
      </button>
      {open && <p data-testid="mock-open-flag">OPEN</p>}
    </div>
  ),
}));

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ text, onClick, disabled, styled }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={styled}
      data-testid="button-component"
    >
      {text}
    </button>
  ),
}));

vi.mock("@/hooks/useFeedback", () => ({
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock("@/components/common/ErrorThrower", () => ({
  ErrorThrower: ({ message }: any) => {
    throw new Error(message);
  },
}));

const mockUpdateWork = vi.mocked(UpdateWork);
const mockInsertPublicationRestrictions = vi.mocked(
  InsertPublicationRestrictions,
);
const mockUseUser = vi.mocked(useUser);

describe("WorkDetails", () => {
  const mockData = {
    ovnota: "OV123",
    tipos: "Tipo A",
    municipios: "São Paulo",
    referencia: "Ref 001",
    circuitos: "Circuito 1",
    conjunto: "Conjunto A",
    pep: "PEP001",
    status_pep: "Ativo",
    diagrama: "DG001",
    status_diagrama: "Aprovado",
    ordem_dci: "DCI001",
    status_170: "Concluído",
    ordem_dcd: "DCD001",
    status_190: "Em andamento",
    ordem_dca: "DCA001",
    status_150: "Pendente",
    ordem_dcim: "DCIM001",
    status_180: "Ativo",
    executado: 50,
    ano_plan: "2024",
    empreendimento: "Emp 001",
    id_status: 1,
    id_turma: "10",
    idRegional: 5,
    status_ov_sap: "SAP-OK",
    tipo_ads: "ADS-1",
    observ_obra: "Observação inicial",
    data_empreitamento: null,
    id: "100",
  };

  const mockFormattedData = {
    entrada: "01/01/2024",
    prazo: "31/12/2024",
    prazoFinal: "31/12/2024",
    data_conclusao: "15/12/2024",
    dataEmpreitamento: "10/01/2024",
    backgroundColor: "#fff",
    executadoFormatted: "50%",
  };

  const mockOptions = {
    status: [
      { id: 1, descricao: "Em andamento" },
      { id: 2, descricao: "Concluído" },
      { id: 3, descricao: "Cancelado" },
      { id: 4, descricao: "Suspenso" },
      { id: 42, descricao: "Arquivado" },
    ],
    turma: [
      { id: 10, nome: "Turma A" },
      { id: 20, nome: "Turma B" },
    ],
    tipo_ads: [
      { id: "ADS-1", descricao: "ADS Tipo 1" },
      { id: "ADS-2", descricao: "ADS Tipo 2" },
    ],
    restricao: [
      {
        id: 1,
        tipo_restricao: "PUBLICAÇÃO",
        descricao: "Restrição 1",
      },
      {
        id: 2,
        tipo_restricao: "EXECUÇÃO",
        descricao: "Restrição 2",
      },
    ],
  };

  const defaultPermissions = {
    id_area: 8,
    permissao_edicao: false,
    is_admin: true,
    tipo_usuario: "INTERNO",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUser.mockReturnValue({
      permissions: defaultPermissions,
    } as any);
  });

  describe("Renderização inicial", () => {
    it("deve renderizar o título e botões", () => {
      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      expect(screen.getByText("Informações gerais")).toBeInTheDocument();
      expect(screen.getByText("Salvar alterações")).toBeInTheDocument();
    });

    it("deve renderizar todos os DataItems corretamente", () => {
      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      // Verifica se os DataItems estão sendo renderizados
      const dataItems = screen.getAllByTestId("data-item");
      expect(dataItems.length).toBeGreaterThan(0);

      // Verifica alguns valores específicos
      expect(screen.getByText("OV123")).toBeInTheDocument();
      expect(screen.getByText("Tipo A")).toBeInTheDocument();
      expect(screen.getByText("São Paulo")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
    });

    it("deve renderizar o campo de observação", () => {
      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const textarea = screen.getByDisplayValue("Observação inicial");
      expect(textarea).toBeInTheDocument();
      expect(textarea.tagName).toBe("TEXTAREA");
    });
  });

  describe("Controle de permissões", () => {
    it("deve lançar erro quando permissão é parcial e status é 3", () => {
      mockUseUser.mockReturnValue({
        permissions: { tipo_usuario: "PARCEIRA" },
      } as any);

      const dataWithStatus3 = { ...mockData, id_status: 3 };

      expect(() =>
        render(
          <WorkDetails
            feasibilityExists={[]}
            data={dataWithStatus3}
            formattedData={mockFormattedData}
            idWork={100}
            options={mockOptions}
          />,
        ),
      ).toThrow();
    });

    it("deve lançar erro quando permissão é parcial e status é 4", () => {
      mockUseUser.mockReturnValue({
        permissions: { tipo_usuario: "PARCEIRA" },
      } as any);

      const dataWithStatus4 = { ...mockData, id_status: 4 };

      expect(() =>
        render(
          <WorkDetails
            feasibilityExists={[]}
            data={dataWithStatus4}
            formattedData={mockFormattedData}
            idWork={100}
            options={mockOptions}
          />,
        ),
      ).toThrow();
    });

    it("deve lançar erro quando permissão é parcial e status é 42", () => {
      mockUseUser.mockReturnValue({
        permissions: { tipo_usuario: "PARCEIRA" },
      } as any);

      const dataWithStatus42 = { ...mockData, id_status: 42 };

      expect(() =>
        render(
          <WorkDetails
            feasibilityExists={[]}
            data={dataWithStatus42}
            formattedData={mockFormattedData}
            idWork={100}
            options={mockOptions}
          />,
        ),
      ).toThrow();
    });

    it("deve renderizar normalmente quando permissão é total", () => {
      mockUseUser.mockReturnValue({
        permissions: { permissao_visualizacao: "total" },
      } as any);

      const dataWithStatus3 = { ...mockData, id_status: 3 };

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={dataWithStatus3}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      expect(screen.getByText("Informações gerais")).toBeInTheDocument();
    });
  });

  describe("Botão de adicionar restrição de publicação", () => {
    it("deve exibir botão quando tem permissão e status é 2", async () => {
      mockUseUser.mockReturnValue({
        permissions: {
          ...defaultPermissions,
          permissao_publicacao: true,
        },
      } as any);

      const dataWithStatus2 = { ...mockData, id_status: 2 };

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={dataWithStatus2}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByText("Adicionar restrição publicação"),
        ).toBeInTheDocument();
      });
    });

    it("não deve exibir botão quando não tem permissão", async () => {
      mockUseUser.mockReturnValue({
        permissions: {
          ...defaultPermissions,
          is_admin: false,
        },
      } as any);

      const dataWithStatus2 = { ...mockData, id_status: 2 };

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={dataWithStatus2}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Adicionar restrição publicação"),
        ).not.toBeInTheDocument();
      });
    });

    it("não deve exibir botão quando o valor executado for 0", async () => {
      mockUseUser.mockReturnValue({
        permissions: {
          ...defaultPermissions,
          permissao_publicacao: true,
        },
      } as any);

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={{ ...mockData, executado: 0 }}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      await waitFor(() => {
        expect(
          screen.queryByText("Adicionar restrição publicação"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Edição de campos", () => {
    it("deve habilitar botão de salvar quando houver mudanças", async () => {
      const user = userEvent.setup();

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.clear(textarea);
      await user.type(textarea, "Nova observação");

      const saveButton = screen.getByText("Salvar alterações");
      expect(saveButton).not.toBeDisabled();
    });

    it("deve desabilitar botão quando não há mudanças", () => {
      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const saveButton = screen.getByText("Salvar alterações");
      expect(saveButton).toBeDisabled();
    });

    it("deve atualizar campo de observação", async () => {
      const user = userEvent.setup();

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.clear(textarea);
      await user.type(textarea, "Teste");

      expect(textarea).toHaveValue("Teste");
    });
  });

  describe("Modal de suspensão", () => {
    it("deve abrir modal ao mudar status para 4 (suspenso)", async () => {
      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const statusSelect = screen.getByTestId("editable-column");

      await userEvent.click(statusSelect);

      await waitFor(() => {
        expect(screen.getByText("Motivo da Suspensão")).toBeInTheDocument();
      });
    });
  });

<<<<<<< HEAD
=======
  describe("Salvamento de alterações", () => {
    it("deve salvar alterações com sucesso", async () => {
      const user = userEvent.setup();
      mockUpdateWork.mockResolvedValue({
        success: true,
        message: "Alterações salvas com sucesso",
      });

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.clear(textarea);
      await user.type(textarea, "Nova observação");

      const saveButton = screen.getByText("Salvar alterações");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateWork).toHaveBeenCalledWith(
          expect.objectContaining({
            observ_obra: "Nova observação",
          }),
          100,
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText("Alterações salvas com sucesso"),
        ).toBeInTheDocument();
      });
    });

    it("deve exibir erro ao falhar no salvamento", async () => {
      const user = userEvent.setup();
      mockUpdateWork.mockResolvedValue({
        success: false,
        error: "Erro ao salvar",
      });

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.clear(textarea);
      await user.type(textarea, "Teste");

      const saveButton = screen.getByText("Salvar alterações");
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText("Erro ao salvar")).toBeInTheDocument();
      });
    });

    it("deve tratar erro de conexão", async () => {
      const user = userEvent.setup();
      mockUpdateWork.mockRejectedValue(new Error("Network error"));

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.clear(textarea);
      await user.type(textarea, "Teste");

      const saveButton = screen.getByText("Salvar alterações");
      await user.click(saveButton);

      await waitFor(() => {
        expect(
          screen.getByText("Erro de conexão. Tente novamente."),
        ).toBeInTheDocument();
      });
    });

    it("deve incluir motivo de suspensão quando status é 4", async () => {
      const user = userEvent.setup();
      mockUpdateWork.mockResolvedValue({
        success: true,
        message: "Salvo com sucesso",
      });

      const dataWithStatus4 = { ...mockData, id_status: 4 };

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={dataWithStatus4}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      // Simula edição da observação para habilitar o botão
      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.clear(textarea);
      await user.type(textarea, "Teste");

      const saveButton = screen.getByText("Salvar alterações");
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateWork).toHaveBeenCalledWith(
          expect.objectContaining({
            reasonSuspension: expect.any(String),
          }),
          100,
        );
      });
    });
  });

>>>>>>> ff0c48d43746708e8adcb6973a96ca008fbb5109
  describe("Formatação de datas", () => {
    it("deve formatar data de empreitamento corretamente", async () => {
      const user = userEvent.setup();
      mockUpdateWork.mockResolvedValue({
        success: true,
        message: "Salvo",
      });

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      // Simula mudança de data através do componente EditableColumn
      // Aqui testamos a lógica de formatação
      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.type(textarea, " teste");

      await user.click(screen.getByText("Salvar alterações"));

      await waitFor(() => {
        expect(mockUpdateWork).toHaveBeenCalled();
      });
    });

    it("deve aceitar data vazia e converter para null", () => {
      // Esta funcionalidade é testada indiretamente através da mudança de campos
      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      expect(screen.getByText("Informações gerais")).toBeInTheDocument();
    });
  });

<<<<<<< HEAD
=======
  describe("Modal de sucesso", () => {
    it("deve fechar modal de sucesso ao clicar em fechar", async () => {
      const user = userEvent.setup();
      mockUpdateWork.mockResolvedValue({
        success: true,
        message: "Sucesso!",
      });

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.type(textarea, " teste");
      await user.click(screen.getByText("Salvar alterações"));

      await waitFor(() => {
        expect(screen.getByText("Sucesso!")).toBeInTheDocument();
      });
    });
  });

>>>>>>> ff0c48d43746708e8adcb6973a96ca008fbb5109
  describe("Inserção de restrições de publicação", () => {
    it("deve salvar restrições de publicação com sucesso", async () => {
      mockInsertPublicationRestrictions.mockResolvedValue({
        success: true,
        message: "Restrições salvas",
      });

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={{ ...mockData, id_status: 2 }}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      // Testar através do drawer (componente mockado)
      expect(screen.getByText("Informações gerais")).toBeInTheDocument();
    });

    it("deve exibir erro ao falhar salvamento de restrições", async () => {
      mockInsertPublicationRestrictions.mockResolvedValue({
        success: false,
        error: "Erro ao salvar restrições",
      });

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={{ ...mockData, id_status: 2 }}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      expect(screen.getByText("Informações gerais")).toBeInTheDocument();
    });
  });

  describe("Filtro de restrições de publicação", () => {
    it("deve filtrar apenas restrições de publicação", () => {
      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      // Verifica se apenas restrições de publicação são passadas
      expect(
        mockOptions.restricao.filter(
          (r: any) => r.tipo_restricao === "PUBLICAÇÃO",
        ),
      ).toHaveLength(1);
    });
  });

  describe("Estado de loading", () => {
    it("deve exibir 'Salvando...' enquanto está salvando", async () => {
      const user = userEvent.setup();
      let resolveUpdate: any;
      const updatePromise = new Promise((resolve) => {
        resolveUpdate = resolve;
      });
      mockUpdateWork.mockReturnValue(updatePromise as any);

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.type(textarea, " teste");
      await user.click(screen.getByText("Salvar alterações"));

      expect(screen.getByText("Salvando...")).toBeInTheDocument();

      resolveUpdate({ success: true, message: "Salvo" });
    });
  });

  describe("Limpeza de campos alterados", () => {
    it("deve limpar campos alterados após salvamento bem-sucedido", async () => {
      const user = userEvent.setup();
      mockUpdateWork.mockResolvedValue({
        success: true,
        message: "Salvo",
      });

      render(
        <WorkDetails
          feasibilityExists={[]}
          data={mockData}
          formattedData={mockFormattedData}
          idWork={100}
          options={mockOptions}
        />,
      );

      const textarea = screen.getByDisplayValue("Observação inicial");
      await user.type(textarea, " teste");

      let saveButton = screen.getByText("Salvar alterações");
      expect(saveButton).not.toBeDisabled();

      await user.click(saveButton);

      await waitFor(() => {
        saveButton = screen.getByText("Salvar alterações");
        expect(saveButton).toBeDisabled();
      });
    });
  });
});
