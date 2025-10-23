import { AdditionalExecutionInfoPanel } from "@/components/details/modals/executionReportDialog/additionalExecutionInfoPanel";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockFormData } from "../../../mocks/mockFormData";
import { FormData } from "@/hooks/useScheduleForm";

const renderComponent = (formErrors: Record<string, string> = {}) => {
  const onInputChange = vi.fn(() => vi.fn());

  render(
    <AdditionalExecutionInfoPanel
      formData={mockFormData}
      formErrors={formErrors}
      onInputChange={onInputChange}
    />
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
        onInputChange={vi.fn()}
        formData={{
          ...mockFormData,
          executionReport: {
            ...mockFormData.executionReport,
            provisionalKeyReference: undefined,
            provisionalKeyWithdrawn: undefined,
          } as unknown as NonNullable<FormData["executionReport"]>,
        }}
      />
    );

    const provisionalKeyReferenceInput = screen.getAllByLabelText(
      "Referência da Chave Provisória - Exemplo: 175ET00554845"
    ) as HTMLInputElement[];

    provisionalKeyReferenceInput.map((item) => {
      expect(item.value).toBe("");
    });
  });

  it("deve marcar o rádio 'Não' quando provisionalKeyWithdrawn for false", () => {
    render(
      <AdditionalExecutionInfoPanel
        formErrors={{}}
        onInputChange={vi.fn()}
        formData={{
          ...mockFormData,
          executionReport: {
            ...mockFormData.executionReport,
            provisionalKeyWithdrawn: false,
          } as NonNullable<FormData["executionReport"]>,
        }}
      />
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
        onInputChange={onInputChange}
        formData={{
          ...mockFormData,
          executionReport: {
            ...mockFormData.executionReport,
            provisionalKeyWithdrawn: false,
          } as NonNullable<FormData["executionReport"]>,
        }}
      />
    );

    const radioYes = screen.getByLabelText("Sim");
    fireEvent.click(radioYes);

    // A função externa
    expect(onInputChange).toHaveBeenCalledWith(
      "executionReport.provisionalKeyWithdrawn"
    );

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
        onInputChange={vi.fn()}
        formData={mockFormData}
      />
    );

    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
  });
});
