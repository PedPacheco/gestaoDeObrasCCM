import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// mocks externos
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock("@/utils/formatValue", () => ({
  formatPercentage: vi.fn((value) => `formatted-${value}`),
}));

vi.mock("@/utils/validDate", () => ({
  isValidDateString: vi.fn(),
}));

import { useRouter } from "next/navigation";
import { formatPercentage } from "@/utils/formatValue";
import { isValidDateString } from "@/utils/validDate";
import EntryByDateTable from "@/components/entryComponents/entryByDate/entryByDateTable";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("EntryByDateTable", () => {
  const columns = {
    ovnota: "OV",
    prog: "Programado",
    exec: "Executado",
    date: "Data",
    other: "Outro",
  };

  const baseData = [
    {
      id: 1,
      ovnota: "123",
      prog: 0.5,
      exec: 0.8,
      date: "2024-01-10",
      other: "texto",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    (useRouter as unknown as Mock).mockReturnValue({
      push: pushMock,
    });
  });

  it("deve renderizar headers corretamente", () => {
    render(<EntryByDateTable data={[]} columns={columns} />);

    Object.values(columns).forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("deve renderizar os dados corretamente", () => {
    (isValidDateString as any).mockReturnValue(false);

    render(<EntryByDateTable data={baseData} columns={columns} />);

    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("texto")).toBeInTheDocument();
  });

  it("deve aplicar formatPercentage para prog e exec", () => {
    (isValidDateString as any).mockReturnValue(false);

    render(<EntryByDateTable data={baseData} columns={columns} />);

    expect(formatPercentage).toHaveBeenCalledWith(0.5);
    expect(formatPercentage).toHaveBeenCalledWith(0.8);

    expect(screen.getByText("formatted-0.5")).toBeInTheDocument();
    expect(screen.getByText("formatted-0.8")).toBeInTheDocument();
  });

  it("deve formatar data como DD/MM/YYYY quando ano != 1970", () => {
    (isValidDateString as any).mockReturnValue(true);

    render(<EntryByDateTable data={baseData} columns={columns} />);

    expect(screen.getByText("10/01/2024")).toBeInTheDocument();
  });

  it("deve formatar data como HH:mm quando ano for 1970", () => {
    (isValidDateString as any).mockReturnValue(true);

    const data1970 = [
      {
        ...baseData[0],
        date: "1970-01-01T10:30:00Z",
      },
    ];

    render(<EntryByDateTable data={data1970} columns={columns} />);

    expect(screen.getByText("10:30")).toBeInTheDocument();
  });

  it("não deve formatar quando string não for data válida", () => {
    (isValidDateString as any).mockReturnValue(false);

    render(<EntryByDateTable data={baseData} columns={columns} />);

    expect(screen.getByText("2024-01-10")).toBeInTheDocument();
  });

  it("deve navegar ao clicar na coluna ovnota", () => {
    (isValidDateString as any).mockReturnValue(false);

    render(<EntryByDateTable data={baseData} columns={columns} />);

    const cell = screen.getByText("123");

    fireEvent.click(cell);

    expect(pushMock).toHaveBeenCalledWith("/detalhes/1");
  });

  it("não deve navegar ao clicar em outras colunas", () => {
    (isValidDateString as any).mockReturnValue(false);

    render(<EntryByDateTable data={baseData} columns={columns} />);

    const otherCell = screen.getByText("texto");

    fireEvent.click(otherCell);

    expect(pushMock).not.toHaveBeenCalled();
  });

  it("deve lidar com múltiplas linhas", () => {
    (isValidDateString as any).mockReturnValue(false);

    const multipleData = [
      ...baseData,
      {
        id: 2,
        ovnota: "456",
        prog: 0.2,
        exec: 0.3,
        date: "2024-02-01",
        other: "abc",
      },
    ];

    render(<EntryByDateTable data={multipleData} columns={columns} />);

    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("456")).toBeInTheDocument();
  });
});
