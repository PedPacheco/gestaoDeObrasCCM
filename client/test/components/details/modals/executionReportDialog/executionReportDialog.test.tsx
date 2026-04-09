import { describe, expect, it, vi } from "vitest";

import {
  ExecutionReportData,
  ExecutionReportDialog,
} from "@/components/details/modals/executionReportDialog/executionReportDialog";
import { useScheduleSubmit } from "@/hooks/useScheduleSubmit";
import * as schemasModule from "@/validations/validationSchedules";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { mockFormData } from "../../../../mocks/mockFormData";

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

vi.mock("@/hooks/useScheduleSubmit", () => ({
  useScheduleSubmit: vi.fn(() => ({
    handleSubmit: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("@/components/details/accordionPanel", () => ({
  AccordionPanel: ({ children }: any) => <div>{children}</div>,
}));

vi.mock(
  "@/components/details/modals/executionReportDialog/executionBasicPanel",
  () => ({
    ExecutionBasicPanel: () => <div>ExecutionBasicPanel</div>,
  }),
);

vi.mock(
  "@/components/details/modals/executionReportDialog/EquipmentPanel",
  () => ({
    ExecutionEquipmentPanel: () => <div>ExecutionEquipmentPanel</div>,
  }),
);

vi.mock(
  "@/components/details/modals/executionReportDialog/additionalExecutionInfoPanel",
  () => ({
    AdditionalExecutionInfoPanel: () => <div>AdditionalExecutionInfoPanel</div>,
  }),
);

vi.mock("@/components/common/ErrorModal", () => ({
  __esModule: true,
  default: ({ open, message, onClose }: any) =>
    open ? (
      <div data-testid="error-modal">
        <span data-testid="error-message">{message}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ text, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  ),
}));

const baseProps = {
  open: true,
  onClose: vi.fn(),
  idWork: 1,
  isInsert: false,
  executionReportIsInsert: true,
  onError: vi.fn(),
  onSuccess: vi.fn(),
  onModalOpen: vi.fn(),
  totalExec: 80,
  scheduleForm: {
    formData: mockFormData,
    setFormData: vi.fn(),
    executionReportData: mockFormData.executionReport as ExecutionReportData,
    formErrors: {},
    expanded: "panel1",
    setFormErrors: vi.fn(),
    handleInputChange: vi.fn(),
    handleAccordionChange: vi.fn(),
    openExecChangeDialog: false,
    resetForm: vi.fn(),
    setOpenExecChangeDialog: vi.fn(),
    onAddEquipment: vi.fn(),
    onRemoveEquipment: vi.fn(),
    onEquipmentChange: vi.fn(),
    initialExecValue: "null",
  },
};

describe("ExecutionReportDialog", () => {
  it("renderiza todos os painéis e botões", () => {
    render(<ExecutionReportDialog {...baseProps} />);

    expect(
      screen.getByText("Confirmar Alteração da Execução"),
    ).toBeInTheDocument();
    expect(screen.getByText("ExecutionBasicPanel")).toBeInTheDocument();
    expect(screen.getByText("ExecutionEquipmentPanel")).toBeInTheDocument();
    expect(
      screen.getByText("AdditionalExecutionInfoPanel"),
    ).toBeInTheDocument();

    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByText("Salvar Execução")).toBeInTheDocument();
  });

  it("usa executionReportData quando executionReportIsInsert = false", () => {
    render(
      <ExecutionReportDialog {...baseProps} executionReportIsInsert={false} />,
    );

    expect(screen.getByText("ExecutionBasicPanel")).toBeInTheDocument();
  });

  it("desabilita o botão quando isPending = true", () => {
    vi.mocked(useScheduleSubmit).mockReturnValueOnce({
      handleSubmit: vi.fn(),
      isPending: true,
    });

    render(<ExecutionReportDialog {...baseProps} />);
    const button = screen.getByText("Salvando...");
    expect(button).toBeDisabled();
  });

  it("Deve chamar handleSubmit('schedule') quando validationSchedulesSchema.success = true", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    vi.mocked(useScheduleSubmit).mockReturnValueOnce({
      handleSubmit,
      isPending: false,
    });

    vi.spyOn(schemasModule, "validationSchedulesSchema").mockReturnValue({
      safeParse: () => ({ success: true, data: { ok: true } }),
    } as any);

    render(<ExecutionReportDialog {...baseProps} />);

    const btn = screen.getByText("Salvar Execução");
    await user.click(btn);

    expect(handleSubmit).toHaveBeenCalledWith({ ok: true }, "schedule", []);
  });

  it("Deve chamar handleSubmit('executionReport') quando executionReportIsInsert = false e validação tiver sucesso", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    vi.mocked(useScheduleSubmit).mockReturnValueOnce({
      handleSubmit,
      isPending: false,
    });

    vi.spyOn(schemasModule, "executionReportSchema", "get").mockReturnValue({
      safeParse: () => ({ success: true, data: { done: true } }),
    } as any);

    render(
      <ExecutionReportDialog {...baseProps} executionReportIsInsert={false} />,
    );
    await user.click(screen.getByText("Salvar Execução"));

    expect(handleSubmit).toHaveBeenCalledWith(
      { done: true },
      "executionReport",
      [],
    );
  });

  it("Deve exibir o ErrorModal e setar formErrors quando validationSchedulesSchema falhar", async () => {
    const user = userEvent.setup();
    const setFormErrors = vi.fn();

    const safeParseMock = vi.fn().mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            errors: [
              [
                {
                  code: "custom",
                  path: ["field"],
                  message: "Campo obrigatório",
                },
                {
                  code: "invalid_type",
                  path: ["field"],
                  message: "Campo obrigatório",
                },
              ],
            ],
          },
        ],
      },
    });

    vi.spyOn(schemasModule, "validationSchedulesSchema").mockReturnValue({
      safeParse: safeParseMock,
    } as any);

    render(
      <ExecutionReportDialog
        {...baseProps}
        scheduleForm={{ ...baseProps.scheduleForm, setFormErrors }}
      />,
    );

    await user.click(screen.getByText("Salvar Execução"));

    await waitFor(() => {
      expect(setFormErrors).toHaveBeenCalledWith({
        field: "Campo obrigatório",
      });
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Erro ao salvar relatório de execução",
      );
    });
  });

  it("Deve exibir o ErrorModal e setar formErrors quando executionReportSchema falhar", async () => {
    const user = userEvent.setup();
    const setFormErrors = vi.fn();

    vi.spyOn(
      schemasModule.executionReportSchema,
      "safeParse",
    ).mockImplementation(
      () =>
        ({
          success: false,
          error: {
            issues: [
              {
                code: "custom",
                path: ["field"],
                message: "Campo obrigatório",
              },
            ],
          },
        }) as any,
    );

    render(
      <ExecutionReportDialog
        {...baseProps}
        executionReportIsInsert={false}
        scheduleForm={{ ...baseProps.scheduleForm, setFormErrors }}
      />,
    );

    await user.click(screen.getByText("Salvar Execução"));

    await waitFor(() => {
      expect(setFormErrors).toHaveBeenCalledWith({
        field: "Campo obrigatório",
      });
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });
  });

  it("Deve setar o erro usando err.path[0] quando o código não for 'custom'", async () => {
    const user = userEvent.setup();
    const setFormErrors = vi.fn();

    const safeParseMock = vi.fn().mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            errors: [
              [
                {
                  code: "invalid_string", // diferente de 'custom'
                  path: ["supervisor"],
                  message: "Supervisor obrigatório",
                },
              ],
            ],
          },
        ],
      },
    });

    vi.spyOn(schemasModule, "validationSchedulesSchema").mockReturnValue({
      safeParse: safeParseMock,
    } as any);

    render(
      <ExecutionReportDialog
        {...baseProps}
        scheduleForm={{ ...baseProps.scheduleForm, setFormErrors }}
      />,
    );

    await user.click(screen.getByText("Salvar Execução"));

    await waitFor(() => {
      expect(setFormErrors).toHaveBeenCalledWith({
        supervisor: "Supervisor obrigatório",
      });
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });
  });

  it("Deve setar o erro usando item.path[1] quando não houver item.errors", async () => {
    const user = userEvent.setup();
    const setFormErrors = vi.fn();

    const safeParseMock = vi.fn().mockReturnValue({
      success: false,
      error: {
        issues: [
          {
            path: ["executionReport", "provisionalKeyWithdrawn"],
            message: "A condição da chave provisória deve ser informada",
          },
        ],
      },
    });

    vi.spyOn(schemasModule, "validationSchedulesSchema").mockReturnValue({
      safeParse: safeParseMock,
    } as any);

    render(
      <ExecutionReportDialog
        {...baseProps}
        scheduleForm={{ ...baseProps.scheduleForm, setFormErrors }}
      />,
    );

    await user.click(screen.getByText("Salvar Execução"));

    await waitFor(() => {
      expect(setFormErrors).toHaveBeenCalledWith({
        provisionalKeyWithdrawn:
          "A condição da chave provisória deve ser informada",
      });
    });
  });

  it("Não deve chamar handleSubmit se safeParse falhar", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    vi.mocked(useScheduleSubmit).mockReturnValue({
      handleSubmit,
      isPending: false,
    });

    vi.spyOn(schemasModule, "validationSchedulesSchema").mockReturnValue({
      safeParse: () => ({
        success: false,
        error: { issues: [] },
      }),
    } as any);

    render(<ExecutionReportDialog {...baseProps} />);
    await user.click(screen.getByText("Salvar Execução"));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId("error-modal")).toBeInTheDocument();
  });

  it("Deve chamar onClose ao clicar no botão de fechar ErrorModal", async () => {
    const user = userEvent.setup();

    render(
      <ExecutionReportDialog
        {...baseProps}
        scheduleForm={{ ...baseProps.scheduleForm }}
      />,
    );

    const safeParseMock = vi.fn().mockReturnValue({
      success: false,
      error: { issues: [] },
    });

    vi.spyOn(schemasModule, "validationSchedulesSchema").mockReturnValue({
      safeParse: safeParseMock,
    } as any);

    await user.click(screen.getByText("Salvar Execução"));

    const closeButton = screen.getByRole("button", { name: /close/i });
    expect(closeButton).toBeInTheDocument();

    render(
      <ExecutionReportDialog
        {...baseProps}
        scheduleForm={{ ...baseProps.scheduleForm }}
      />,
    );

    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
    });
  });
});
