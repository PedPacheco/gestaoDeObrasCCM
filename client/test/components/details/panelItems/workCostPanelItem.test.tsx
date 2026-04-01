import WorkCostPanelItem from "@/components/details/panelItems/workCostPanelItem";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

const mockData = {
  capex_mat_plan: 3343.35,
  capex_mo_plan: 3324.43,
  capex_mat_pend: 1234.63,
  capex_mo_pend: 875.54,
  mo_planejada: 4234.53,
  mo_final: 3453.53,
  mo_pend: 2345.42,
  qtde_planejada: 12,
  qtde_pend: 8,
};

describe("WorkCostPanelItem Component", () => {
  it("deve renderizar corretamente os dados na tabela", () => {
    render(<WorkCostPanelItem data={mockData} />);

    expect(screen.getByText("R$ 3.343")).toBeInTheDocument();
    expect(screen.getByText("R$ 3.324")).toBeInTheDocument();
    expect(screen.getByText("R$ 6.668")).toBeInTheDocument();
    expect(screen.getByText("R$ 1.235")).toBeInTheDocument();
    expect(screen.getByText("R$ 876")).toBeInTheDocument();
    expect(screen.getByText("R$ 2.110")).toBeInTheDocument();
    expect(screen.getByText("R$ 3.454")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("não deve renderizar o valor da mão de obra Executado", () => {
    render(<WorkCostPanelItem data={{ ...mockData, mo_final: undefined }} />);

    const divWrapper = screen.getByText("Executado").closest("div");
    const pElements = divWrapper?.querySelectorAll("p");

    expect(pElements?.[1]).toHaveTextContent("");
  });

  it("não deve renderizar o valor da mão de obra pendente", () => {
    render(<WorkCostPanelItem data={{ ...mockData, mo_pend: undefined }} />);

    const divWrapper = screen.getAllByText("Pendente")[1].closest("div");
    const pElements = divWrapper?.querySelectorAll("p");

    expect(pElements?.[1]).toHaveTextContent("");
  });
});
