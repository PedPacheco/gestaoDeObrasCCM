import { BasicInfoPanel } from "@/components/details/scheduleDialog/basicInfoPanel";
import { describe, expect, it, vi } from "vitest";
import { mockFormData } from "../../../mocks/mockFormData";
import { render, screen } from "@testing-library/react";

describe("BasicInfoPanel Component", () => {
  it("Deve renderizar os campos corretamente", () => {
    const onInputChange = vi.fn();

    render(
      <BasicInfoPanel
        formData={mockFormData}
        isInsert={false}
        formErrors={{}}
        onInputChange={onInputChange}
      />
    );

    expect(screen.getByLabelText(/Data da Programação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Horário Início/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Horário Fim/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Progresso Programado:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Progresso Executado:/i)).toBeInTheDocument();
  });

  it("Deve alterar valor do campo Exec", () => {
    const onInputChange = vi.fn();

    render(
      <BasicInfoPanel
        formData={{ ...mockFormData, exec: "null" }}
        isInsert={false}
        formErrors={{}}
        onInputChange={onInputChange}
      />
    );

    expect(screen.getByLabelText(/Progresso Executado:/i)).toHaveValue("");
  });

  it("Deve alterar valor do campo Exec", () => {
    const onInputChange = vi.fn();

    render(
      <BasicInfoPanel
        formData={{ ...mockFormData, exec: undefined }}
        isInsert={false}
        formErrors={{}}
        onInputChange={onInputChange}
      />
    );

    const gridElement =
      screen.getByLabelText(/progresso programado/i).parentElement
        ?.parentElement?.parentElement;

    expect(gridElement?.className).toMatch(/MuiGrid-grid-sm-12/);
  });
});
