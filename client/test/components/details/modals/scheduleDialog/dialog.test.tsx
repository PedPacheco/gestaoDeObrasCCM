import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ScheduleFormDialog from "@/components/details/modals/scheduleDialog/dialog";
import * as UserContextModule from "@/contexts/userContext";
import { useScheduleSubmit } from "@/hooks/useScheduleSubmit";
import * as schemasModule from "@/validations/validationSchedules";
import { ExecutionReportData } from "@/components/details/modals/executionReportDialog/executionReportDialog";
import { mockFormData } from "../../../../mocks/mockFormData";

// ---------- Mocks ----------
vi.mock("@/hooks/useScheduleSubmit", () => ({
  useScheduleSubmit: vi.fn(() => ({
    handleSubmit: vi.fn(),
    isPending: false,
  })),
}));

vi.mock("@/components/details/accordionPanel", () => ({
  AccordionPanel: ({ id, title, children, expanded, onChange }: any) => (
    <div data-testid={`accordion-${id}`}>
      <button
        onClick={() => onChange(null, expanded !== id)}
        data-testid={`accordion-toggle-${id}`}
      >
        {title}
      </button>
      {expanded === id && <div>{children}</div>}
    </div>
  ),
}));

vi.mock("@/components/details/modals/scheduleDialog/basicInfoPanel", () => ({
  BasicInfoPanel: ({ disabledFields }: { disabledFields?: any }) => (
    <div data-testid="mock-basic-info-panel" data-disabled={disabledFields()}>
      BasicInfoPanel
    </div>
  ),
}));

vi.mock(
  "@/components/details/modals/scheduleDialog/serviceEquipmentPanel",
  () => ({
    ServiceEquipmentPanel: () => <div>ServiceEquipmentPanel</div>,
  })
);

vi.mock(
  "@/components/details/modals/scheduleDialog/additionalInfoPanel",
  () => ({
    AdditionalInfoPanel: () => <div>AdditionalInfoPanel</div>,
  })
);

vi.mock("@/components/details/modals/scheduleDialog/teamsPanel", () => ({
  TeamsPanel: () => <div>TeamsPanel</div>,
}));

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

// ---------- Base Props ----------
const baseProps = {
  open: true,
  onClose: vi.fn(),
  idWork: 1,
  isInsert: false,
  executionReportIsInsert: true,
  onError: vi.fn(),
  onSuccess: vi.fn(),
  onModalOpen: vi.fn(),
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

// ---------- Test Suite ----------
describe("ScheduleFormDialog", () => {
  it("renders dialog and main panels/buttons", () => {
    render(
      <ScheduleFormDialog
        {...baseProps}
        onExecutionDialogOpen={() => {}}
        options={{ tecnico: [], restricao: [] }}
        statusWork={0}
      />
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Informações Básicas")).toBeInTheDocument();
    expect(screen.getByText("Serviço e Equipamentos")).toBeInTheDocument();
    expect(screen.getByText("Equipes")).toBeInTheDocument();
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByText("Editar Programação")).toBeInTheDocument();
  });

  it("calls handleAccordionChange when accordion is toggled", () => {
    render(
      <ScheduleFormDialog
        {...baseProps}
        statusWork={0}
        onExecutionDialogOpen={() => {}}
        options={{ tecnico: [], restricao: [] }}
      />
    );
    const toggle = screen.getByTestId("accordion-toggle-panel1");
    fireEvent.click(toggle);
    expect(baseProps.scheduleForm.handleAccordionChange).toHaveBeenCalled();
  });

  it("deve abrir o Dialog de relatório de execução", async () => {
    const user = userEvent.setup();
    const onExecutionDialogOpenMock = vi.fn();
    render(
      <ScheduleFormDialog
        onExecutionDialogOpen={onExecutionDialogOpenMock}
        options={{ tecnico: [], restricao: [] }}
        {...baseProps}
        statusWork={35}
        scheduleForm={{ ...baseProps.scheduleForm }}
      />
    );
    const button = screen.getByRole("button", { name: /Salvar Programação/i });
    await user.click(button);
    expect(onExecutionDialogOpenMock).toHaveBeenCalled();
  });

  it("calls onClose when cancel clicked", async () => {
    const user = userEvent.setup();
    render(
      <ScheduleFormDialog
        statusWork={0}
        onExecutionDialogOpen={() => {}}
        options={{ tecnico: [], restricao: [] }}
        {...baseProps}
      />
    );
    const button = screen.getByRole("button", { name: /Cancelar/i });
    await user.click(button);
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it("calls handleSubmit when save clicked", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    vi.mocked(useScheduleSubmit).mockReturnValue({
      handleSubmit,
      isPending: false,
    });
    vi.spyOn(schemasModule, "schedulesSchema").mockReturnValue({
      safeParse: () => ({ success: true, data: null }),
    } as any);
    render(
      <ScheduleFormDialog
        statusWork={0}
        onExecutionDialogOpen={() => {}}
        options={{ tecnico: [], restricao: [] }}
        {...baseProps}
        scheduleForm={{
          ...baseProps.scheduleForm,
          formData: { ...baseProps.scheduleForm.formData, exec: "null" },
          initialExecValue: "null",
        }}
      />
    );
    const button = screen.getByRole("button", { name: /Salvar Programação/i });
    await user.click(button);
    expect(handleSubmit).toHaveBeenCalled();
  });

  it("renders 'Salvando...' when isPending is true", () => {
    vi.mocked(useScheduleSubmit).mockReturnValue({
      handleSubmit: vi.fn(),
      isPending: true,
    });
    render(
      <ScheduleFormDialog
        statusWork={0}
        onExecutionDialogOpen={() => {}}
        options={{ tecnico: [], restricao: [] }}
        {...baseProps}
      />
    );
    expect(
      screen.getByRole("button", { name: /Salvando.../i })
    ).toBeInTheDocument();
  });

  const partialUserMock = {
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
  };

  it.each([
    { isInsert: true, statusWork: 2 },
    { isInsert: true, statusWork: 3 },
    { isInsert: false, statusWork: 35 },
  ])(
    "disables fields when user has partial permission (isInsert=$isInsert, statusWork=$statusWork)",
    ({ isInsert, statusWork }) => {
      vi.spyOn(UserContextModule, "useUser").mockReturnValue(
        partialUserMock as any
      );

      render(
        <ScheduleFormDialog
          {...baseProps}
          isInsert={isInsert}
          statusWork={statusWork}
          onExecutionDialogOpen={() => {}}
          options={{ tecnico: [], restricao: [] }}
        />
      );

      const accordionToggle = screen.getByTestId("accordion-toggle-panel1");
      fireEvent.click(accordionToggle);

      expect(screen.getByTestId("mock-basic-info-panel")).toHaveAttribute(
        "data-disabled",
        "true"
      );
    }
  );

  it("shows and closes ErrorModal when validation fails", async () => {
    const user = userEvent.setup();

    const safeParseMock = vi.fn().mockReturnValue({
      success: false,
      error: {
        issues: [{ path: ["data_prog"], message: "Campo obrigatório" }],
      },
    });
    vi.spyOn(schemasModule, "schedulesSchema").mockReturnValue({
      safeParse: safeParseMock,
    } as any);

    const setFormErrorsMock = vi.fn();

    render(
      <ScheduleFormDialog
        {...baseProps}
        statusWork={0}
        onExecutionDialogOpen={() => {}}
        options={{ tecnico: [], restricao: [] }}
        scheduleForm={{
          ...baseProps.scheduleForm,
          setFormErrors: setFormErrorsMock,
        }}
      />
    );

    const button = screen.getByRole("button", { name: /Salvar Programação/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });

    const closeButton = screen.getByText("Close");
    await user.click(closeButton);
    expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
  });

  it("exibe ErrorModal quando a validação falha", async () => {
    const user = userEvent.setup();
    const safeParseMock = vi.fn().mockReturnValue({
      success: false,
      error: {
        issues: [{ path: ["data_prog"], message: "Campo obrigatório" }],
      },
    });
    vi.spyOn(schemasModule, "schedulesSchema").mockReturnValue({
      safeParse: safeParseMock,
    } as any);
    const setFormErrorsMock = vi.fn();
    render(
      <ScheduleFormDialog
        statusWork={0}
        onExecutionDialogOpen={() => {}}
        options={{ tecnico: [], restricao: [] }}
        {...baseProps}
        scheduleForm={{
          ...baseProps.scheduleForm,
          setFormErrors: setFormErrorsMock,
        }}
      />
    );
    const button = screen.getByRole("button", { name: /Salvar Programação/i });
    await user.click(button);
    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Erro ao salvar programação"
      );
    });
  });
});
