import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import TabPanel from "@/components/details/TabPanel"; // Ajuste o caminho conforme sua estrutura
import { deleteExecutionReport } from "@/actions/executionReport.action";
import { deleteSchedule } from "@/actions/schedules";
import { useScheduleForm } from "@/hooks/useScheduleForm";

// Mock dos módulos externos
vi.mock("@/actions/executionReport.action", () => ({
  deleteExecutionReport: vi.fn(),
}));

vi.mock("@/actions/schedules", () => ({
  deleteSchedule: vi.fn(),
}));

// Mock do hook useScheduleForm
vi.mock("@/hooks/useScheduleForm", () => ({
  useScheduleForm: vi.fn(() => ({
    resetForm: vi.fn(),
    setOpenExecChangeDialog: vi.fn(),
  })),
}));

// Mock dos componentes filhos
vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ onClick, text }: any) => (
    <button onClick={onClick} data-testid="button-component">
      {text}
    </button>
  ),
}));

vi.mock("@/components/common/confirmationModal", () => ({
  default: ({ open, onClose, onConfirm, idSchedule, title, message }: any) =>
    open ? (
      <div data-testid="confirmation-modal">
        <h2>{title}</h2>
        <p>{message}</p>
        <button
          onClick={() => onConfirm(idSchedule)}
          data-testid="confirm-button"
        >
          Confirmar
        </button>
        <button onClick={onClose} data-testid="close-button">
          Fechar
        </button>
      </div>
    ) : null,
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

vi.mock(
  "@/components/details/executionReportDialog/executionReportDialog",
  () => ({
    ExecutionReportDialog: ({ open, onClose }: any) =>
      open ? (
        <div data-testid="execution-report-dialog">
          <button onClick={onClose} data-testid="execution-dialog-close">
            Fechar
          </button>
        </div>
      ) : null,
  })
);

vi.mock("@/components/details/panelItems/executionReportPanelItem", () => ({
  default: ({ data, onEdit, onDelete }: any) => (
    <div data-testid="execution-report-panel">
      {data?.map((item: any, index: number) => (
        <div key={index}>
          <button
            onClick={() => onEdit(item)}
            data-testid={`edit-execution-${index}`}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(item.id)}
            data-testid={`delete-execution-${index}`}
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/details/panelItems/schedulePanelItem", () => ({
  default: ({ data, onEdit, onDelete }: any) => (
    <div data-testid="schedule-panel">
      {data?.map((item: any, index: number) => (
        <div key={index}>
          <button
            onClick={() => onEdit(item)}
            data-testid={`edit-schedule-${index}`}
          >
            Editar
          </button>
          <button
            onClick={() => onDelete(item.id)}
            data-testid={`delete-schedule-${index}`}
          >
            Excluir
          </button>
        </div>
      ))}
    </div>
  ),
}));

vi.mock("@/components/details/panelItems/workCostPanelItem", () => ({
  default: ({ data }: any) => (
    <div data-testid="work-cost-panel">Custos: {data?.name}</div>
  ),
}));

vi.mock("@/components/details/scheduleDialog/dialog", () => ({
  default: ({ open, onClose, onExecutionDialogOpen }: any) =>
    open ? (
      <div data-testid="schedule-dialog">
        <button onClick={onClose} data-testid="schedule-dialog-close">
          Fechar
        </button>
        <button
          onClick={() => onExecutionDialogOpen(true)}
          data-testid="open-execution-dialog"
        >
          Abrir Execução
        </button>
      </div>
    ) : null,
}));

// Mock do React.startTransition
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    startTransition: (callback: any) => callback(),
  };
});

describe("TabPanel", () => {
  const mockWorkData = {
    id: 1,
    name: "Test Work",
    programacoes: [
      { id: 1, name: "Schedule 1", exec: "1" },
      { id: 2, name: "Schedule 2", exec: "0" },
    ],
  };

  const mockExecutionReportData = [
    { id: 1, name: "Report 1" },
    { id: 2, name: "Report 2" },
  ];

  const mockOptions = {
    option1: "value1",
    option2: "value2",
  };

  const defaultProps = {
    workData: mockWorkData,
    executionReportData: mockExecutionReportData,
    options: mockOptions,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Renderização inicial", () => {
    it("deve renderizar o componente corretamente", () => {
      render(<TabPanel {...defaultProps} />);

      expect(screen.getByText("Custos")).toBeInTheDocument();
      expect(screen.getByText("Programações")).toBeInTheDocument();
      expect(screen.getByText("Serviços")).toBeInTheDocument();
      expect(screen.getByText("Relatórios execuções")).toBeInTheDocument();
    });

    it("deve mostrar o painel de custos por padrão", () => {
      render(<TabPanel {...defaultProps} />);

      expect(screen.getByTestId("work-cost-panel")).toBeInTheDocument();
      expect(screen.getByText("Custos: Test Work")).toBeInTheDocument();
    });
  });

  describe("Navegação entre abas", () => {
    it("deve trocar para aba de programações", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));

      expect(screen.getByTestId("schedule-panel")).toBeInTheDocument();
      expect(screen.getByTestId("button-component")).toBeInTheDocument();
    });

    it("deve trocar para aba de serviços", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Serviços"));

      expect(screen.getByText("Em breve")).toBeInTheDocument();
    });

    it("deve trocar para aba de relatórios de execução", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Relatórios execuções"));

      expect(screen.getByTestId("execution-report-panel")).toBeInTheDocument();
    });
  });

  describe("Funcionalidades de Schedule", () => {
    it("deve abrir dialog de nova programação", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("button-component"));

      expect(screen.getByTestId("schedule-dialog")).toBeInTheDocument();
    });

    it("deve abrir dialog de edição de programação", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("edit-schedule-0"));

      expect(screen.getByTestId("schedule-dialog")).toBeInTheDocument();
    });

    it("deve fechar dialog de programação", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("button-component"));
      fireEvent.click(screen.getByTestId("schedule-dialog-close"));

      // O mock já está configurado para retornar as funções
      expect(screen.queryByTestId("schedule-dialog")).not.toBeInTheDocument();
    });

    it("deve abrir modal de confirmação para exclusão de schedule", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("delete-schedule-0"));

      expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
      expect(screen.getByText("Exclusão de programação")).toBeInTheDocument();
    });

    it("deve deletar schedule com sucesso", async () => {
      vi.mocked(deleteSchedule).mockResolvedValue({
        success: true,
        message: "Schedule deletado com sucesso",
      });

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("delete-schedule-0"));
      fireEvent.click(screen.getByTestId("confirm-button"));

      await waitFor(() => {
        expect(deleteSchedule).toHaveBeenCalledWith(1, 1);
      });
    });

    it("deve mostrar erro ao falhar na deleção de schedule", async () => {
      vi.mocked(deleteSchedule).mockResolvedValue({
        success: false,
        error: "Erro ao deletar schedule",
      });

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("delete-schedule-0"));
      fireEvent.click(screen.getByTestId("confirm-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(
          screen.getByText("Erro ao deletar schedule")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Funcionalidades de Execution Report", () => {
    it("deve abrir dialog de edição de relatório de execução", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Relatórios execuções"));
      fireEvent.click(screen.getByTestId("edit-execution-0"));

      expect(screen.getByTestId("execution-report-dialog")).toBeInTheDocument();
    });

    it("deve abrir modal de confirmação para exclusão de execution report", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Relatórios execuções"));
      fireEvent.click(screen.getByTestId("delete-execution-0"));

      expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
      expect(screen.getByText("Exclusão de relatório")).toBeInTheDocument();
    });

    it("deve deletar execution report com sucesso", async () => {
      vi.mocked(deleteExecutionReport).mockResolvedValue({
        success: true,
        message: "Relatório deletado com sucesso",
      });

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Relatórios execuções"));
      fireEvent.click(screen.getByTestId("delete-execution-0"));
      fireEvent.click(screen.getByTestId("confirm-button"));

      await waitFor(() => {
        expect(deleteExecutionReport).toHaveBeenCalledWith(1, 1);
      });
    });

    it("deve mostrar erro ao falhar na deleção de execution report", async () => {
      vi.mocked(deleteExecutionReport).mockResolvedValue({
        success: false,
        error: "Erro ao deletar relatório",
      });

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Relatórios execuções"));
      fireEvent.click(screen.getByTestId("delete-execution-0"));
      fireEvent.click(screen.getByTestId("confirm-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(
          screen.getByText("Erro ao deletar relatório")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Modais e Estados", () => {
    it("deve abrir modal de sucesso", async () => {
      vi.mocked(deleteSchedule).mockResolvedValue({
        success: true,
        message: "Operação realizada com sucesso",
      });

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("delete-schedule-0"));
      fireEvent.click(screen.getByTestId("confirm-button"));

      await waitFor(() => {
        expect(screen.getByTestId("modal")).toBeInTheDocument();
        expect(
          screen.getByText("Operação realizada com sucesso")
        ).toBeInTheDocument();
      });
    });

    it("deve fechar modal de sucesso", async () => {
      vi.mocked(deleteSchedule).mockResolvedValue({
        success: true,
        message: "Operação realizada com sucesso",
      });

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("delete-schedule-0"));
      fireEvent.click(screen.getByTestId("confirm-button"));

      await waitFor(() => {
        expect(screen.getByTestId("modal")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("modal-close"));

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("deve fechar modal de deleção do relatório de execução", async () => {
      vi.mocked(deleteSchedule).mockResolvedValue({
        success: true,
        message: "Operação realizada com sucesso",
      });

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Relatórios execuções"));
      fireEvent.click(screen.getByTestId("delete-execution-0"));

      await waitFor(() => {
        expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("close-button"));

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("deve fechar modal de erro", async () => {
      vi.mocked(deleteSchedule).mockResolvedValue({
        success: false,
        error: "Erro de teste",
      });

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("delete-schedule-0"));
      fireEvent.click(screen.getByTestId("confirm-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("error-close"));

      expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
    });

    it("deve fechar modal de confirmação", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("delete-schedule-0"));
      fireEvent.click(screen.getByTestId("close-button"));

      expect(
        screen.queryByTestId("confirmation-modal")
      ).not.toBeInTheDocument();
    });
  });

  describe("useEffect e props", () => {
    it("deve atualizar dados quando workData muda", () => {
      const { rerender } = render(<TabPanel {...defaultProps} />);

      const newWorkData = { ...mockWorkData, name: "Updated Work" };
      rerender(<TabPanel {...defaultProps} workData={newWorkData} />);

      fireEvent.click(screen.getByText("Custos"));
      expect(screen.getByText("Custos: Updated Work")).toBeInTheDocument();
    });
  });

  describe("CustomTabPanel", () => {
    it("deve renderizar conteúdo apenas quando aba está ativa", () => {
      render(<TabPanel {...defaultProps} />);

      // Aba 0 (Custos) está ativa por padrão
      expect(screen.getByTestId("work-cost-panel")).toBeInTheDocument();

      // Outras abas não devem estar visíveis
      expect(screen.queryByTestId("schedule-panel")).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("execution-report-panel")
      ).not.toBeInTheDocument();
    });
  });

  describe("Tratamento de erros", () => {
    it("deve tratar erro de exception na deleção de schedule", async () => {
      vi.mocked(deleteSchedule).mockRejectedValue(new Error("Network error"));

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("delete-schedule-0"));
      fireEvent.click(screen.getByTestId("confirm-button"));

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("deve tratar erro silencioso na deleção de execution report", async () => {
      vi.mocked(deleteExecutionReport).mockRejectedValue(
        new Error("Network error")
      );

      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Relatórios execuções"));
      fireEvent.click(screen.getByTestId("delete-execution-0"));
      fireEvent.click(screen.getByTestId("confirm-button"));

      await waitFor(() => {
        expect(deleteExecutionReport).toHaveBeenCalled();
      });
    });
  });

  describe("Interação com dialog de execução", () => {
    it("deve abrir dialog de execução através do schedule dialog", () => {
      render(<TabPanel {...defaultProps} />);
      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("button-component"));
      fireEvent.click(screen.getByTestId("open-execution-dialog"));
      expect(screen.getByTestId("execution-report-dialog")).toBeInTheDocument();
    });
  });

  describe("Processamento de dados de schedule", () => {
    it("deve processar exec como string ao editar schedule", () => {
      render(<TabPanel {...defaultProps} />);

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("edit-schedule-0"));

      // Verifica se o dialog foi aberto
      expect(screen.getByTestId("schedule-dialog")).toBeInTheDocument();
    });

    it("deve processar schedule com exec undefined", () => {
      const workDataWithUndefinedExec = {
        ...mockWorkData,
        programacoes: [
          { id: 1, name: "Schedule 1" }, // sem propriedade exec
        ],
      };

      render(
        <TabPanel {...defaultProps} workData={workDataWithUndefinedExec} />
      );

      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("edit-schedule-0"));

      expect(screen.getByTestId("schedule-dialog")).toBeInTheDocument();
    });
  });
});
