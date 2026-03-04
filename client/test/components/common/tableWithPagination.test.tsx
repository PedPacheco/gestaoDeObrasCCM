import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TableWithPagination } from "@/components/common/TableWithPagination";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("TableWithPagination", () => {
  const mockPush = vi.fn();
  const handleChangePage = vi.fn();

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push: mockPush } as any);
  });

  const columns = {
    id: "ID",
    data_inicio: "Data Início",
    mo_prog: "M.O Planejada",
    ovnota: "Ovnota",
    prog: "Prog %",
    exec: "Exec %",
    data_fim: "Data Fim",
    objeto: "Objeto",
    restricao_aberta: "Restricao Aberta",
  };

  const data = [
    {
      id: 1,
      data_inicio: "2024-07-20",
      mo_prog: 10000.1234,
      ovnota: "23421432",
      prog: 78,
      exec: 92,
      data_fim: "1970-01-01T14:30:00Z",
      objeto: { nome: "Pedro", cargo: "Dev" },
      restricao_aberta: true,
    },
  ];

  const totals = {
    total_obras: 1,
    total_mo_planejada: 10000,
    total_mo_exec: 9000,
    total_mo_suspensa: 1000,
    total_qtde_planejada: 10,
    total_qtde_pend: 2,
  };

  it("renderiza colunas e dados corretamente", () => {
    render(
      <TableWithPagination
        columns={columns}
        data={data}
        totals={totals}
        page={0}
        sliceEndIndex={0}
        handleChangePage={handleChangePage}
      />,
    );

    expect(screen.getByText("Data Início")).toBeInTheDocument();
    expect(screen.getByText("M.O Planejada")).toBeInTheDocument();
    expect(screen.getByText("Prog %")).toBeInTheDocument();
    expect(screen.getByText("Exec %")).toBeInTheDocument();

    expect(screen.getByText("20/07/2024")).toBeInTheDocument();
    expect(screen.getByText("R$ 10.000,12")).toBeInTheDocument();
    expect(screen.getByText("78%")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByText("14:30")).toBeInTheDocument();
    expect(screen.getByText("Pedro, Dev")).toBeInTheDocument();
    expect(screen.getByText("!!!")).toBeInTheDocument();

    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
  });

  it("chama router.push ao clicar em uma célula", () => {
    render(
      <TableWithPagination
        columns={columns}
        data={data}
        totals={totals}
        page={0}
        sliceEndIndex={0}
        handleChangePage={handleChangePage}
      />,
    );

    const cell = screen.getByText("20/07/2024");
    fireEvent.click(cell);

    expect(mockPush).toHaveBeenCalledWith("/detalhes/1");
  });

  it("Deve renderizar uma coluna a menos da tabela", () => {
    render(
      <TableWithPagination
        columns={columns}
        data={data}
        totals={totals}
        page={0}
        sliceEndIndex={1}
        handleChangePage={handleChangePage}
      />,
    );

    expect(screen.getAllByRole("columnheader")).toHaveLength(7);
  });

  it("chama handleChangePage quando paginação é usada", () => {
    render(
      <TableWithPagination
        columns={columns}
        data={data}
        totals={{ ...totals, total_obras: 400 }}
        page={0}
        sliceEndIndex={0}
        handleChangePage={handleChangePage}
      />,
    );

    const nextPageBtn = screen.getByTitle("Go to last page");
    fireEvent.click(nextPageBtn);

    expect(handleChangePage).toHaveBeenCalled();
  });

  it("renderiza celula com valor nulo, quando restricao_aberta for false", () => {
    const formattedData = [{ ...data[0], restricao_aberta: false }];

    render(
      <TableWithPagination
        columns={columns}
        data={formattedData}
        totals={totals}
        page={0}
        sliceEndIndex={0}
        handleChangePage={handleChangePage}
      />,
    );

    expect(screen.queryByText("!!!")).not.toBeInTheDocument();

    const emptyCells = screen.getAllByText("");
    expect(emptyCells.length).toBeGreaterThan(0);
  });

  it("renderiza corretamente todas as cores de status_prazo", () => {
    const columnsWithStatus = {
      id: "ID",
      status_prazo: "Status Prazo",
    };

    const statusData = [
      { id: 1, status_prazo: "No prazo" },
      { id: 2, status_prazo: "Atenção" },
      { id: 3, status_prazo: "Urgente" },
      { id: 4, status_prazo: "Crítico" },
      { id: 5, status_prazo: "Prazo vencido" },
    ];

    render(
      <TableWithPagination
        columns={columnsWithStatus}
        data={statusData}
        totals={{ ...totals, total_obras: 5 }}
        page={0}
        sliceEndIndex={0}
        handleChangePage={handleChangePage}
      />,
    );

    const noPrazo = screen.getByText("No prazo");
    const atencao = screen.getByText("Atenção");
    const urgente = screen.getByText("Urgente");
    const critico = screen.getByText("Crítico");
    const vencido = screen.getByText("Prazo vencido");

    expect(noPrazo).toHaveClass("bg-green-200", "text-green-800");
    expect(atencao).toHaveClass("bg-yellow-200", "text-yellow-800");
    expect(urgente).toHaveClass("bg-yellow-300", "text-yellow-900");
    expect(critico).toHaveClass("bg-red-300", "text-red-900");
    expect(vencido).toHaveClass("bg-black", "text-white");
  });
});
