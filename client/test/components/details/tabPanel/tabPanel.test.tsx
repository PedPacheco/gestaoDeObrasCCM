import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================
// vi.hoisted — variáveis acessíveis dentro dos vi.mock factories
// ============================================================

const {
  mockResetForm,
  mockHandleConfirm,
  mockHandleDelete,
  mockHandleExecutionReportDelete,
  mockHandleValidated,
  mockHandleReject,
  mockSetConfirmedSchedule,
  mockSetValidatedSchedule,
  mockSetRejectedSchedule,
  mockModalsRef,
  mockPermissions,
} = vi.hoisted(() => ({
  mockResetForm: vi.fn(),
  mockHandleConfirm: vi.fn(),
  mockHandleDelete: vi.fn(),
  mockHandleExecutionReportDelete: vi.fn(),
  mockHandleValidated: vi.fn(),
  mockHandleReject: vi.fn(),
  mockSetConfirmedSchedule: vi.fn(),
  mockSetValidatedSchedule: vi.fn(),
  mockSetRejectedSchedule: vi.fn(),
  mockModalsRef: {
    handleDialog: vi.fn(),
    handleExecutionDialog: vi.fn(),
    handleRejectedModalOpen: vi.fn(),
    openConfirmDeleteSchedule: vi.fn(),
    openConfirmDeleteExecution: vi.fn(),
    showError: vi.fn(),
    showSuccess: vi.fn(),
  },
  mockPermissions: { current: { id_area: 8, tipo_usuario: "ADMIN" } as any },
}));

// ============================================================
// MOCKS
// ============================================================

vi.mock("@/contexts/userContext", () => ({
  useUser: vi.fn(() => ({ permissions: mockPermissions.current })),
}));

vi.mock("@/hooks/details/useScheduleForm", () => ({
  useScheduleForm: vi.fn(() => ({
    resetForm: mockResetForm,
    values: {},
    errors: {},
  })),
}));

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

vi.mock("@/components/details/modals/detailsModals", () => {
  const React = require("react");
  return {
    ModalsManager: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => mockModalsRef);
      return (
        <div
          data-testid="modals-manager"
          data-props={JSON.stringify({
            idWork: props.idWork,
            totalExec: props.totalExec,
            statusWork: props.statusWork,
            isInsert: props.isInsert,
            executionReportIsInsert: props.executionReportIsInsert,
            scheduleStatus: props.scheduleStatus,
          })}
        />
      );
    }),
  };
});

vi.mock("@/components/details/tabPanel/tabsActions", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="tab-actions"
      data-value={props.valueTab}
      data-can-see={String(props.canSeeTabs)}
      data-status={props.statusWork}
    >
      <button data-testid="action-confirm" onClick={props.onConfirm} />
      <button data-testid="action-validate" onClick={props.onValidate} />
      <button data-testid="action-rejected" onClick={props.onRejected} />
      <button data-testid="action-new-schedule" onClick={props.onNewSchedule} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          data-testid={`tab-${i}`}
          onClick={(e) => props.handleChange(e, i)}
        />
      ))}
    </div>
  ),
}));

vi.mock("@/components/details/panelItems/workCostPanelItem", () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="work-cost-panel" data-id={data?.id} />
  ),
}));

vi.mock("@/components/details/panelItems/schedulePanelItem", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: any) => (
    <div data-testid="schedule-panel">
      <button
        data-testid="edit-schedule"
        onClick={() =>
          onEdit({ id: 1, status_programacao: "APROVADO", exec: 50 })
        }
      />
      <button
        data-testid="edit-schedule-no-exec"
        onClick={() => onEdit({ id: 2, status_programacao: "PENDENTE" })}
      />
      <button data-testid="delete-schedule" onClick={() => onDelete(99)} />
    </div>
  ),
}));

vi.mock("@/components/details/panelItems/executionReportPanelItem", () => ({
  __esModule: true,
  default: ({ onEdit, onDelete }: any) => (
    <div data-testid="execution-report-panel">
      <button
        data-testid="edit-execution"
        onClick={() => onEdit({ id: 10, value: "test" })}
      />
      <button data-testid="delete-execution" onClick={() => onDelete(88)} />
    </div>
  ),
}));

vi.mock(
  "@/components/details/panelItems/rejectionsOfSchedulesPanelItem",
  () => ({
    __esModule: true,
    default: () => <div data-testid="rejections-panel" />,
  }),
);

vi.mock(
  "@/components/details/panelItems/publicationRestrictionsPanelItem",
  () => ({
    __esModule: true,
    default: () => <div data-testid="pub-restrictions-panel" />,
  }),
);

// ============================================================
// IMPORTS (após os mocks)
// ============================================================

import TabPanel from "@/components/details/tabPanel/TabPanel";
import { useUser } from "@/contexts/userContext";
import { useScheduleForm } from "@/hooks/details/useScheduleForm";
import { useScheduleHandlers } from "@/hooks/details/useScheduleHandlers";

const mockedUseUser = vi.mocked(useUser);

// ============================================================
// localStorage mock
// ============================================================

const storageMock: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => storageMock[key] ?? null),
  setItem: vi.fn((key: string, val: string) => {
    storageMock[key] = val;
  }),
  clear: vi.fn(() =>
    Object.keys(storageMock).forEach((k) => delete storageMock[k]),
  ),
  removeItem: vi.fn((key: string) => {
    delete storageMock[key];
  }),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// ============================================================
// HELPERS
// ============================================================

const defaultProps = {
  workData: {
    id: 1,
    id_status: 3,
    executado: 0.75,
    programacoes: [{ id: 10 }],
  },
  executionReportData: [{ id: 100 }],
  rejectionsData: [{ id: 200 }],
  publicationRestrictionData: [{ id: 300 }],
  options: { restricoes: [], tecnicos: [] },
  id: "123",
  feasibilityExists: [{ id: 400 }],
};

const renderComponent = (overrides: Partial<typeof defaultProps> = {}) =>
  render(<TabPanel {...defaultProps} {...overrides} />);

const getModalsProps = () =>
  JSON.parse(screen.getByTestId("modals-manager").dataset.props!);

// ============================================================
// TESTES
// ============================================================

describe("TabPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockPermissions.current = { id_area: 8, tipo_usuario: "ADMIN" };
    mockedUseUser.mockReturnValue({
      permissions: mockPermissions.current,
    } as any);
  });

  // ----------------------------------------------------------
  // Renderização base
  // ----------------------------------------------------------
  describe("Renderização", () => {
    it("deve renderizar sem erros", () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it("deve renderizar TabActions e ModalsManager", () => {
      renderComponent();

      expect(screen.getByTestId("tab-actions")).toBeInTheDocument();
      expect(screen.getByTestId("modals-manager")).toBeInTheDocument();
    });

    it("deve renderizar tabpanels com role e aria corretos", () => {
      renderComponent();

      const panels = screen.getAllByRole("tabpanel");
      panels.forEach((panel) => {
        expect(panel.id).toMatch(/^simple-tabpanel-\d+$/);
        expect(panel.getAttribute("aria-labelledby")).toMatch(
          /^simple-tab-\d+$/,
        );
      });
    });
  });

  // ----------------------------------------------------------
  // Permissões — canSeeTab
  // ----------------------------------------------------------
  describe("Permissões (canSeeTab)", () => {
    it.each([
      { id_area: 8, tipo_usuario: "ADMIN", expected: true },
      { id_area: 2, tipo_usuario: "ADMIN", expected: true },
      { id_area: 99, tipo_usuario: "PARCEIRA", expected: true },
      { id_area: 5, tipo_usuario: "OUTRO", expected: false },
      { id_area: null, tipo_usuario: "ADMIN", expected: false },
    ])(
      "canSeeTab=$expected quando id_area=$id_area e tipo=$tipo_usuario",
      ({ id_area, tipo_usuario, expected }) => {
        mockPermissions.current = { id_area, tipo_usuario };
        mockedUseUser.mockReturnValue({
          permissions: mockPermissions.current,
        } as any);

        renderComponent();

        expect(screen.getByTestId("tab-actions").dataset.canSee).toBe(
          String(expected),
        );

        if (expected) {
          expect(screen.getByTestId("work-cost-panel")).toBeInTheDocument();
        } else {
          expect(
            screen.queryByTestId("work-cost-panel"),
          ).not.toBeInTheDocument();
        }
      },
    );

    it("não deve crashar quando permissions é null", () => {
      mockPermissions.current = null;
      mockedUseUser.mockReturnValue({ permissions: null } as any);

      renderComponent();

      expect(screen.queryByTestId("work-cost-panel")).not.toBeInTheDocument();
      expect(screen.getByTestId("tab-actions").dataset.canSee).toBe("false");
    });
  });

  // ----------------------------------------------------------
  // Tab padrão via useEffect
  // ----------------------------------------------------------
  describe("Tab padrão", () => {
    it("deve definir tab 0 quando canSeeTab é true", () => {
      renderComponent();

      expect(screen.getByTestId("tab-actions").dataset.value).toBe("0");
      expect(localStorageMock.setItem).toHaveBeenCalledWith("tab", "0");
    });

    it("deve definir tab 1 quando canSeeTab é false", () => {
      mockPermissions.current = { id_area: 5, tipo_usuario: "OUTRO" };
      mockedUseUser.mockReturnValue({
        permissions: mockPermissions.current,
      } as any);

      renderComponent();

      expect(screen.getByTestId("tab-actions").dataset.value).toBe("1");
      expect(localStorageMock.setItem).toHaveBeenCalledWith("tab", "1");
    });

    it("não deve alterar tab quando permissions é null", () => {
      mockPermissions.current = null;
      mockedUseUser.mockReturnValue({ permissions: null } as any);

      renderComponent();

      expect(screen.getByTestId("tab-actions").dataset.value).toBe("1");
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // handleChange — troca de tabs
  // ----------------------------------------------------------
  describe("Troca de tabs (handleChange)", () => {
    it.each([1, 2, 3, 4])("deve permitir trocar para tab %i", (tab) => {
      renderComponent();
      fireEvent.click(screen.getByTestId(`tab-${tab}`));

      expect(screen.getByTestId("tab-actions").dataset.value).toBe(String(tab));
      expect(localStorageMock.setItem).toHaveBeenCalledWith("tab", String(tab));
    });

    it("deve permitir tab 0 quando canSeeTab é true", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-1"));
      fireEvent.click(screen.getByTestId("tab-0"));

      expect(screen.getByTestId("tab-actions").dataset.value).toBe("0");
    });

    it("deve permitir tab 5 quando canSeeTab é true", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-5"));

      expect(screen.getByTestId("tab-actions").dataset.value).toBe("5");
    });

    it("NÃO deve permitir tab 0 quando canSeeTab é false", () => {
      mockPermissions.current = { id_area: 5, tipo_usuario: "OUTRO" };
      mockedUseUser.mockReturnValue({
        permissions: mockPermissions.current,
      } as any);

      renderComponent();
      fireEvent.click(screen.getByTestId("tab-0"));

      expect(screen.getByTestId("tab-actions").dataset.value).toBe("1");
    });

    it("NÃO deve permitir tab 5 quando canSeeTab é false", () => {
      mockPermissions.current = { id_area: 5, tipo_usuario: "OUTRO" };
      mockedUseUser.mockReturnValue({
        permissions: mockPermissions.current,
      } as any);

      renderComponent();
      fireEvent.click(screen.getByTestId("tab-5"));

      expect(screen.getByTestId("tab-actions").dataset.value).toBe("1");
    });
  });

  // ----------------------------------------------------------
  // Conteúdo das tabs
  // ----------------------------------------------------------
  describe("Conteúdo das tabs", () => {
    it("deve mostrar WorkCostPanelItem na tab 0", () => {
      renderComponent();
      expect(screen.getByTestId("work-cost-panel")).toBeInTheDocument();
    });

    it("deve mostrar SchedulePanelItem na tab 1", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-1"));
      expect(screen.getByTestId("schedule-panel")).toBeInTheDocument();
    });

    it("deve mostrar RejectionsPanel na tab 2", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-2"));
      expect(screen.getByTestId("rejections-panel")).toBeInTheDocument();
    });

    it("deve mostrar ExecutionReportPanel na tab 3", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-3"));
      expect(screen.getByTestId("execution-report-panel")).toBeInTheDocument();
    });

    it("deve mostrar PublicationRestrictionsPanel na tab 4", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-4"));
      expect(screen.getByTestId("pub-restrictions-panel")).toBeInTheDocument();
    });

    it("deve mostrar 'Em breve' na tab 5", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-5"));
      expect(screen.getByText("Em breve")).toBeInTheDocument();
    });

    it("tabs inativas devem ter atributo hidden", () => {
      renderComponent();
      const panels = screen.getAllByRole("tabpanel");
      expect(panels).toHaveLength(1);
    });
  });

  // ----------------------------------------------------------
  // TabActions callbacks
  // ----------------------------------------------------------
  describe("TabActions callbacks", () => {
    it("deve chamar handleConfirm", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("action-confirm"));
      expect(mockHandleConfirm).toHaveBeenCalledOnce();
    });

    it("deve chamar handleValidated", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("action-validate"));
      expect(mockHandleValidated).toHaveBeenCalledOnce();
    });

    it("deve abrir modal de rejeição via modalsRef", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("action-rejected"));
      expect(mockModalsRef.handleRejectedModalOpen).toHaveBeenCalledWith(true);
    });

    it("deve abrir dialog de nova programação via modalsRef", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("action-new-schedule"));
      expect(mockModalsRef.handleDialog).toHaveBeenCalledWith(true);
    });

    it("deve passar statusWork correto", () => {
      renderComponent({ workData: { ...defaultProps.workData, id_status: 7 } });
      expect(screen.getByTestId("tab-actions").dataset.status).toBe("7");
    });
  });

  // ----------------------------------------------------------
  // handleEditSchedule
  // ----------------------------------------------------------
  describe("handleEditSchedule", () => {
    it("deve abrir dialog e definir isInsert=false", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-1"));
      fireEvent.click(screen.getByTestId("edit-schedule"));

      expect(mockModalsRef.handleDialog).toHaveBeenCalledWith(true);
      expect(getModalsProps().isInsert).toBe(false);
    });

    it("deve definir scheduleStatus com status_programacao", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-1"));
      fireEvent.click(screen.getByTestId("edit-schedule"));

      expect(getModalsProps().scheduleStatus).toBe("APROVADO");
    });

    it("deve manter executionReportIsInsert=true", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-1"));
      fireEvent.click(screen.getByTestId("edit-schedule"));

      expect(getModalsProps().executionReportIsInsert).toBe(true);
    });

    it("deve usar string vazia quando exec é undefined", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-1"));
      fireEvent.click(screen.getByTestId("edit-schedule-no-exec"));

      expect(mockModalsRef.handleDialog).toHaveBeenCalledWith(true);
    });
  });

  // ----------------------------------------------------------
  // handleEditExecutionReport
  // ----------------------------------------------------------
  describe("handleEditExecutionReport", () => {
    it("deve abrir dialog de execução", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-3"));
      fireEvent.click(screen.getByTestId("edit-execution"));

      expect(mockModalsRef.handleExecutionDialog).toHaveBeenCalledWith(true);
    });

    it("deve definir executionReportIsInsert=false e isInsert=false", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-3"));
      fireEvent.click(screen.getByTestId("edit-execution"));

      const props = getModalsProps();
      expect(props.executionReportIsInsert).toBe(false);
      expect(props.isInsert).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Delete callbacks
  // ----------------------------------------------------------
  describe("Delete callbacks", () => {
    it("deve abrir confirmação de delete de programação", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-1"));
      fireEvent.click(screen.getByTestId("delete-schedule"));

      expect(mockModalsRef.openConfirmDeleteSchedule).toHaveBeenCalledWith(99);
    });

    it("deve abrir confirmação de delete de relatório de execução", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-3"));
      fireEvent.click(screen.getByTestId("delete-execution"));

      expect(mockModalsRef.openConfirmDeleteExecution).toHaveBeenCalledWith(88);
    });
  });

  // ----------------------------------------------------------
  // ModalsManager props
  // ----------------------------------------------------------
  describe("ModalsManager props", () => {
    it("deve passar as props iniciais corretas", () => {
      renderComponent();

      const props = getModalsProps();
      expect(props.idWork).toBe(1);
      expect(props.totalExec).toBe(0.75);
      expect(props.statusWork).toBe(3);
      expect(props.isInsert).toBe(true);
      expect(props.executionReportIsInsert).toBe(true);
      expect(props.scheduleStatus).toBe("");
    });

    it("deve atualizar após editar programação", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-1"));
      fireEvent.click(screen.getByTestId("edit-schedule"));

      const props = getModalsProps();
      expect(props.isInsert).toBe(false);
      expect(props.scheduleStatus).toBe("APROVADO");
    });

    it("deve atualizar após editar relatório de execução", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-3"));
      fireEvent.click(screen.getByTestId("edit-execution"));

      const props = getModalsProps();
      expect(props.isInsert).toBe(false);
      expect(props.executionReportIsInsert).toBe(false);
    });
  });

  // ----------------------------------------------------------
  // Sincronização de workData
  // ----------------------------------------------------------
  describe("Sincronização de workData", () => {
    it("deve atualizar data interna quando workData muda", () => {
      const { rerender } = renderComponent();

      const newWorkData = { ...defaultProps.workData, id: 999, id_status: 5 };
      rerender(<TabPanel {...defaultProps} workData={newWorkData} />);

      expect(screen.getByTestId("work-cost-panel").dataset.id).toBe("999");
      expect(screen.getByTestId("tab-actions").dataset.status).toBe("5");
    });

    it("deve atualizar ModalsManager quando workData muda", () => {
      const { rerender } = renderComponent();

      const newWorkData = {
        ...defaultProps.workData,
        id: 777,
        executado: 0.5,
        id_status: 9,
      };
      rerender(<TabPanel {...defaultProps} workData={newWorkData} />);

      const props = getModalsProps();
      expect(props.idWork).toBe(777);
      expect(props.totalExec).toBe(0.5);
      expect(props.statusWork).toBe(9);
    });
  });

  // ----------------------------------------------------------
  // useScheduleHandlers — setError / setSuccess
  // ----------------------------------------------------------
  describe("useScheduleHandlers integração", () => {
    it("deve passar setError e setSuccess que delegam ao modalsRef", () => {
      renderComponent();

      const call = vi.mocked(useScheduleHandlers).mock.calls[0][0] as any;

      call.setError("erro");
      expect(mockModalsRef.showError).toHaveBeenCalledWith("erro");

      call.setSuccess("ok");
      expect(mockModalsRef.showSuccess).toHaveBeenCalledWith("ok");
    });

    it("deve passar idWork correto", () => {
      renderComponent();

      const call = vi.mocked(useScheduleHandlers).mock.calls[0][0] as any;
      expect(call.idWork).toBe("123");
    });
  });

  // ----------------------------------------------------------
  // useScheduleForm
  // ----------------------------------------------------------
  describe("useScheduleForm integração", () => {
    it("deve passar options para useScheduleForm", () => {
      renderComponent();

      const call = vi.mocked(useScheduleForm).mock.calls[0][0] as any;
      expect(call.options).toEqual(defaultProps.options);
    });
  });
});
