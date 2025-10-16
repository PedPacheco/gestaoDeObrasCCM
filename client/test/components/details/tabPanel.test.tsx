import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deleteExecutionReport } from "@/actions/executionReport.action";
import {
  ConfirmedSchedule,
  deleteSchedule,
  ValidatedSchedule,
} from "@/actions/schedules";
import * as UserContextModule from "@/contexts/userContext";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TabPanel from "@/components/details/tabPanel/TabPanel";

// Mock dos módulos externos
vi.mock("@/actions/executionReport.action", () => ({
  deleteExecutionReport: vi.fn(),
}));

vi.mock("@/actions/schedules", () => ({
  deleteSchedule: vi.fn(),
  ValidatedSchedule: vi.fn(),
  ConfirmedSchedule: vi.fn(),
}));

// Mock do hook useScheduleForm
vi.mock("@/hooks/useScheduleForm", () => ({
  useScheduleForm: vi.fn(() => ({
    resetForm: vi.fn(),
    setOpenExecChangeDialog: vi.fn(),
  })),
}));

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ onClick, text, disabled }: any) => {
    if (
      (text === "Validar programação" || text === "Confirmar programação") &&
      disabled !== undefined
    ) {
      return (
        <button
          onClick={onClick}
          data-testid="button-component"
          disabled={disabled}
        >
          {text}
        </button>
      );
    }

    return (
      <button onClick={onClick} data-testid="button-component">
        {text}
      </button>
    );
  },
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
      {
        id: 1,
        name: "Schedule 1",
        exec: "1",
        validate: false,
        confirm: false,
      },
      {
        id: 2,
        name: "Schedule 2",
        exec: "0",
        validate: false,
        confirm: false,
      },
      {
        id: 2,
        name: "Schedule 2",
        exec: null,
        validate: false,
        confirm: true,
      },
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
    id: "342",
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

    it("Deve renderizar o botão de validação desabilitado", () => {
      vi.spyOn(UserContextModule, "useUser").mockReturnValue({
        user: {
          id: 2,
          username: "partial-user",
          nome_usuario: "Partial User",
          id_regional: 2,
          email: "partial@example.com",
        },
        permissions: {
          id: 2,
          username: "partial-user",
          permissao: "total",
          permissao_visualizacao: "parcial",
        },
        login: vi.fn(),
        setUser: vi.fn(),
      });

      const workDataProps = { ...mockWorkData, id_status: 45 };
      render(<TabPanel {...defaultProps} workData={workDataProps} />);

      fireEvent.click(screen.getByText("Programações"));

      expect(screen.getByText("Validar programação")).toBeDisabled();
    });

    it("Deve renderizar o botão de confirmação desabilitado", () => {
      vi.spyOn(UserContextModule, "useUser").mockReturnValue({
        user: {
          id: 2,
          username: "partial-user",
          nome_usuario: "Partial User",
          id_regional: 2,
          email: "partial@example.com",
        },
        permissions: {
          id: 2,
          username: "partial-user",
          permissao: "total",
          permissao_visualizacao: "parcial",
        },
        login: vi.fn(),
        setUser: vi.fn(),
      });

      const workDataProps = { ...mockWorkData, id_status: 45 };
      render(<TabPanel {...defaultProps} workData={workDataProps} />);

      fireEvent.click(screen.getByText("Programações"));

      expect(screen.getByText("Confirmar programação")).toBeDisabled();
    });
  });
});
