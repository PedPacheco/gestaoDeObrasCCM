// AdvancePartnerFilters.spec.tsx

import { AdvancePartnerFilters } from "@/components/dashboard/AvancaParceiro/DashAvancaParceiro/advancePartnerFilters";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDateFilter = vi.fn();

const mockMultipleSelect = vi.fn();

vi.mock("@/components/common/DateFilter", () => ({
  DateFilter: (props: any) => {
    mockDateFilter(props);

    return <div data-testid="date-filter" />;
  },
}));

vi.mock("@/components/common/MultipleSelect", () => ({
  MultipleSelectComponent: (props: any) => {
    mockMultipleSelect(props);

    return <div data-testid={`select-${props.label}`}>{props.label}</div>;
  },
}));

vi.mock("@/utils/weeks", () => ({
  WEEKS: [
    {
      num: 1,
      inicio: "01/01",
      fim: "07/01",
      mes: "JAN",
    },
    {
      num: 2,
      inicio: "08/01",
      fim: "14/01",
      mes: "JAN",
    },
    {
      num: 3,
      inicio: "15/01",
      fim: "21/01",
      mes: "JAN",
    },
  ],
}));

vi.mock("@/hooks/dashboard/advancePartner/useAdvancePartnerFilters", () => ({
  EXCLUDE_PARCEIRAS: new Set(["EXCLUIDA"]),
}));

describe("AdvancePartnerFilters", () => {
  const props = {
    startDate: null,
    endDate: null,

    initialWeek: 1,
    finalWeek: 2,

    selectedParceira: [],
    selectedRegional: [],

    filterMode: "semana" as const,
    motivoTab: "Geral" as const,

    setMotivoTab: vi.fn(),
    setFilterMode: vi.fn(),
    setStartDate: vi.fn(),
    setEndDate: vi.fn(),
    setInitialWeek: vi.fn(),
    setFinalWeek: vi.fn(),
    setSelectedParceira: vi.fn(),
    setSelectedRegional: vi.fn(),

    applyFilters: vi.fn(),
    clearFilters: vi.fn(),

    isPending: false,
    filtersTop: 100,

    filtersData: {
      regional: [
        {
          id: 1,
          regional: "SP",
        },
      ],

      parceira: [
        {
          id: 1,
          turma: "ALPHA",
        },
        {
          id: 2,
          turma: "EXCLUIDA",
        },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar os filtros principais", () => {
    render(<AdvancePartnerFilters {...props} />);

    expect(screen.getByText("Filtrar por")).toBeInTheDocument();

    expect(screen.getByText("Responsabilidade")).toBeInTheDocument();

    expect(screen.getByText("Aplicar")).toBeInTheDocument();

    expect(screen.getByText("Limpar")).toBeInTheDocument();
  });

  it("deve exibir WeekSelect quando filtro for semana", () => {
    render(<AdvancePartnerFilters {...props} />);

    expect(screen.getByText("Semana inicial")).toBeInTheDocument();

    expect(screen.getByText("Semana final")).toBeInTheDocument();

    expect(screen.queryByTestId("date-filter")).not.toBeInTheDocument();
  });

  it("deve exibir DateFilter quando filtro for data", () => {
    render(<AdvancePartnerFilters {...props} filterMode="data" />);

    expect(screen.getByTestId("date-filter")).toBeInTheDocument();

    expect(mockDateFilter).toHaveBeenCalledTimes(1);
  });

  it("deve chamar setFilterMode ao trocar modo", () => {
    render(<AdvancePartnerFilters {...props} />);

    fireEvent.click(screen.getByText("Data"));

    expect(props.setFilterMode).toHaveBeenCalledWith("data");
  });

  it("deve chamar setMotivoTab", () => {
    render(<AdvancePartnerFilters {...props} />);

    fireEvent.click(screen.getByText("Edp"));

    expect(props.setMotivoTab).toHaveBeenCalledWith("Edp");
  });

  it("deve abrir dropdown da semana", () => {
    render(<AdvancePartnerFilters {...props} />);

    fireEvent.click(screen.getByText("Sem. 1"));

    expect(screen.getByText("08/01 – 14/01")).toBeInTheDocument();

    expect(screen.getByText("15/01 – 21/01")).toBeInTheDocument();
  });

  it("deve selecionar semana", () => {
    render(<AdvancePartnerFilters {...props} />);

    fireEvent.click(screen.getByText("Sem. 1"));

    fireEvent.click(screen.getAllByText("Sem. 2")[0]);

    expect(props.setInitialWeek).toHaveBeenCalledWith(2);
  });

  it("deve fechar dropdown ao clicar fora", () => {
    render(<AdvancePartnerFilters {...props} />);

    fireEvent.click(screen.getByText("Sem. 1"));

    expect(screen.getByText("15/01 – 21/01")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByText("15/01 – 21/01")).not.toBeInTheDocument();
  });

  it("deve aplicar filtro", () => {
    render(<AdvancePartnerFilters {...props} />);

    fireEvent.click(screen.getByText("Aplicar"));

    expect(props.applyFilters).toHaveBeenCalledTimes(1);
  });

  it("deve limpar filtro", () => {
    render(<AdvancePartnerFilters {...props} />);

    fireEvent.click(screen.getByText("Limpar"));

    expect(props.clearFilters).toHaveBeenCalledTimes(1);
  });

  it("deve mostrar carregando quando pending", () => {
    render(<AdvancePartnerFilters {...props} isPending />);

    expect(screen.getAllByText("Carregando...")).toHaveLength(2);

    expect(
      screen.getAllByRole("button", {
        name: "Carregando...",
      }),
    ).toHaveLength(2);
  });

  it("deve desabilitar os botões quando pending", () => {
    render(<AdvancePartnerFilters {...props} isPending />);

    const buttons = screen.getAllByRole("button", {
      name: "Carregando...",
    });

    expect(buttons[0]).toBeDisabled();
    expect(buttons[1]).toBeDisabled();
  });

  it("deve filtrar parceiras excluídas", () => {
    render(<AdvancePartnerFilters {...props} />);

    const parceiraCall = mockMultipleSelect.mock.calls.find(
      ([arg]) => arg.label === "Parceira",
    );

    if (!parceiraCall) {
      return;
    }

    expect(parceiraCall[0].menuItems).toEqual([
      {
        id: 1,
        turma: "ALPHA",
      },
    ]);
  });

  it("deve utilizar arrays vazios quando filtros não existirem", () => {
    render(<AdvancePartnerFilters {...props} filtersData={{}} />);

    const calls = mockMultipleSelect.mock.calls;

    expect(calls[0][0].menuItems).toEqual([]);
    expect(calls[1][0].menuItems).toEqual([]);
  });

  it("deve aplicar style top recebido por props", () => {
    const { container } = render(
      <AdvancePartnerFilters {...props} filtersTop={250} />,
    );

    expect(container.firstChild).toHaveStyle({
      top: "250px",
    });
  });
});
