import { describe, expect, it, vi } from "vitest";

import { AdditionalInfoPanel } from "@/components/details/workDetails/modals/scheduleDialog/additionalInfoPanel";
import { render, screen } from "@testing-library/react";

import { mockFormData } from "../../../../mocks/mockFormData";

const mockOptions = {
  tecnico: [{ id: 1, tecnico: "não definido" }],
  restricao: [{ id: 1, restricao: "chuva", tipo_restricao: "EXECUÇÃO" }],
};

describe("AdditionalInfoPanel component", () => {
  it("Deve renderizar os dados corretamente ", () => {
    const onInputChange = vi.fn(() => vi.fn());

    render(
      <AdditionalInfoPanel
        formData={mockFormData}
        options={mockOptions}
        formErrors={{}}
        onInputChange={onInputChange}
        disabledFields={() => false}
      />,
    );

    expect(screen.getAllByText("Técnico Responsável")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Restrição de Execução")[0]).toBeInTheDocument();
    expect(
      screen.getAllByText("Responsabilidade Execução")[0],
    ).toBeInTheDocument();
  });

  it("Deve renderizar as mensagens de erros", () => {
    const onInputChange = vi.fn(() => vi.fn());

    render(
      <AdditionalInfoPanel
        formData={mockFormData}
        options={mockOptions}
        formErrors={{
          idExecutionRestriction: "Erro no restrição",
          responsibility: "Erro no responsável",
        }}
        onInputChange={onInputChange}
        disabledFields={() => false}
      />,
    );

    expect(screen.getAllByText("Erro no restrição")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Erro no responsável")[0]).toBeInTheDocument();
  });

  it("Deve desabilitar os campos", () => {
    render(
      <AdditionalInfoPanel
        formData={{ ...mockFormData, exec: "" }}
        options={mockOptions}
        formErrors={{
          idExecutionRestriction: "Erro no restrição",
          responsibility: "Erro no responsável",
        }}
        onInputChange={vi.fn()}
        disabledFields={() => false}
        permission="PARCEIRA"
      />,
    );

    const comboboxes = screen.getAllByRole("combobox");

    expect(comboboxes[1]).toHaveAttribute("aria-disabled", "true");
    expect(comboboxes[2]).toHaveAttribute("aria-disabled", "true");

    expect(screen.getByLabelText("Observação da Execução")).toBeDisabled();
  });
});
