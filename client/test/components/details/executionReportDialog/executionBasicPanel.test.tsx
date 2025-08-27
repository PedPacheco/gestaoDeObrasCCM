import { ExecutionBasicPanel } from "@/components/details/executionReportDialog/executionBasicPanel";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFormData } from "../../../mocks/mockFormData";
import { FormData } from "@/hooks/useScheduleForm";

const renderComponent = (formErrors: Record<string, string> = {}) => {
  const onInputChange = vi.fn(() => vi.fn());

  render(
    <ExecutionBasicPanel
      formData={mockFormData}
      formErrors={formErrors}
      onInputChange={onInputChange}
    />
  );

  return {
    onInputChange,
  };
};

describe("ExecutionBasicPanel component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar todos os inputs do componente", () => {
    renderComponent();

    expect(screen.getByLabelText("Supervisor")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Horário de Início (Real campo)")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Horário de Término (Real campo)")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Contato Início")).toBeInTheDocument();
    expect(screen.getByLabelText("Contato Término")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Justificativa de Atraso")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Liberado para ligação parcial?")
    ).toBeInTheDocument();
  });

  it("Deve utilizar uma string vazia, caso os valores foram nulos", () => {
    render(
      <ExecutionBasicPanel
        formErrors={{}}
        onInputChange={vi.fn()}
        formData={{
          ...mockFormData,
          executionReport: {
            ...mockFormData.executionReport,
            supervisor: undefined,
            startContact: undefined,
            endContact: undefined,
            partialConnectionReleased: undefined,
          } as unknown as NonNullable<FormData["executionReport"]>,
        }}
      />
    );

    const supervisorInput = screen.getByLabelText(
      "Supervisor"
    ) as HTMLInputElement;

    const startContactInput = screen.getByLabelText(
      "Contato Início"
    ) as HTMLInputElement;

    const startEndInput = screen.getByLabelText(
      "Contato Término"
    ) as HTMLInputElement;

    const partialConnectionReleasedCheckbox = screen.getByLabelText(
      "Liberado para ligação parcial?"
    ) as HTMLInputElement;

    expect(supervisorInput.value).toBe("");
    expect(startContactInput.value).toBe("");
    expect(startEndInput.value).toBe("");
    expect(partialConnectionReleasedCheckbox.checked).toBe(false);
  });
});
