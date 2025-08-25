import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import EntryTable from "@/components/entryComponents/entry/EntryTable";

// Mock do Material-UI
vi.mock("@mui/material", () => ({
  Paper: ({ children, ...props }: any) => (
    <div data-testid="paper" {...props}>
      {children}
    </div>
  ),
  Table: ({ children, stickyHeader, ...props }: any) => (
    <table data-testid="table" data-sticky-header={stickyHeader} {...props}>
      {children}
    </table>
  ),
  TableBody: ({ children, className, ...props }: any) => (
    <tbody data-testid="table-body" className={className} {...props}>
      {children}
    </tbody>
  ),
  TableCell: ({ children, className, ...props }: any) => (
    <td data-testid="table-cell" className={className} {...props}>
      {children}
    </td>
  ),
  TableContainer: ({ children, className, component, ...props }: any) => (
    <div data-testid="table-container" className={className} {...props}>
      {children}
    </div>
  ),
  TableFooter: ({ children, ...props }: any) => (
    <tfoot data-testid="table-footer" {...props}>
      {children}
    </tfoot>
  ),
  TableHead: ({ children, ...props }: any) => (
    <thead data-testid="table-head" {...props}>
      {children}
    </thead>
  ),
  TableRow: ({ children, className, ...props }: any) => (
    <tr data-testid="table-row" className={className} {...props}>
      {children}
    </tr>
  ),
}));

describe("EntryTable component", () => {
  const mockColumns = {
    grupo: "Grupo/Tipo",
    jan: "Janeiro",
    fev: "Fevereiro",
    mar: "Março",
    abr: "Abril",
  };

  const mockData = [
    {
      grupo: "Grupo A",
      tipo: "Tipo 1",
      jan_entrada: 1500.75,
      jan_entrada_qtde: 10,
      fev_entrada: 2200.5,
      fev_entrada_qtde: 15,
      mar_entrada: 1800.25,
      mar_entrada_qtde: 12,
      abr_entrada: 2500.0,
      abr_entrada_qtde: 18,
    },
    {
      grupo: "Grupo B",
      tipo: "Tipo 2",
      jan_entrada: 3200.8,
      jan_entrada_qtde: 25,
      fev_entrada: 1950.3,
      fev_entrada_qtde: 13,
      mar_entrada: 2750.6,
      mar_entrada_qtde: 20,
      abr_entrada: 3100.45,
      abr_entrada_qtde: 22,
    },
  ];

  const defaultProps = {
    data: mockData,
    columns: mockColumns,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar a estrutura da tabela corretamente", () => {
    render(<EntryTable {...defaultProps} />);

    expect(screen.getByTestId("table-container")).toBeInTheDocument();
    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByTestId("table-head")).toBeInTheDocument();
    expect(screen.getByTestId("table-body")).toBeInTheDocument();
    expect(screen.getByTestId("table-footer")).toBeInTheDocument();
  });

  it("deve renderizar o cabeçalho com as colunas corretas", () => {
    render(<EntryTable {...defaultProps} />);

    expect(screen.getByText("Grupo/Tipo")).toBeInTheDocument();
    expect(screen.getByText("Janeiro")).toBeInTheDocument();
    expect(screen.getByText("Fevereiro")).toBeInTheDocument();
    expect(screen.getByText("Março")).toBeInTheDocument();
    expect(screen.getByText("Abril")).toBeInTheDocument();
  });

  it("deve renderizar todas as linhas de dados", () => {
    render(<EntryTable {...defaultProps} />);

    // Verificar grupos e tipos
    expect(screen.getByText("Grupo A")).toBeInTheDocument();
    expect(screen.getByText("Tipo 1")).toBeInTheDocument();
    expect(screen.getByText("Grupo B")).toBeInTheDocument();
    expect(screen.getByText("Tipo 2")).toBeInTheDocument();
  });

  it("deve formatar valores monetários corretamente", () => {
    render(<EntryTable {...defaultProps} />);

    // Verificar se os valores são formatados para pt-BR
    expect(screen.getByText("1.501")).toBeInTheDocument(); // 1500.75 formatado
    expect(screen.getByText("2.201")).toBeInTheDocument(); // 2200.50 formatado
    expect(screen.getByText("3.201")).toBeInTheDocument(); // 3200.80 formatado
  });

  it("deve formatar quantidades corretamente", () => {
    render(<EntryTable {...defaultProps} />);

    // Verificar quantidades
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("13")).toBeInTheDocument();
  });

  it("deve calcular e exibir totais corretamente", () => {
    render(<EntryTable {...defaultProps} />);

    expect(screen.getByText("Total")).toBeInTheDocument();

    expect(screen.getByText("35")).toBeInTheDocument(); // Total janeiro qtde
    expect(screen.getByText("4.702")).toBeInTheDocument(); // Total janeiro valor
    expect(screen.getByText("28")).toBeInTheDocument(); // Total fevereiro qtde
    expect(screen.getByText("4.151")).toBeInTheDocument(); // Total fevereiro valor
  });

  it("deve renderizar tabela vazia quando data está vazio", () => {
    render(<EntryTable data={[]} columns={mockColumns} />);

    expect(screen.getByTestId("table")).toBeInTheDocument();
    expect(screen.getByTestId("table-body")).toBeInTheDocument();

    // Deve ainda mostrar cabeçalho e footer
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("deve lidar com valores undefined/null nos dados", () => {
    const dataWithNulls = [
      {
        grupo: "Grupo C",
        tipo: "Tipo 3",
        jan_entrada: undefined,
        jan_entrada_qtde: null,
        fev_entrada: 1000,
        fev_entrada_qtde: 5,
      },
    ];

    render(<EntryTable data={dataWithNulls} columns={mockColumns} />);

    expect(screen.getByText("Grupo C")).toBeInTheDocument();
    expect(screen.getByText("Tipo 3")).toBeInTheDocument();
  });

  it("deve aplicar classes CSS corretas", () => {
    render(<EntryTable {...defaultProps} />);

    const tableContainer = screen.getByTestId("table-container");
    expect(tableContainer).toHaveClass("mb-4", "w-[95%]", "max-h-[880px]");

    const table = screen.getByTestId("table");
    expect(table).toHaveAttribute("data-sticky-header", "true");
  });

  it("deve renderizar com uma única coluna", () => {
    const singleColumnData = {
      grupo: "Grupo/Tipo",
      jan: "Janeiro",
    };

    const singleRowData = [
      {
        grupo: "Grupo X",
        tipo: "Tipo X",
        jan_entrada: 500,
        jan_entrada_qtde: 3,
      },
    ];

    render(<EntryTable data={singleRowData} columns={singleColumnData} />);

    expect(screen.getByText("Grupo/Tipo")).toBeInTheDocument();
    expect(screen.getByText("Janeiro")).toBeInTheDocument();
    expect(screen.getByText("Grupo X")).toBeInTheDocument();
    expect(screen.getByText("Tipo X")).toBeInTheDocument();
  });

  it("deve calcular totais como zero quando não há dados", () => {
    render(<EntryTable data={[]} columns={mockColumns} />);

    expect(screen.getByText("Total")).toBeInTheDocument();

    const totalCells = screen.getAllByText("0");
    expect(totalCells.length).toBeGreaterThan(0);
  });

  it("deve tratar valores decimais corretamente no cálculo dos totais", () => {
    const decimalData = [
      {
        grupo: "Grupo D",
        tipo: "Tipo 4",
        jan_entrada: 1234.56,
        jan_entrada_qtde: 7,
        fev_entrada: 2345.67,
        fev_entrada_qtde: 8,
      },
    ];

    render(<EntryTable data={decimalData} columns={mockColumns} />);

    // Verificar se os valores decimais são tratados corretamente
    expect(screen.getAllByText("1.235")[0]).toBeInTheDocument(); // 1234.56 arredondado
    expect(screen.getAllByText("2.346")[0]).toBeInTheDocument(); // 2345.67 arredondado
  });

  it("deve manter a estrutura quando colunas têm nomes diferentes", () => {
    const differentColumns = {
      info: "Informações",
      q1: "Q1 2024",
      q2: "Q2 2024",
    };

    const differentData = [
      {
        grupo: "Grupo E",
        tipo: "Tipo 5",
        q1_entrada: 1000,
        q1_entrada_qtde: 10,
        q2_entrada: 2000,
        q2_entrada_qtde: 20,
      },
    ];

    render(<EntryTable data={differentData} columns={differentColumns} />);

    expect(screen.getByText("Informações")).toBeInTheDocument();
    expect(screen.getByText("Q1 2024")).toBeInTheDocument();
    expect(screen.getByText("Q2 2024")).toBeInTheDocument();
    expect(screen.getByText("Grupo E")).toBeInTheDocument();
  });

  it("deve renderizar corretamente com muitas colunas", () => {
    const manyColumns = {
      grupo: "Grupo/Tipo",
      jan: "Jan",
      fev: "Fev",
      mar: "Mar",
      abr: "Abr",
      mai: "Mai",
      jun: "Jun",
      jul: "Jul",
      ago: "Ago",
      set: "Set",
      out: "Out",
      nov: "Nov",
      dez: "Dez",
    };

    const yearData = [
      {
        grupo: "Grupo Anual",
        tipo: "Tipo Anual",
        jan_entrada: 1000,
        jan_entrada_qtde: 10,
        fev_entrada: 1100,
        fev_entrada_qtde: 11,
        mar_entrada: 1200,
        mar_entrada_qtde: 12,
        abr_entrada: 1300,
        abr_entrada_qtde: 13,
        mai_entrada: 1400,
        mai_entrada_qtde: 14,
        jun_entrada: 1500,
        jun_entrada_qtde: 15,
        jul_entrada: 1600,
        jul_entrada_qtde: 16,
        ago_entrada: 1700,
        ago_entrada_qtde: 17,
        set_entrada: 1800,
        set_entrada_qtde: 18,
        out_entrada: 1900,
        out_entrada_qtde: 19,
        nov_entrada: 2000,
        nov_entrada_qtde: 20,
        dez_entrada: 2100,
        dez_entrada_qtde: 21,
      },
    ];

    render(<EntryTable data={yearData} columns={manyColumns} />);

    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Dez")).toBeInTheDocument();
    expect(screen.getByText("Grupo Anual")).toBeInTheDocument();
  });
});
