import { ServiceEquipmentPanel } from "@/components/details/modals/scheduleDialog/serviceEquipmentPanel";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockFormData } from "../../../../mocks/mockFormData";

describe("ServiceEquipmentPanel component", () => {
  it("deve renderizar os campos corretamente", () => {
    const onInputChange = vi.fn();

    render(
      <ServiceEquipmentPanel
        formData={mockFormData}
        formErrors={{}}
        onInputChange={onInputChange}
        disabledFields={() => false}
      />
    );

    expect(screen.getAllByText("Tipo de Serviço")[0]).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Equipamento a ser desligado/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/CHI/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Número DP/i)).toBeInTheDocument();
  });
});
