import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, vi, beforeEach, expect } from "vitest";
import userEvent from "@testing-library/user-event";
import { ExecutionEquipmentPanel } from "@/components/executionReport/EquipmentPanel";
import { mockExecutionReport } from "../../mocks/mockFormData";

const renderComponent = (formErrors: Record<string, string> = {}) => {
  const onInputChange = vi.fn(() => vi.fn());
  const onAddEquipment = vi.fn();
  const onEquipmentChange = vi.fn();
  const onRemoveEquipment = vi.fn();

  render(
    <ExecutionEquipmentPanel
      formData={mockExecutionReport}
      formErrors={formErrors}
      handleExecutionReportChange={onInputChange}
      onAddEquipment={onAddEquipment}
      onEquipmentChange={onEquipmentChange}
      onRemoveEquipment={onRemoveEquipment}
    />,
  );

  return {
    onInputChange,
    onAddEquipment,
    onEquipmentChange,
    onRemoveEquipment,
  };
};

describe("ExecutionEquipmentPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar checkboxes e equipamentos aplicados/removidos", () => {
    renderComponent();

    expect(
      screen.getByText("Possui equipamentos aplicados?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Possui equipamentos removidos?"),
    ).toBeInTheDocument();

    expect(screen.getByText("Adicionar equipamento aplicado")).toBeVisible();
    expect(screen.getByText("Adicionar equipamento removido")).toBeVisible();
  });

  it("deve chamar callback ao clicar em adicionar equipamento aplicado", () => {
    const { onAddEquipment } = renderComponent();
    const btn = screen.getByText("Adicionar equipamento aplicado");
    fireEvent.click(btn);
    expect(onAddEquipment).toHaveBeenCalledWith("appliedEquipment");
  });

  it("deve chamar callback ao clicar em adicionar equipamento removido", () => {
    const { onAddEquipment } = renderComponent();
    const btn = screen.getByText("Adicionar equipamento removido");
    fireEvent.click(btn);
    expect(onAddEquipment).toHaveBeenCalledWith("equipmentRemoved");
  });

  it("deve chamar onInputChange ao clicar nas checkboxes", () => {
    const { onInputChange } = renderComponent();

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]);
    expect(onInputChange).toHaveBeenCalled();
  });

  it("deve chamar onInputChange ao clicar nas checkboxes", () => {
    const { onInputChange } = renderComponent();

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    expect(onInputChange).toHaveBeenCalled();
  });

  it("Deve chamar onRemoveEquipment com índice correto", async () => {
    const user = userEvent.setup();

    const { onRemoveEquipment } = renderComponent();

    const button = screen.getAllByRole("button", {
      name: /remover equipamento aplicado/i,
    });

    await user.click(button[0]);

    expect(onRemoveEquipment).toHaveBeenCalledTimes(1);
    expect(onRemoveEquipment).toHaveBeenCalledWith("appliedEquipment", 0);
  });
});
