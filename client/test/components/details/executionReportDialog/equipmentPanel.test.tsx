import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, vi, beforeEach, expect } from "vitest";
import { FormData } from "@/hooks/useScheduleForm";
import { ExecutionEquipmentPanel } from "@/components/details/executionReportDialog/EquipmentPanel";

const mockFormData: FormData = {
  id: 1,
  dataProg: "2025-07-23",
  startTime: "08:00",
  finishTime: "12:00",
  prog: 50,
  exec: "Exec Test",
  serviceType: "Tipo A",
  equipment: "Banco capacitor",
  chi: 123,
  numDp: "456",
  temporaryKey: false,
  lmTeam: 1,
  regulTeam: 2,
  lvTeam: 3,
  idTechnical: 10,
  idExecutionRestriction: 5,
  responsibility: "Supervisor",
  executionReport: {
    id: 101,
    idUser: 5,
    supervisor: "Supervisor 1",
    partialConnectionReleased: true,
    startTime: "08:00",
    finishTime: "12:30",
    startContact: "Contato início",
    endContact: "Contato fim",
    delayJustification: "",
    hasEquipmentInstalled: true,
    appliedEquipment: [
      { equipment: "Transformador", power: "500", patrimony: "12345" },
    ],
    hasEquipmentRemoved: true,
    equipmentRemoved: [
      { equipment: "Banco capacitor", power: "200", patrimony: "54321" },
    ],
    changesExecution: false,
    generalObservation: "Obs",
    workSituation: "Concluído",
    reason: "",
    provisionalKeyInstalled: false,
    provisionalKeyReference: "ABC",
    provisionalKeyWithdrawn: true,
  },
};

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
    });

    expect(screen.getByText("Equipamento obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Potência obrigatória")).toBeInTheDocument();
    expect(screen.getByText("Patrimônio obrigatório")).toBeInTheDocument();
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
});
