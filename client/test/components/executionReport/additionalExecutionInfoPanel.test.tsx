import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockExecutionReport,
  mockExecutionReportMinimal,
} from "../../mocks/mockFormData";
import { AdditionalExecutionInfoPanel } from "@/components/executionReport/additionalExecutionInfoPanel";

const renderComponent = (formErrors: Record<string, string> = {}) => {
  const onInputChange = vi.fn(() => vi.fn());

  render(
    <AdditionalExecutionInfoPanel
      formData={mockExecutionReport}
      formErrors={formErrors}
      handleExecutionReportChange={onInputChange}
    />,
  );

  return {
    onInputChange,
  };
};

describe("AdditionalExecutionInfoPanel Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve os campos de input para inserção dos dados", () => {
    renderComponent();

    expect(screen.getByLabelText("Observação Geral")).toBeInTheDocument();

    expect(screen.getByLabelText("Motivo")).toBeInTheDocument();
    expect(screen.getByText("Chave Provisória Instalada?")).toBeInTheDocument();
    expect(screen.getByText("Chave Provisória Retirada?")).toBeInTheDocument();
  });

  it("Deve utilizar uma string vazia, caso os valores foram nulos", () => {
    render(
      <AdditionalExecutionInfoPanel
        formErrors={{}}
        handleExecutionReportChange={vi.fn()}
        formData={mockExecutionReportMinimal}
      />,
    );

    const provisionalKeyReferenceInput = screen.getAllByLabelText(
      "Referência da Chave Provisória - Exemplo: 175ET00554845",
    ) as HTMLInputElement[];

    provisionalKeyReferenceInput.map((item) => {
      expect(item.value).toBe("");
    });
  });

  it("deve marcar o rádio 'Não' quando provisionalKeyWithdrawn for false", () => {
    render(
      <AdditionalExecutionInfoPanel
        formErrors={{}}
        handleExecutionReportChange={vi.fn()}
        formData={mockExecutionReport}
      />,
    );

    const radioNo = screen.getByLabelText("Não") as HTMLInputElement;
    expect(radioNo.checked).toBe(true);

    const radioYes = screen.getByLabelText("Sim") as HTMLInputElement;
    expect(radioYes.checked).toBe(false);
  });

  it("deve chamar onInputChange com true ao selecionar 'Sim'", () => {
    const innerFn = vi.fn();
    const onInputChange = vi.fn(() => innerFn);

    render(
      <AdditionalExecutionInfoPanel
        formErrors={{}}
        handleExecutionReportChange={onInputChange}
        formData={mockExecutionReport}
      />,
    );

    const radioYes = screen.getByLabelText("Sim");
    fireEvent.click(radioYes);

    // A função externa
    expect(onInputChange).toHaveBeenCalledWith("provisionalKeyWithdrawn");

    expect(innerFn).toHaveBeenCalledWith({
      target: { type: "radio", value: true },
    });
  });

  it("deve exibir mensagem de erro quando errorProvisionalKeyWithdrawn estiver presente", () => {
    renderComponent({
      provisionalKeyWithdrawn: "false",
    });

    render(
      <AdditionalExecutionInfoPanel
        formErrors={{ provisionalKeyWithdrawn: "Campo obrigatório" }}
        handleExecutionReportChange={vi.fn()}
        formData={mockExecutionReport}
      />,
    );

    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
  });
});
