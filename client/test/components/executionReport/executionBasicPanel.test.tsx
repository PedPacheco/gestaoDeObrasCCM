import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockExecutionReport,
  mockExecutionReportMinimal,
} from "../../mocks/mockFormData";
import { FormData } from "@/hooks/useScheduleForm";
import { ExecutionBasicPanel } from "@/components/executionReport/executionBasicPanel";

const renderComponent = (formErrors: Record<string, string> = {}) => {
  const onInputChange = vi.fn(() => vi.fn());

  render(
    <ExecutionBasicPanel
      formData={mockExecutionReport}
      formErrors={formErrors}
      handleExecutionReportChange={onInputChange}
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
    // expect(
    //   screen.getByLabelText("Liberado para ligação parcial?"),
    // ).toBeInTheDocument();
  });

  it("Deve utilizar uma string vazia, caso os valores foram nulos", () => {
    render(
      <ExecutionBasicPanel
        formErrors={{}}
        handleExecutionReportChange={vi.fn()}
        formData={mockExecutionReportMinimal}
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

    // const partialConnectionReleasedCheckbox = screen.getByLabelText(
    //   "Liberado para ligação parcial?",
    // ) as HTMLInputElement;

    expect(supervisorInput.value).toBe("");
    expect(startContactInput.value).toBe("");
    expect(startEndInput.value).toBe("");
    // expect(partialConnectionReleasedCheckbox.checked).toBe(false);
  });
});
