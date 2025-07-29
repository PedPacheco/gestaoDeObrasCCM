import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { TableWithVirtualization } from "@/components/common/TableWithVirtualization";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("react-virtuoso", () => {
  return {
    TableVirtuoso: ({
      data,
      components,
      fixedHeaderContent,
      itemContent,
    }: any) => {
      const TableHead = components.TableHead;
      const TableBody = components.TableBody;
      const Table = components.Table;

      return (
        <components.Scroller>
          <Table>
            <TableHead>{fixedHeaderContent()}</TableHead>
            <TableBody>
              {data.map((_: any, index: number) => (
                <tr key={index}>{itemContent(index)}</tr>
              ))}
            </TableBody>
          </Table>
        </components.Scroller>
      );
    },
  };
});

describe("TableWithVistualization component", () => {
  const pushMock = vi.fn();
  const columns = {
    id: "ID",
    data_inicio: "Data Início",
    mo_planejada: "M.O Planejada",
    prog: "Prog %",
    exec: "Exec %",
    data_fim: "Data Fim",
    objeto: "Objeto",
  };

  const data = [
    {
      id: 1,
      data_inicio: "2024-07-20",
      mo_planejada: 10000.1234,
      prog: 78,
      exec: 92,
      data_fim: "1970-01-01T14:30:00Z",
      objeto: { nome: "Pedro", cargo: "Dev" },
    },
  ];

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as any);
  });

  it("renderiza colunas e dados corretamente", () => {
    render(<TableWithVirtualization columns={columns} data={data} />);

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
  });

  it("chama router.push ao clicar em uma célula", () => {
    render(<TableWithVirtualization columns={columns} data={data} />);

    const cell = screen.getByText("20/07/2024");
    fireEvent.click(cell);

    expect(pushMock).toHaveBeenCalledWith("/detalhes/1");
  });

  it("Deve renderizar uma coluna a menos da tabela", () => {
    render(
      <TableWithVirtualization
        columns={columns}
        data={data}
        sliceEndIndex={1}
      />
    );

    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
  });
});
