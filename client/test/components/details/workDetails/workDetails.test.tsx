import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkDetails } from "@/components/details/workDetails/workDetails";

// Mock das dependências
vi.mock("@/actions/works", () => ({
  UpdateWork: vi.fn(),
}));

vi.mock("@/contexts/userContext", () => {
  return {
    useUser: () => ({
      user: {
        id: 1,
        username: "test-user",
        id_regional: "001",
        nome_usuario: "Test User",
        email: "test@example.com",
      },
      permissions: {
        id: 1,
        username: "test-user",
        permissao: "total",
        permissao_visualizacao: "total",
      },
    }),
  };
});

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ text, onClick, disabled, styled }: any) => (
    <button
      data-testid="save-button"
      onClick={onClick}
      disabled={disabled}
      className={styled}
    >
      {text}
    </button>
  ),
}));

vi.mock("@/components/common/ErrorModal", () => ({
  __esModule: true,
  default: ({ open, message, onClose, icon }: any) =>
    open ? (
      <div data-testid="error-modal">
        <span data-testid="error-message">{message}</span>
        <button onClick={onClose}>Close</button>
        {icon}
      </div>
    ) : null,
}));

vi.mock("@/components/common/Modal", () => ({
  __esModule: true,
  default: ({ title, onClose, open, children }: any) =>
    open ? (
      <div data-testid="success-modal">
        <h2>{title}</h2>
        <button onClick={onClose}>Close</button>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/details/workDetails/dataItem", () => ({
  __esModule: true,
  default: ({ label, value, status, background }: any) => (
    <div data-testid="data-item">
      <span data-testid="data-item-label">{label}</span>
      <span data-testid="data-item-value">{value}</span>
      {status && <span data-testid="data-item-status">{status}</span>}
      {background && (
        <span data-testid="data-item-background">{background}</span>
      )}
    </div>
  ),
}));

vi.mock("@/components/details/workDetails/editableColumn", () => ({
  EditableColumn: ({ data, options, onHandleChange }: any) => (
    <div data-testid="editable-column">
      <input
        data-testid="editable-input"
        value={data.data_empreitamento}
        onChange={(e) => onHandleChange("data_empreitamento", e.target.value)}
      />
      <select
        data-testid="status-select"
        value={data.id_status}
        onChange={(e) => onHandleChange("id_status", e.target.value)}
      >
        <option value="1">Status 1</option>
        <option value="2">Status 2</option>
      </select>
      <select
        data-testid="turma-select"
        value={data.id_turma}
        onChange={(e) => onHandleChange("id_turma", e.target.value)}
      >
        <option value="1">Turma 1</option>
        <option value="2">Turma 2</option>
      </select>
    </div>
  ),
}));

describe("WorkDetails component", () => {
  const mockData = {
    ovnota: "OV123",
    tipos: "Tipo A",
    municipios: "São Paulo",
    referencia: "REF001",
    circuitos: "CIR001",
    conjunto: "CONJ001",
    pep: "PEP001",
    status_pep: "Ativo",
    diagrama: "DIAG001",
    status_diagrama: "Aprovado",
    ordem_dci: "DCI001",
    status_170: "Concluído",
    ordem_dcd: "DCD001",
    status_190: "Em andamento",
    ordem_dca: "DCA001",
    status_150: "Pendente",
    ordem_dcim: "DCIM001",
    status_180: "Ativo",
    executado: "80",
    ano_plan: "2024",
    empreendimento: "EMP001",
    id_status: "1",
    id_turma: "1",
    status_ov_sap: "Ativo",
    tipo_ads: "CONVENCIONAL",
    observ_obra: "Obra em andamento conforme cronograma",
    id: "123",
  };

  const mockFormattedData = {
    entrada: "01/01/2024",
    prazo: "15/03/2024",
    prazoFinal: "30/03/2024",
    data_conclusao: "25/03/2024",
    dataEmpreitamento: "10/01/2024",
    backgroundColor: "#ff0000",
    executadoFormatted: "80%",
  };

  const mockOptions = {
    status: [
      { id: 1, status: "Status 1" },
      { id: 2, status: "Status 2" },
    ],
    parceira: [
      { id: 1, turma: "Turma 1" },
      { id: 2, turma: "Turma 2" },
    ],
  };

  const defaultProps = {
    data: mockData,
    formattedData: mockFormattedData,
    idWork: 123,
    options: mockOptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o título e botão de salvar", () => {
    render(<WorkDetails {...defaultProps} />);

    expect(screen.getByText("Informações gerais")).toBeInTheDocument();
    expect(screen.getByTestId("save-button")).toBeInTheDocument();
    expect(screen.getByText("Salvar alterações")).toBeInTheDocument();
  });

  it("deve renderizar todos os DataItems com os valores corretos", () => {
    render(<WorkDetails {...defaultProps} />);

    const dataItems = screen.getAllByTestId("data-item");
    expect(dataItems).toHaveLength(20);

    // Verificar alguns valores específicos
    expect(screen.getByText("OV123")).toBeInTheDocument();
    expect(screen.getByText("São Paulo")).toBeInTheDocument();
    expect(
      screen.getByText("Obra em andamento conforme cronograma")
    ).toBeInTheDocument();
  });

  it("deve renderizar o EditableColumn", () => {
    render(<WorkDetails {...defaultProps} />);

    expect(screen.getByTestId("editable-column")).toBeInTheDocument();
    expect(screen.getByTestId("editable-input")).toBeInTheDocument();
    expect(screen.getByTestId("status-select")).toBeInTheDocument();
    expect(screen.getByTestId("turma-select")).toBeInTheDocument();
  });

  it("deve desabilitar o botão de salvar quando não há alterações", () => {
    render(<WorkDetails {...defaultProps} />);

    const saveButton = screen.getByTestId("save-button");
    expect(saveButton).toBeDisabled();
  });

  it("deve habilitar o botão de salvar quando há alterações", async () => {
    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    const editableInput = screen.getByTestId("editable-input");
    await user.type(editableInput, "nova data");

    const saveButton = screen.getByTestId("save-button");
    expect(saveButton).toBeEnabled();
  });

  it("deve atualizar os dados editáveis quando há mudanças", async () => {
    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    const statusSelect = screen.getByTestId("status-select");
    await user.selectOptions(statusSelect, "2");

    expect(statusSelect).toHaveValue("2");
  });

  it("deve formatar corretamente a data quando alterada", async () => {
    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    const editableInput = screen.getByTestId("editable-input");
    await user.clear(editableInput);
    await user.type(editableInput, "15/02/2024");

    // A lógica de formatação está no handleDataChange do componente
    expect(editableInput).toHaveValue("15/02/2024");
  });

  it("deve chamar updateWork ao salvar com sucesso", async () => {
    const { UpdateWork } = await import("@/actions/works");
    const mockUpdateWork = vi.mocked(UpdateWork);
    mockUpdateWork.mockResolvedValue({
      success: true,
      message: "Alterações salvas com sucesso",
    });

    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    // Fazer uma alteração
    const statusSelect = screen.getByTestId("status-select");
    await user.selectOptions(statusSelect, "2");

    // Salvar
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateWork).toHaveBeenCalledWith({ id_status: "2" }, 123);
    });
  });

  it("deve mostrar modal de sucesso após salvar", async () => {
    const { UpdateWork } = await import("@/actions/works");
    const mockUpdateWork = vi.mocked(UpdateWork);
    mockUpdateWork.mockResolvedValue({
      success: true,
      message: "Alterações salvas com sucesso",
    });

    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    // Fazer uma alteração
    const statusSelect = screen.getByTestId("status-select");
    await user.selectOptions(statusSelect, "2");

    // Salvar
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId("success-modal")).toBeInTheDocument();
      expect(
        screen.getByText("Alterações salvas com sucesso")
      ).toBeInTheDocument();
    });
  });

  it("deve mostrar modal de erro quando updateWork falha", async () => {
    const { UpdateWork } = await import("@/actions/works");
    const mockUpdateWork = vi.mocked(UpdateWork);
    mockUpdateWork.mockResolvedValue({
      success: false,
      error: "Erro qualquer",
    });

    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    // Fazer uma alteração
    const statusSelect = screen.getByTestId("status-select");
    await user.selectOptions(statusSelect, "2");

    // Salvar
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Erro qualquer"
      );
    });
  });

  it("deve mostrar modal de erro quando updateWork falha", async () => {
    const { UpdateWork } = await import("@/actions/works");
    const mockUpdateWork = vi.mocked(UpdateWork);
    mockUpdateWork.mockResolvedValue({
      success: false,
      error: undefined,
    });

    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    // Fazer uma alteração
    const statusSelect = screen.getByTestId("status-select");
    await user.selectOptions(statusSelect, "2");

    // Salvar
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Erro ao salvar alterações"
      );
    });
  });

  it("deve mostrar erro de conexão quando updateWork lança exceção", async () => {
    const { UpdateWork } = await import("@/actions/works");
    const mockUpdateWork = vi.mocked(UpdateWork);
    mockUpdateWork.mockRejectedValue(new Error("Network error"));

    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    // Fazer uma alteração
    const statusSelect = screen.getByTestId("status-select");
    await user.selectOptions(statusSelect, "2");

    // Salvar
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Erro de conexão. Tente novamente."
      );
    });
  });

  it("deve fechar o modal de erro ao clicar em close", async () => {
    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    const statusSelect = screen.getByTestId("status-select");
    await user.selectOptions(statusSelect, "2");

    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });

    const closeButton = screen.getByText("Close");
    await user.click(closeButton);

    expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
  });

  it("deve mostrar 'Salvando...' durante o processo de salvamento", async () => {
    const { UpdateWork } = await import("@/actions/works");
    const mockUpdateWork = vi.mocked(UpdateWork);

    // Simular delay na resposta
    mockUpdateWork.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true, message: "Sucesso" }), 100)
        )
    );

    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    // Fazer uma alteração
    const statusSelect = screen.getByTestId("status-select");
    await user.selectOptions(statusSelect, "2");

    // Salvar
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);

    // Verificar se mostra "Salvando..."
    expect(screen.getByText("Salvando...")).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // Aguardar conclusão
    await waitFor(() => {
      expect(screen.getByText("Salvar alterações")).toBeInTheDocument();
    });
  });

  it("deve limpar changedFields após salvamento bem-sucedido", async () => {
    const { UpdateWork } = await import("@/actions/works");
    const mockUpdateWork = vi.mocked(UpdateWork);
    mockUpdateWork.mockResolvedValue({
      success: true,
      message: "Alterações salvas com sucesso",
    });

    const user = userEvent.setup();
    render(<WorkDetails {...defaultProps} />);

    // Fazer uma alteração
    const statusSelect = screen.getByTestId("status-select");
    await user.selectOptions(statusSelect, "2");

    // Botão deve estar habilitado
    expect(screen.getByTestId("save-button")).toBeEnabled();

    // Salvar
    const saveButton = screen.getByTestId("save-button");
    await user.click(saveButton);

    // Aguardar salvamento e verificar se botão foi desabilitado novamente
    await waitFor(() => {
      expect(screen.getByTestId("success-modal")).toBeInTheDocument();
    });

    // Fechar modal de sucesso
    const closeButton = screen.getByText("Close");
    await user.click(closeButton);

    // Botão deve estar desabilitado pois changedFields foi limpo
    expect(screen.getByTestId("save-button")).toBeDisabled();
  });
});
