import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import TabPanel from "@/components/details/tabPanel/TabPanel";

// Mock actions
vi.mock("@/actions/executionReport.action", () => ({
  deleteExecutionReport: vi.fn(),
}));

vi.mock("@/actions/schedules", () => ({
  deleteSchedule: vi.fn(),
  ValidatedSchedule: vi.fn(),
  ConfirmedSchedule: vi.fn(),
}));

// Mock hooks
const mockResetForm = vi.fn();
const mockSetOpenExecChangeDialog = vi.fn();

vi.mock("@/hooks/details/useScheduleForm", () => ({
  useScheduleForm: vi.fn(() => ({
    resetForm: mockResetForm,
    setOpenExecChangeDialog: mockSetOpenExecChangeDialog,
    formData: {},
    errors: {},
  })),
}));

// Mock panel items
vi.mock("@/components/details/panelItems/workCostPanelItem", () => ({
  default: ({ data }: any) => (
    <div data-testid="work-cost-panel">Custos: {data?.name}</div>
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

const showErrorMock = vi.fn();
const showSuccessMock = vi.fn();
const handleDialogMock = vi.fn();
const handleExecutionDialogMock = vi.fn();
const handleRejectedModalOpenMock = vi.fn();
const openConfirmDeleteScheduleMock = vi.fn();
const openConfirmDeleteExecutionMock = vi.fn();

vi.mock("@/components/details/modals/detailsModals", () => ({
  ModalsManager: vi.fn((props: any) => {
    const { ref } = props;
    if (ref) {
      ref.current = {
        showError: showErrorMock,
        showSuccess: showSuccessMock,
        handleDialog: handleDialogMock,
        handleExecutionDialog: handleExecutionDialogMock,
        handleRejectedModalOpen: handleRejectedModalOpenMock,
        openConfirmDeleteSchedule: openConfirmDeleteScheduleMock,
        openConfirmDeleteExecution: openConfirmDeleteExecutionMock,
      };
    }
    return <div data-testid="modals-manager">ModalsManager</div>;
  }),
}));

const mockHandleConfirm = vi.fn();
const mockHandleDelete = vi.fn();
const mockHandleExecutionReportDelete = vi.fn();
const mockHandleValidated = vi.fn();
const mockHandleReject = vi.fn();
const mockSetConfirmedSchedule = vi.fn();
const mockSetValidatedSchedule = vi.fn();
const mockSetRejectedSchedule = vi.fn();

vi.mock("@/hooks/details/useScheduleHandlers", () => ({
  useScheduleHandlers: vi.fn(() => ({
    handleConfirm: mockHandleConfirm,
    handleDelete: mockHandleDelete,
    handleExecutionReportDelete: mockHandleExecutionReportDelete,
    handleValidated: mockHandleValidated,
    handleReject: mockHandleReject,
    rejectedSchedule: null,
    setConfirmedSchedule: mockSetConfirmedSchedule,
    setValidatedSchedule: mockSetValidatedSchedule,
    setRejectedSchedule: mockSetRejectedSchedule,
  })),
}));

vi.mock("@/contexts/userContext", () => ({
  useUser: vi.fn(() => ({
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
  })),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return { ...actual, startTransition: (callback: any) => callback() };
});

describe("TabPanel Component", () => {
  const mockWorkData = {
    id: "1",
    id_status: "1",
    name: "Test Work",
    programacoes: [
      {
        id: 1,
        name: "Schedule 1",
        exec: "50",
        tecnico: "Jorge",
        restricao: "Data",
      },
      {
        id: 2,
        name: "Schedule 2",
        exec: undefined,
        tecnico: "Jorge",
        restricao: "Trânsito",
      },
    ],
  };

  const mockExecutionReportData = [
    { id: 1, name: "Report 1" },
    { id: 2, name: "Report 2" },
  ];

  const mockOptions = {
    tecnico: [{ id: 1, tecnico: "Jorge" }],
    restricao: [
      { id: 1, restricao: "Data", tipo_restricao: "REPROVADO" },
      { id: 2, restricao: "Trânsito", tipo_restricao: "EXECUÇÃO" },
    ],
  };

  const defaultProps = {
    workData: mockWorkData,
    executionReportData: mockExecutionReportData,
    rejectionsData: [],
    feasibilityExists: [],
    options: mockOptions,
    id: "1",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Renderização e navegação", () => {
    it("deve renderizar painel de custos por padrão e alternar entre abas", () => {
      render(<TabPanel {...defaultProps} />);

      expect(screen.getByTestId("work-cost-panel")).toBeInTheDocument();
      expect(screen.getByTestId("modals-manager")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Programações"));
      expect(screen.getByTestId("schedule-panel")).toBeInTheDocument();
      expect(localStorage.getItem("tab")).toBe("1");

      fireEvent.click(screen.getByText("Relatórios execuções"));
      expect(screen.getByTestId("execution-report-panel")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Serviços"));
      expect(screen.getByText("Em breve")).toBeInTheDocument();
    });

    it("deve carregar aba salva no localStorage", () => {
      localStorage.setItem("tab", "1");
      render(<TabPanel {...defaultProps} />);

      expect(screen.getByTestId("schedule-panel")).toBeInTheDocument();
    });

    it("deve atualizar dados quando workData muda", () => {
      const { rerender } = render(<TabPanel {...defaultProps} />);
      expect(screen.getByText("Custos: Test Work")).toBeInTheDocument();

      const newWorkData = { ...mockWorkData, name: "Updated Work" };
      rerender(<TabPanel {...defaultProps} workData={newWorkData} />);

      expect(screen.getByText("Custos: Updated Work")).toBeInTheDocument();
    });
  });

  describe("Edição e deleção", () => {
    it("deve abrir modal ao editar programação com exec definido e undefined", () => {
      render(<TabPanel {...defaultProps} />);
      fireEvent.click(screen.getByText("Programações"));

      fireEvent.click(screen.getByTestId("edit-schedule-0"));
      expect(handleDialogMock).toHaveBeenCalledWith(true);

      fireEvent.click(screen.getByTestId("edit-schedule-1"));
      expect(handleDialogMock).toHaveBeenCalledWith(true);
    });

    it("deve abrir modal ao editar e deletar relatório de execução", () => {
      render(<TabPanel {...defaultProps} />);
      fireEvent.click(screen.getByText("Relatórios execuções"));

      fireEvent.click(screen.getByTestId("edit-execution-0"));
      expect(handleExecutionDialogMock).toHaveBeenCalledWith(true);

      fireEvent.click(screen.getByTestId("delete-execution-0"));
      expect(openConfirmDeleteExecutionMock).toHaveBeenCalledWith(1);
    });

    it("deve abrir modal de confirmação ao deletar programação", () => {
      render(<TabPanel {...defaultProps} />);
      fireEvent.click(screen.getByText("Programações"));

      fireEvent.click(screen.getByTestId("delete-schedule-0"));
      expect(openConfirmDeleteScheduleMock).toHaveBeenCalledWith(1);
    });
  });

  describe("Fechamento de diálogos", () => {
    it("deve resetar formulário e estados ao fechar dialog", async () => {
      render(<TabPanel {...defaultProps} />);
      fireEvent.click(screen.getByText("Programações"));
      fireEvent.click(screen.getByTestId("edit-schedule-0"));

      const { ModalsManager } =
        await import("@/components/details/modals/detailsModals");
      const lastCall =
        vi.mocked(ModalsManager).mock.calls[
          vi.mocked(ModalsManager).mock.calls.length - 1
        ];
      lastCall[0].onCloseDialog();

      expect(mockResetForm).toHaveBeenCalled();
      expect(handleDialogMock).toHaveBeenCalledWith(false);
      expect(handleExecutionDialogMock).toHaveBeenCalledWith(false);
    });
  });

  describe("Integração com hooks", () => {
    it("deve passar dados corretos para os hooks", async () => {
      const { useScheduleHandlers } =
        await import("@/hooks/details/useScheduleHandlers");
      const { useScheduleForm } =
        await import("@/hooks/details/useScheduleForm");

      render(<TabPanel {...defaultProps} />);

      const handlersCall =
        vi.mocked(useScheduleHandlers).mock.calls[
          vi.mocked(useScheduleHandlers).mock.calls.length - 1
        ][0];
      expect(handlersCall).toHaveProperty("data");
      expect(handlersCall).toHaveProperty("idWork", "1");
      expect(handlersCall).toHaveProperty("setError");
      expect(handlersCall).toHaveProperty("setSuccess");

      const formCall =
        vi.mocked(useScheduleForm).mock.calls[
          vi.mocked(useScheduleForm).mock.calls.length - 1
        ][0];
      expect(formCall).toHaveProperty("options");
      expect(formCall.options).toEqual(mockOptions);
    });
  });
});
