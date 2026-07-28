import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

<<<<<<< HEAD
// Mock actions
vi.mock("@/actions/services", () => ({
  storeScheduleDataAction: vi.fn(),
=======
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
    onCloseDialog: vi.fn(),
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
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a
}));

vi.mock("@/hooks/details/useScheduleForm", () => ({
  useScheduleForm: vi.fn(() => ({
    resetForm: mockResetForm,
    values: {},
    errors: {},
  })),
}));

<<<<<<< HEAD
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

vi.mock(
  "@/components/details/panelItems/RejectionsOfSchedulesPanelItem",
  () => ({
    default: ({ data, onEdit, onDelete }: any) => (
      <div data-testid="rejections-panel">
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
  }),
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

vi.mock("@/hooks/useScheduleHandlers", () => ({
=======
vi.mock("@/hooks/details/useScheduleHandlers", () => ({
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a
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

<<<<<<< HEAD
vi.mock("@/hooks/useFeedback", () => ({
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe("TabPanel Component", () => {
  const mockWorkData = {
    id: "1",
    id_status: "1",
    name: "Test Work",
    programacoes: [
      { id: 1, name: "Schedule 1", exec: "50" },
      { id: 2, name: "Schedule 2", exec: undefined },
    ],
  };
=======
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
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a

vi.mock("@/components/details/panelItems/workCostPanelItem", () => ({
  __esModule: true,
  default: ({ data }: any) => (
    <div data-testid="work-cost-panel" data-id={data?.id} />
  ),
}));

<<<<<<< HEAD
  const mockRejections = [
    {
      motivo: "",
      data_prog: "",
      hora_ini: "",
      hora_ter: "",
      prog: "",
      descricao: "",
      equip_desligado: "",
      equipe_linha_morta: "",
      equipe_linha_viva: "",
      equipe_regularizacao: "",
      tipo_servico: "",
      observacao_programacao: "",
    },
  ];

  const mockOptions = { option1: "value1" };

  const defaultProps = {
    workData: mockWorkData,
    executionReportData: mockExecutionReportData,
    options: mockOptions,
    feasibilityExists: [],
    rejectionsData: mockRejections,
    id: "1",
  };
=======
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
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a

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

<<<<<<< HEAD
      expect(screen.getByTestId("work-cost-panel")).toBeInTheDocument();
=======
      expect(screen.getByTestId("tab-actions")).toBeInTheDocument();
      expect(screen.getByTestId("modals-manager")).toBeInTheDocument();
    });
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a

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
      { id_area: 8, tipo_usuario: "INTERNO", expected: true },
      { id_area: 2, tipo_usuario: "INTERNO", expected: true },
      { id_area: 99, tipo_usuario: "PARCEIRA", expected: true },
      { id_area: 5, tipo_usuario: "INTERNO", expected: false },
      { id_area: null, tipo_usuario: "PARCEIRA", expected: true },
    ])(
      "canSeeTab=$expected quando id_area=$id_area e tipo=$tipo_usuario",
      ({ id_area, tipo_usuario, expected }) => {
        localStorageMock.getItem.mockReturnValue("0");
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
      localStorageMock.getItem.mockReturnValue("0");

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
      localStorageMock.getItem.mockReturnValue("0");
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

<<<<<<< HEAD
      fireEvent.click(screen.getByText("Reprovações"));
      expect(screen.getByTestId("rejections-panel")).toBeInTheDocument();
=======
    it("deve mostrar PublicationRestrictionsPanel na tab 4", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-4"));
      expect(screen.getByTestId("pub-restrictions-panel")).toBeInTheDocument();
    });

    it("deve mostrar 'Em breve' na tab 5", () => {
      renderComponent();
      fireEvent.click(screen.getByTestId("tab-5"));
      expect(screen.getByText("Em breve")).toBeInTheDocument();
>>>>>>> 7119125a38dbd02133b8e606db209840d184654a
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
    it("deve atualizar ModalsManager quando workData muda", async () => {
      mockPermissions.current = {
        id_area: 7,
        tipo_usuario: "ADMIN",
      } as any;

      localStorage.setItem("tab", "0");

      const { rerender } = renderComponent();

      await screen.findByTestId("work-cost-panel");

      const newWorkData = {
        ...defaultProps.workData,
        id: 777,
        executado: 0.5,
        id_status: 9,
      };

      rerender(<TabPanel {...defaultProps} workData={newWorkData} />);

      await waitFor(() => {
        const props = getModalsProps();

        expect(props.idWork).toBe(777);
        expect(props.totalExec).toBe(0.5);
        expect(props.statusWork).toBe(9);
      });
    });

    it("deve atualizar ModalsManager quando workData muda", () => {
      mockPermissions.current = {
        id_area: 7,
        tipo_usuario: "ADMIN",
      } as any;

      localStorage.setItem("tab", "0");

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
<<<<<<< HEAD
=======

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
>>>>>>> a7a509c77690b8fb62bbf36bcdf7efbe0dee13c3
});
