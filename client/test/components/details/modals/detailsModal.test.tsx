import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import React from "react";
import {
  ModalsManager,
  ModalsManagerRef,
} from "@/components/details/modals/detailsModals";

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

// 🔹 Mock dos componentes filhos para simplificar a renderização
vi.mock("@/components/common/Modal", () => ({
  default: ({ title, onClose, open, children }: any) =>
    open ? (
      <div>
        <p>{title}</p>
        <button onClick={onClose}>close</button>
        <div>{children}</div>
      </div>
    ) : null,
}));

vi.mock("@/components/details/modals/confirmationModal", () => ({
  default: ({ title, onConfirm, onClose, open, message }: any) =>
    open ? (
      <div>
        <p>{title}</p>
        <p>{message}</p>
        <button onClick={onConfirm}>confirm</button>
        <button onClick={onClose}>cancel</button>
      </div>
    ) : null,
}));

vi.mock("@/components/details/modals/failureModal", () => ({
  default: ({ open, onClose }: any) =>
    open ? (
      <div>
        <p>FailureModal</p>
        <button onClick={onClose} data-testid="close-failure">
          close failure
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/details/modals/scheduleDialog/dialog", () => ({
  default: ({ open, onClose, onSuccess, onError }: any) =>
    open ? (
      <div>
        <p>ScheduleFormDialog</p>
        <button onClick={() => onSuccess("ok sucesso")}>success</button>
        <button onClick={() => onError("erro schedule")}>error</button>
        <button onClick={onClose} data-testid="close-schedule">
          close
        </button>
      </div>
    ) : null,
}));

vi.mock(
  "@/components/details/modals/executionReportDialog/executionReportDialog",
  () => ({
    ExecutionReportDialog: ({ open, onClose, onSuccess, onError }: any) =>
      open ? (
        <div>
          <p>ExecutionReportDialog</p>
          <button onClick={() => onSuccess("exec sucesso")}>
            exec success
          </button>
          <button onClick={() => onError("erro exec")}>exec error</button>
          <button onClick={onClose} data-testid="close-execution-report">
            close
          </button>
        </div>
      ) : null,
  }),
);

vi.mock("@/components/common/ErrorModal", () => ({
  default: ({ open, message, onClose }: any) =>
    open ? (
      <div>
        <p>ErrorModal: {message}</p>
        <button onClick={onClose}>close error</button>
      </div>
    ) : null,
}));

describe("ModalsManager", () => {
  const defaultProps = {
    idWork: 1,
    statusWork: 1,
    options: {
      restricao: [{ restricao: "DATA", tipo_restricao: "REPROVADO" }],
    },
    scheduleForm: {},
    isInsert: false,
    executionReportIsInsert: false,
    handleReject: vi.fn(),
    rejectedSchedule: [{ id: 1, reject: false }],
    onCloseDialog: vi.fn(),
    onConfirmDelete: vi.fn(),
    onConfirmExecutionDelete: vi.fn(),
    totalExec: 80,
    scheduleStatus: "PROGRAMADO",
  };

  const setup = () => {
    const ref = React.createRef<ModalsManagerRef>();
    render(<ModalsManager ref={ref} {...defaultProps} />);
    return ref;
  };

  it("deve abrir e fechar o modal de sucesso via ref", () => {
    const ref = setup();
    act(() => {
      ref.current?.showSuccess("mensagem sucesso");
    });
    expect(screen.getByText("Sucesso")).toBeInTheDocument();
    expect(screen.getByText("mensagem sucesso")).toBeInTheDocument();

    fireEvent.click(screen.getByText("close"));
    expect(screen.queryByText("mensagem sucesso")).not.toBeInTheDocument();
  });

  it("deve exibir e fechar modal de erro via ref", () => {
    const ref = setup();
    act(() => {
      ref.current?.showError("mensagem erro");
    });
    expect(screen.getByText("ErrorModal: mensagem erro")).toBeInTheDocument();

    fireEvent.click(screen.getByText("close error"));
    expect(
      screen.queryByText("ErrorModal: mensagem erro"),
    ).not.toBeInTheDocument();
  });

  it("deve abrir modal de programação (handleDialog) e executar onSuccess e onError", () => {
    const ref = setup();
    act(() => {
      ref.current?.handleDialog(true);
    });
    expect(screen.getByText("ScheduleFormDialog")).toBeInTheDocument();

    fireEvent.click(screen.getByText("success"));
    expect(screen.getByText("ok sucesso")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("close-schedule"));
    expect(defaultProps.onCloseDialog).toHaveBeenCalled();

    fireEvent.click(screen.getByText("error"));
    expect(screen.getByText("ErrorModal: erro schedule")).toBeInTheDocument();
  });

  it("deve abrir ExecutionReportDialog (handleExecutionDialog) e executar callbacks", () => {
    const ref = setup();
    act(() => {
      ref.current?.handleExecutionDialog(true);
    });
    expect(screen.getByText("ExecutionReportDialog")).toBeInTheDocument();

    fireEvent.click(screen.getByText("exec success"));
    expect(screen.getByText("exec sucesso")).toBeInTheDocument();

    fireEvent.click(screen.getByText("exec error"));
    expect(screen.getByText("ErrorModal: erro exec")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("close-execution-report"));
    expect(defaultProps.onCloseDialog).toHaveBeenCalled();
  });

  it("deve abrir e fechar FailureModalComponent", () => {
    const ref = setup();

    act(() => {
      ref.current?.handleRejectedModalOpen(true);
    });

    expect(screen.getByText("FailureModal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("close-failure"));
    expect(screen.queryByText("FailureModal")).not.toBeInTheDocument();
  });

  it("deve abrir e confirmar exclusão de programação", () => {
    const ref = setup();
    act(() => {
      ref.current?.openConfirmDeleteSchedule(10);
    });
    expect(screen.getByText("Exclusão de programação")).toBeInTheDocument();

    fireEvent.click(screen.getByText("confirm"));
    expect(defaultProps.onConfirmDelete).toHaveBeenCalledWith(10);
  });

  it("deve abrir e confirmar exclusão de relatório", () => {
    const ref = setup();
    act(() => {
      ref.current?.openConfirmDeleteExecution(20);
    });
    expect(screen.getByText("Exclusão de relatório")).toBeInTheDocument();

    fireEvent.click(screen.getByText("confirm"));
    expect(defaultProps.onConfirmExecutionDelete).toHaveBeenCalledWith(20);
  });

  it("deve fechar os modais de confirmação corretamente", () => {
    const ref = setup();
    act(() => {
      ref.current?.openConfirmDeleteSchedule(1);
    });
    fireEvent.click(screen.getByText("cancel"));
    expect(
      screen.queryByText("Exclusão de programação"),
    ).not.toBeInTheDocument();

    act(() => {
      ref.current?.openConfirmDeleteExecution(1);
    });
    fireEvent.click(screen.getByText("cancel"));
    expect(screen.queryByText("Exclusão de relatório")).not.toBeInTheDocument();
  });
});
