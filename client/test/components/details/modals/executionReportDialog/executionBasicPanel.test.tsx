import { ExecutionBasicPanel } from "@/components/details/modals/executionReportDialog/executionBasicPanel";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFormData } from "../../../../mocks/mockFormData";
import { FormData } from "@/hooks/details/useScheduleForm";

const renderComponent = (formErrors: Record<string, string> = {}) => {
  const onInputChange = vi.fn(() => vi.fn());

  render(
    <ExecutionBasicPanel
      formData={mockFormData}
      formErrors={formErrors}
      onInputChange={onInputChange}
      wasTheWorkCompleted={80}
    />,
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
      screen.getByLabelText("Horário de Início (Real campo)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Horário de Término (Real campo)"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Nome Operador COI - Inicio"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Nome Operador COI - Término"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Justificativa de Atraso"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Liberado para publicação?"),
    ).toBeInTheDocument();
  });

  it("Deve utilizar uma string vazia, caso os valores foram nulos", () => {
    render(
      <ExecutionBasicPanel
        formErrors={{}}
        onInputChange={vi.fn(() => vi.fn())}
        formData={{
          ...mockFormData,
          executionReport: {
            ...mockFormData.executionReport,
            supervisor: undefined,
            startContact: undefined,
            endContact: undefined,
          } as unknown as NonNullable<FormData["executionReport"]>,
        }}
        wasTheWorkCompleted={100}
      />,
    );

    const supervisorInput = screen.getByLabelText(
      "Supervisor",
    ) as HTMLInputElement;

    const startContactInput = screen.getByLabelText(
      "Nome Operador COI - Inicio",
    ) as HTMLInputElement;

    const startEndInput = screen.getByLabelText(
      "Nome Operador COI - Término",
    ) as HTMLInputElement;

    const partialConnectionReleasedCheckbox = screen.getByLabelText(
      "Liberado para publicação?",
    ) as HTMLInputElement;

    expect(supervisorInput.value).toBe("");
    expect(startContactInput.value).toBe("");
    expect(startEndInput.value).toBe("");
    expect(partialConnectionReleasedCheckbox.checked).toBe(true);
  });

  it("deve deixar o checkbox como false", () => {
    render(
      <ExecutionBasicPanel
        formData={{
          ...mockFormData,
          executionReport: {
            ...mockFormData.executionReport,
            supervisor: undefined,
            startContact: undefined,
            endContact: undefined,
            partialConnectionReleased: false,
          } as unknown as NonNullable<FormData["executionReport"]>,
        }}
        formErrors={{}}
        onInputChange={vi.fn()}
        wasTheWorkCompleted={80}
      />,
    );

    const partialConnectionReleasedCheckbox = screen.getByLabelText(
      "Liberado para publicação?",
    ) as HTMLInputElement;

    expect(partialConnectionReleasedCheckbox.checked).toBe(false);
  });
});
