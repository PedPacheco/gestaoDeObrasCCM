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
    mo_planejada: "M.O Planejada",
    ovnota: "Ovnota",
    prog: "Prog %",
    exec: "Exec %",
    data_fim: "Data Fim",
    objeto: "Objeto",
  };

  const data = {
    works: [
      {
        id: 1,
        data_inicio: "2024-07-20",
        mo_planejada: 10000.1234,
        ovnota: "23421432",
        prog: 78,
        exec: 92,
        data_fim: "1970-01-01T14:30:00Z",
        objeto: { nome: "Pedro", cargo: "Dev" },
      },
    ],
    totals: {
      total_obras: 1,
      total_mo_planejada: 10000,
      total_mo_exec: 9000,
      total_mo_suspensa: 1000,
      total_qtde_planejada: 10,
      total_qtde_pend: 2,
    },
  };

  it("renderiza colunas e dados corretamente", () => {
    render(
      <TableWithPagination
        columns={columns}
        data={data}
        page={0}
        sliceEndIndex={0}
        handleChangePage={handleChangePage}
      />
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

    expect(screen.getByText("Página 1 de 1")).toBeInTheDocument();
  });

  it("chama router.push ao clicar em uma célula", () => {
    render(
      <TableWithPagination
        columns={columns}
        data={data}
        page={0}
        sliceEndIndex={0}
        handleChangePage={handleChangePage}
      />
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
        page={0}
        sliceEndIndex={1}
        handleChangePage={handleChangePage}
      />
    );

    expect(screen.getAllByRole("columnheader")).toHaveLength(6);
  });

  it("chama handleChangePage quando paginação é usada", () => {
    render(
      <TableWithPagination
        columns={columns}
        data={{ ...data, totals: { ...data.totals, total_obras: 400 } }}
        page={0}
        sliceEndIndex={0}
        handleChangePage={handleChangePage}
      />
    );

    const nextPageBtn = screen.getByTitle("Go to last page");
    fireEvent.click(nextPageBtn);

    expect(handleChangePage).toHaveBeenCalled();
  });
});
