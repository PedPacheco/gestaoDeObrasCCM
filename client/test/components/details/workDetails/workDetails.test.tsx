import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkDetails } from "@/components/details/workDetails/workDetails";

vi.mock("@/actions/works", () => ({
  UpdateWork: vi.fn(),
}));

vi.mock("@/contexts/userContext", () => ({
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
}));

vi.mock("@mui/material/Select", () => ({
  __esModule: true,
  default: ({ value, onChange, children }: any) => (
    <select
      data-testid="suspension-select"
      value={value}
      onChange={(e) => onChange({ target: { value: e.target.value } })}
    >
      {children}
    </select>
  ),
}));

vi.mock("@mui/material/MenuItem", () => ({
  __esModule: true,
  default: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
}));

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
  default: ({ title, onClose, open, children }: any) => {
    if (!open) return null;

    const testId =
      title === "Sucesso"
        ? "success-modal"
        : title === "Motivo da Suspensão"
        ? "suspension-modal"
        : "modal";

    return (
      <div data-testid={testId}>
        <h2>{title}</h2>
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
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
        <option value="4">Status 4</option>
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

  describe("Renderização", () => {
    it("deve renderizar elementos principais corretamente", () => {
      render(<WorkDetails {...defaultProps} />);

      expect(screen.getByText("Informações gerais")).toBeInTheDocument();
      expect(screen.getByTestId("save-button")).toBeInTheDocument();
      expect(screen.getAllByTestId("data-item")).toHaveLength(20);
      expect(screen.getByText("OV123")).toBeInTheDocument();
      expect(screen.getByTestId("editable-column")).toBeInTheDocument();
    });
  });

  describe("Estado do botão de salvar", () => {
    it("deve desabilitar quando não há alterações e habilitar quando há", async () => {
      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      const saveButton = screen.getByTestId("save-button");
      expect(saveButton).toBeDisabled();

      await user.type(screen.getByTestId("editable-input"), "nova data");
      expect(saveButton).toBeEnabled();
    });
  });

  describe("Edição de campos", () => {
    it("deve atualizar valores dos campos editáveis", async () => {
      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      const statusSelect = screen.getByTestId("status-select");
      await user.selectOptions(statusSelect, "2");
      expect(statusSelect).toHaveValue("2");

      const textarea = screen.getByText(
        "Obra em andamento conforme cronograma"
      );
      await userEvent.clear(textarea);
      await userEvent.type(textarea, "Nova observação");
      expect(textarea).toHaveValue("Nova observação");
    });

    it("deve formatar corretamente a data quando alterada", async () => {
      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      const editableInput = screen.getByTestId("editable-input");
      await user.clear(editableInput);
      await user.type(editableInput, "15/02/2024");

      expect(editableInput).toHaveValue("15/02/2024");
    });
  });

  describe("Salvamento de alterações", () => {
    it("deve salvar com sucesso e exibir modal de sucesso", async () => {
      const { UpdateWork } = await import("@/actions/works");
      const mockUpdateWork = vi.mocked(UpdateWork);
      mockUpdateWork.mockResolvedValue({
        success: true,
        message: "Alterações salvas com sucesso",
      });

      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("status-select"), "2");
      await user.click(screen.getByTestId("save-button"));

      await waitFor(() => {
        expect(mockUpdateWork).toHaveBeenCalledWith({ id_status: "2" }, 123);
        expect(screen.getByTestId("success-modal")).toBeInTheDocument();
      });
    });

    it("deve mostrar estado de carregamento durante salvamento", async () => {
      const { UpdateWork } = await import("@/actions/works");
      vi.mocked(UpdateWork).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ success: true, message: "Sucesso" }),
              100
            )
          )
      );

      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("status-select"), "2");
      await user.click(screen.getByTestId("save-button"));

      expect(screen.getByText("Salvando...")).toBeInTheDocument();
      expect(screen.getByTestId("save-button")).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByText("Salvar alterações")).toBeInTheDocument();
      });
    });

    it("deve limpar changedFields após salvamento bem-sucedido", async () => {
      const { UpdateWork } = await import("@/actions/works");
      vi.mocked(UpdateWork).mockResolvedValue({
        success: true,
        message: "Alterações salvas com sucesso",
      });

      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("status-select"), "2");
      await user.click(screen.getByTestId("save-button"));

      await waitFor(() => {
        expect(screen.getByTestId("success-modal")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Close"));
      expect(screen.getByTestId("save-button")).toBeDisabled();
    });
  });

  describe("Tratamento de erros", () => {
    it("deve exibir modal de erro com mensagem específica quando UpdateWork falha", async () => {
      const { UpdateWork } = await import("@/actions/works");
      vi.mocked(UpdateWork).mockResolvedValue({
        success: false,
        error: "Erro qualquer",
      });

      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("status-select"), "2");
      await user.click(screen.getByTestId("save-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Erro qualquer"
        );
      });
    });

    it("deve exibir mensagem padrão quando erro é undefined", async () => {
      const { UpdateWork } = await import("@/actions/works");
      vi.mocked(UpdateWork).mockResolvedValue({
        success: false,
        error: undefined,
      });

      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("status-select"), "2");
      await user.click(screen.getByTestId("save-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Erro ao salvar alterações"
        );
      });
    });

    it("deve exibir erro de conexão quando UpdateWork lança exceção", async () => {
      const { UpdateWork } = await import("@/actions/works");
      vi.mocked(UpdateWork).mockRejectedValue(new Error("Network error"));

      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("status-select"), "2");
      await user.click(screen.getByTestId("save-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Erro de conexão. Tente novamente."
        );
      });
    });

    it("deve fechar modal de erro ao clicar em close", async () => {
      const { UpdateWork } = await import("@/actions/works");
      vi.mocked(UpdateWork).mockResolvedValue({
        success: false,
        error: "Erro",
      });

      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("status-select"), "2");
      await user.click(screen.getByTestId("save-button"));

      await waitFor(() =>
        expect(screen.getByTestId("error-modal")).toBeInTheDocument()
      );

      await user.click(screen.getByText("Close"));
      expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
    });
  });

  describe("Funcionalidade de suspensão", () => {
    it("deve abrir modal de suspensão quando status for 4", async () => {
      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("status-select"), "4");

      await waitFor(() => {
        expect(screen.getByTestId("suspension-modal")).toBeInTheDocument();
        expect(screen.getByText("Motivo da Suspensão")).toBeInTheDocument();
      });
    });

    it("deve selecionar motivo de suspensão, confirmar e salvar", async () => {
      const { UpdateWork } = await import("@/actions/works");
      vi.mocked(UpdateWork).mockResolvedValue({
        success: true,
        message: "Alterações salvas com sucesso",
      });

      const user = userEvent.setup();
      render(<WorkDetails {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("status-select"), "4");
      await waitFor(() =>
        expect(screen.getByTestId("suspension-modal")).toBeInTheDocument()
      );

      const selectSuspension = within(
        screen.getByTestId("suspension-modal")
      ).getByRole("combobox");
      await user.click(selectSuspension);

      const option = await screen.findByRole("option", {
        name: /sem acesso ao local da obra/i,
      });
      await user.click(option);

      expect(selectSuspension).toHaveTextContent(
        /sem acesso ao local da obra/i
      );

      await user.click(screen.getByText("Confirmar"));
      await waitFor(() =>
        expect(screen.queryByTestId("suspension-modal")).not.toBeInTheDocument()
      );

      await user.click(screen.getByTestId("save-button"));

      await waitFor(() => {
        expect(vi.mocked(UpdateWork)).toHaveBeenCalledWith(
          { id_status: "4", reasonSuspension: "Sem acesso ao local da obra" },
          123
        );
      });
    });
  });
});
