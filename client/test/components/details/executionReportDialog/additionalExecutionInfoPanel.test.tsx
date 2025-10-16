import { AdditionalExecutionInfoPanel } from "@/components/details/modals/executionReportDialog/additionalExecutionInfoPanel";
import { render, screen } from "@testing-library/react";
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
});
