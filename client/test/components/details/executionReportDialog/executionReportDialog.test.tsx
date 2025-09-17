import { describe, expect, it, vi } from "vitest";

import {
  ExecutionReportData,
  ExecutionReportDialog,
} from "@/components/details/executionReportDialog/executionReportDialog";
import { useScheduleSubmit } from "@/hooks/useScheduleSubmit";
import * as schemasModule from "@/validations/validationSchedules";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { mockFormData } from "../../../mocks/mockFormData";

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
  "@/components/details/executionReportDialog/executionBasicPanel",
  () => ({
    ExecutionBasicPanel: () => <div>ExecutionBasicPanel</div>,
  })
);

vi.mock("@/components/details/executionReportDialog/EquipmentPanel", () => ({
  ExecutionEquipmentPanel: () => <div>ExecutionEquipmentPanel</div>,
}));

vi.mock(
  "@/components/details/executionReportDialog/additionalExecutionInfoPanel",
  () => ({
    AdditionalExecutionInfoPanel: () => <div>AdditionalExecutionInfoPanel</div>,
  })
);

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
      screen.getByText("Confirmar Alteração da Execução")
    ).toBeInTheDocument();
    expect(screen.getByText("ExecutionBasicPanel")).toBeInTheDocument();
    expect(screen.getByText("ExecutionEquipmentPanel")).toBeInTheDocument();
    expect(
      screen.getByText("AdditionalExecutionInfoPanel")
    ).toBeInTheDocument();

    expect(screen.getByText("Cancelar")).toBeInTheDocument();
    expect(screen.getByText("Salvar Execução")).toBeInTheDocument();
  });

  it("usa executionReportData quando executionReportIsInsert = false", () => {
    render(
      <ExecutionReportDialog {...baseProps} executionReportIsInsert={false} />
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

  it("deve chamar handleSubmit com 'schedule' quando executionReportIsInsert for true", async () => {
    const user = userEvent.setup();

    const handleSubmit = vi.fn();
    vi.mocked(useScheduleSubmit).mockReturnValue({
      handleSubmit,
      isPending: false,
    });

    vi.spyOn(schemasModule, "validationSchedulesSchema").mockReturnValue({
      safeParse: () => ({ success: true, data: null }),
    } as any);

    render(<ExecutionReportDialog {...baseProps} />);

    const button = screen.getByRole("button", { name: /salvar execução/i });
    await user.click(button);

    expect(handleSubmit).toHaveBeenCalledWith(null, "schedule");
  });

  it("deve chamar handleSubmit com 'executionReport' quando executionReportIsInsert for false", async () => {
    const user = userEvent.setup();

    const handleSubmit = vi.fn();
    vi.mocked(useScheduleSubmit).mockReturnValue({
      handleSubmit,
      isPending: false,
    });

    vi.spyOn(schemasModule, "executionReportSchema", "get").mockReturnValue({
      safeParse: () => ({ success: true, data: null }),
    } as any);

    render(
      <ExecutionReportDialog {...baseProps} executionReportIsInsert={false} />
    );

    const button = screen.getByRole("button", { name: /salvar execução/i });
    await user.click(button);

    expect(handleSubmit).toHaveBeenCalledWith(null, "executionReport");
  });
});
