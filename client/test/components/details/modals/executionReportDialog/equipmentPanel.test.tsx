import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import { describe, it, vi, beforeEach, expect } from "vitest";
import { ExecutionEquipmentPanel } from "@/components/details/modals/executionReportDialog/EquipmentPanel";
import userEvent from "@testing-library/user-event";
import { mockFormData } from "../../../../mocks/mockFormData";

const renderComponent = (formErrors: Record<string, string> = {}) => {
  const onInputChange = vi.fn(() => vi.fn());
  const onAddEquipment = vi.fn();
  const onEquipmentChange = vi.fn();
  const onRemoveEquipment = vi.fn();

  render(
    <ExecutionEquipmentPanel
      formData={mockFormData}
      formErrors={formErrors}
      onInputChange={onInputChange}
      onAddEquipment={onAddEquipment}
      onEquipmentChange={onEquipmentChange}
      onRemoveEquipment={onRemoveEquipment}
    />
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
      screen.getByText("Possui equipamentos aplicados?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Possui equipamentos removidos?")
    ).toBeInTheDocument();

    expect(screen.getByText("Adicionar equipamento aplicado")).toBeVisible();
    expect(screen.getByText("Adicionar equipamento removido")).toBeVisible();
  });

  it("deve renderizar erros nos campos de equipamento aplicado", () => {
    renderComponent({
      "appliedEquipment.0.equipment": "Equipamento obrigatório",
      "appliedEquipment.0.power": "Potência obrigatória",
      "appliedEquipment.0.patrimony": "Patrimônio obrigatório",
      appliedEquipment: "Este campo é obrigatório",
    });

    expect(screen.getByText("Equipamento obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Potência obrigatória")).toBeInTheDocument();
    expect(screen.getByText("Patrimônio obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Este campo é obrigatório")).toBeInTheDocument();
  });

  it("deve renderizar erros nos campos de equipamento removido", () => {
    renderComponent({
      "equipmentRemoved.0.equipment": "Equipamento obrigatório",
      "equipmentRemoved.0.power": "Potência obrigatória",
      "equipmentRemoved.0.patrimony": "Patrimônio obrigatório",
    });

    expect(screen.getByText("Equipamento obrigatório")).toBeInTheDocument();
    expect(screen.getAllByText("Potência obrigatória")).toHaveLength(1);
    expect(screen.getByText("Patrimônio obrigatório")).toBeInTheDocument();
  });

  it("deve chamar callback ao clicar em adicionar equipamento aplicado", () => {
    const { onAddEquipment } = renderComponent();
    const btn = screen.getByText("Adicionar equipamento aplicado");
    fireEvent.click(btn);
    expect(onAddEquipment).toHaveBeenCalledWith(
      "appliedEquipment",
      "executionReport."
    );
  });

  it("deve chamar callback ao clicar em adicionar equipamento removido", () => {
    const { onAddEquipment } = renderComponent();
    const btn = screen.getByText("Adicionar equipamento removido");
    fireEvent.click(btn);
    expect(onAddEquipment).toHaveBeenCalledWith(
      "equipmentRemoved",
      "executionReport."
    );
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

  it("Deve chamar o método onRemoveEquipment ao clicar no botão", async () => {
    const user = userEvent.setup();

    const { onRemoveEquipment } = renderComponent();

    const button = screen.getByRole("button", {
      name: "Remover equipamento aplicado",
    });

    await user.click(button);

    await waitFor(() => {
      expect(onRemoveEquipment).toHaveBeenCalled();
    });

    expect(onRemoveEquipment).toHaveBeenCalledWith(
      "appliedEquipment",
      0,
      "executionReport."
    );
  });
});
