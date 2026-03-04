// ExecutionReportDialog.test.tsx
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  executionReportSchema,
  validationExecutionService,
} from "@/validations/validationExecutionServices";
import { ExecutionReportDialog } from "@/components/executionReport/executionReportDialog";
import { INITIAL_EXECUTION_REPORT } from "@/hooks/useExecutionServicesForm";

// ─── Module Mocks ─────────────────────────────────────────────────────────────

const mockShowError = vi.fn();

vi.mock("@/hooks/useFeedback", () => ({
  useFeedback: () => ({ showError: mockShowError }),
}));

vi.mock("@/contexts/userContext", () => ({
  useUser: () => ({ user: { id: "user-123" } }),
}));

const mockHandleSubmit = vi.fn();
let mockIsPending = false;

vi.mock("@/hooks/useExecutionServicesSubmit", () => ({
  useExecutionServicesSubmit: vi.fn(() => ({
    handleSubmit: mockHandleSubmit,
    isPending: mockIsPending,
  })),
}));

vi.mock("@/validations/validationExecutionServices", () => ({
  executionReportSchema: { safeParse: vi.fn() },
  validationExecutionService: vi.fn(),
}));

// Stub child components — keeps tests focused on dialog logic only
vi.mock("@/components/executionReport/additionalExecutionInfoPanel", () => ({
  AdditionalExecutionInfoPanel: () => (
    <div data-testid="additional-info-panel" />
  ),
}));

vi.mock("@/components/executionReport/asBuiltImport", () => ({
  AsBuiltImport: () => <div data-testid="as-built-import" />,
}));

vi.mock("@/components/executionReport/EquipmentPanel", () => ({
  ExecutionEquipmentPanel: () => <div data-testid="equipment-panel" />,
}));

vi.mock("@/components/executionReport/executionBasicPanel", () => ({
  ExecutionBasicPanel: () => <div data-testid="basic-panel" />,
}));

vi.mock("@/components/executionReport/accordionPanel", () => ({
  AccordionPanel: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => <div data-testid={`accordion-${title}`}>{children}</div>,
}));

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({
    text,
    onClick,
    disabled,
  }: {
    text: string;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  ),
}));

// ─── Factories ───────────────────────────────────────────────────────────────

function buildForm(overrides = {}) {
  return {
    editableData: {
      idExecutionRestriction: 1,
      responsibility: "Teste",
      executionObservation: "Observação teste",
    },
    executionReportData: {
      id: 1,
      idUser: 1,
      supervisor: "Supervisor Teste",
      partialConnectionReleased: false,
      startTime: "08:00",
      finishTime: "17:00",
      startContact: "",
      endContact: "",
      delayJustification: "",
      hasEquipmentInstalled: false,
      appliedEquipment: [],
      hasEquipmentRemoved: false,
      equipmentRemoved: [],
      changesExecution: false,
      generalObservation: "",
      reason: "",
      provisionalKeyInstalled: false,
      provisionalKeyReference: "",
      provisionalKeyWithdrawn: null,
      provisionalKeyReferenceWithdrawn: "",
    },
    formErrors: {},
    expanded: "panel1",
    setFormErrors: vi.fn(),
    handleEditableChange: vi.fn(() => vi.fn()),
    handleExecutionReportChange: vi.fn(() => vi.fn()),
    handleAccordionChange: vi.fn(() => vi.fn()),
    onEquipmentChange: vi.fn(),
    onAddEquipment: vi.fn(),
    onRemoveEquipment: vi.fn(),
    buildPayload: vi.fn(() => ({
      idWork: 1,
      idSchedule: 1,
      idExecutionRestriction: 1,
      finishTime: "17:00",
      responsibility: "Responsável Teste",
      executionObservation: "Observação teste",
      serviceType: "INSTALACAO",
      executionReport: INITIAL_EXECUTION_REPORT,
    })),
    resetForm: vi.fn(),
  };
}

function buildProps(overrides = {}) {
  return {
    open: true,
    onClose: vi.fn(),
    executionReportIsInsert: true,
    onSuccess: vi.fn(),
    onModalOpen: vi.fn(),
    executionForm: buildForm(),
    executionIsPartial: false,
    ...overrides,
  };
}

function setup(overrides = {}) {
  const props = buildProps(overrides);
  const utils = render(<ExecutionReportDialog {...props} />);
  return { ...utils, props };
}

describe("ExecutionReportDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  describe("Renderização", () => {
    it("renderiza o título do diálogo quando open=true", () => {
      setup();
      expect(
        screen.getByText("Confirmar Alteração da Execução"),
      ).toBeInTheDocument();
    });

    it("não renderiza o diálogo quando open=false", () => {
      setup({ open: false });
      expect(
        screen.queryByText("Confirmar Alteração da Execução"),
      ).not.toBeInTheDocument();
    });

    it("renderiza as quatro seções do accordion", () => {
      setup();
      expect(
        screen.getByTestId("accordion-Informações Básicas"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("accordion-Equipamentos")).toBeInTheDocument();
      expect(
        screen.getByTestId("accordion-Informações Adicionais"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("accordion-Arquivos As Build"),
      ).toBeInTheDocument();
    });

    it("renderiza todos os componentes filhos", () => {
      setup();
      expect(screen.getByTestId("basic-panel")).toBeInTheDocument();
      expect(screen.getByTestId("equipment-panel")).toBeInTheDocument();
      expect(screen.getByTestId("additional-info-panel")).toBeInTheDocument();
      expect(screen.getByTestId("as-built-import")).toBeInTheDocument();
    });

    it("renderiza os botões de ação", () => {
      setup();
      expect(screen.getByText("Cancelar")).toBeInTheDocument();
      expect(screen.getByText("Salvar Execução")).toBeInTheDocument();
    });

    it("exibe 'Salvando...' e desabilita o botão quando isPending=true", () => {
      mockIsPending = true;
      setup();
      const btn = screen.getByText("Salvando...");
      expect(btn).toBeInTheDocument();
      expect(btn).toBeDisabled();
    });
  });

  describe("Fechamento do diálogo", () => {
    it("chama onClose ao clicar no botão Cancelar", async () => {
      const { props } = setup();
      await userEvent.click(screen.getByText("Cancelar"));
      expect(props.onClose).toHaveBeenCalledOnce();
    });
  });

  describe("Integração com useExecutionServicesSubmit", () => {
    it("passa as opções corretas para o hook", async () => {
      const form = buildForm();

      const { useExecutionServicesSubmit } =
        await import("@/hooks/useExecutionServicesSubmit");

      const onClose = vi.fn();
      const onSuccess = vi.fn();
      const onModalOpen = vi.fn();

      setup({
        executionReportIsInsert: true,
        onClose,
        onSuccess,
        onModalOpen,
        executionForm: form,
      });

      expect(useExecutionServicesSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          isInsert: true,
          onClose,
          onSuccess,
          onModalOpen,
        }),
      );
    });
  });

  describe("Fluxo de atualização (executionReportIsInsert=false)", () => {
    it("chama handleSubmit com os dados validados quando o formulário é válido", async () => {
      vi.mocked(executionReportSchema.safeParse).mockReturnValue({
        success: true,
        data: buildForm().buildPayload(),
      } as any);

      setup({ executionReportIsInsert: false });
      await userEvent.click(screen.getByText("Salvar Execução"));

      expect(mockHandleSubmit).toHaveBeenCalledWith(
        buildForm().buildPayload(),
        [],
      );
    });

    it("define erros de campo e exibe mensagem de erro quando o formulário é inválido", async () => {
      const form = buildForm();

      vi.mocked(executionReportSchema.safeParse).mockReturnValue({
        success: false,
        error: {
          issues: [
            { code: "custom", path: ["description"], message: "Required" },
          ],
        },
      } as any);

      setup({
        executionReportIsInsert: false,
        executionForm: form,
      });

      await userEvent.click(screen.getByText("Salvar Execução"));

      expect(form.setFormErrors).toHaveBeenCalledWith({
        description: "Required",
      });
      expect(mockShowError).toHaveBeenCalledWith(
        "Erro ao salvar relatório de execução",
      );
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });
  });

  describe("Fluxo de inserção (executionReportIsInsert=true)", () => {
    it("não executa ação quando executionIsPartial=false", async () => {
      setup({ executionReportIsInsert: true, executionIsPartial: false });
      await userEvent.click(screen.getByText("Salvar Execução"));
      expect(mockHandleSubmit).not.toHaveBeenCalled();
    });

    it("chama handleSubmit quando o formulário parcial é válido", async () => {
      const form = buildForm();

      const parsedData = { ...form.buildPayload(), idUser: "user-123" };

      const mockSchema = {
        safeParse: vi.fn(() => ({ success: true, data: parsedData })),
      };

      vi.mocked(validationExecutionService).mockReturnValue(mockSchema as any);

      setup({
        executionReportIsInsert: true,
        executionIsPartial: true,
        executionForm: form,
      });

      await userEvent.click(screen.getByText("Salvar Execução"));

      expect(form.buildPayload).toHaveBeenCalled();
      expect(validationExecutionService).toHaveBeenCalledWith(true);
      expect(mockHandleSubmit).toHaveBeenCalledWith(parsedData, []);
    });

    it("mescla o id do usuário ao payload antes da validação", async () => {
      const mockSchema = {
        safeParse: vi.fn(() => ({ success: true, data: {} })),
      };

      vi.mocked(validationExecutionService).mockReturnValue(mockSchema as any);

      setup({ executionReportIsInsert: true, executionIsPartial: true });

      await userEvent.click(screen.getByText("Salvar Execução"));

      expect(mockSchema.safeParse).toHaveBeenCalledWith(
        expect.objectContaining({ idUser: "user-123" }),
      );
    });

    it("mapeia erros customizados para os campos e ignora invalid_type", async () => {
      const form = buildForm();

      const mockSchema = {
        safeParse: vi.fn(() => ({
          success: false,
          error: {
            issues: [
              {
                errors: [
                  [
                    {
                      code: "custom",
                      path: ["startDate"],
                      message: "Invalid date",
                    },
                    {
                      code: "invalid_type",
                      path: ["endDate"],
                      message: "Wrong type",
                    },
                  ],
                ],
              },
            ],
          },
        })),
      };

      vi.mocked(validationExecutionService).mockReturnValue(mockSchema as any);

      setup({
        executionReportIsInsert: true,
        executionIsPartial: true,
        executionForm: form,
      });

      await userEvent.click(screen.getByText("Salvar Execução"));

      expect(form.setFormErrors).toHaveBeenCalledWith({
        startDate: "Invalid date",
      });
      expect(mockShowError).toHaveBeenCalledWith(
        "Erro ao salvar relatório de execução",
      );
    });
  });
});
