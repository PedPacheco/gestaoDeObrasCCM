import { fetchData } from "@/actions/fetchData.action";
import MainEntryByDate, {
  MainEntryByDateFilters,
} from "@/components/entryComponents/entryByDate/MainEntryByDate";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/hooks/useSaveFilters", () => ({
  useSaveFilters: vi.fn(),
}));

vi.mock("@/utils/getButtonContent", () => ({
  getButtonContent: vi.fn((isPending, text) =>
    isPending ? "Carregando..." : text
  ),
}));

vi.mock("@/utils/transform", () => ({
  Transform: vi.fn((data) => data),
}));

vi.mock("@/utils/formatValue", () => ({
  capitalize: vi.fn((str) => str.charAt(0).toUpperCase() + str.slice(1)),
}));

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ text, onClick, disabled, styled }: any) => (
    <button
      data-testid="button-component"
      onClick={onClick}
      disabled={disabled}
      className={styled}
    >
      {text}
    </button>
  ),
}));

vi.mock("@/components/common/ErrorModal", () => ({
  __esModule: true,
  default: ({ open, message, onClose, icon }: any) =>
    open ? (
      <div data-testid="error-modal">
        <span data-testid="error-message">{message}</span>
        <button onClick={onClose}>Close</button>
        {icon}
      </div>
    ) : null,
}));

vi.mock("@/components/common/MultipleSelect", () => ({
  MultipleSelectComponent: ({
    label,
    menuItems,
    selectedItem,
    setSelectedItem,
    valueKey,
    displayKey,
  }: any) => (
    <div data-testid="multiple-select">
      <span data-testid="select-label">{label}</span>
      <select
        data-testid={`select-${label.toLowerCase()}`}
        multiple
        value={selectedItem || []}
        onChange={(e) => {
          const values = Array.from(
            e.target.selectedOptions,
            (option) => option.value
          );
          setSelectedItem?.(values);
        }}
      >
        {menuItems?.map((item: any, index: number) => (
          <option key={index} value={item[valueKey]}>
            {item[displayKey]}
          </option>
        ))}
      </select>
    </div>
  ),
}));

vi.mock("@/components/common/DateFilter", () => {
  return {
    DateFilter: ({ date, setDate, type, setType }: any) => (
      <div data-testid="mock-date-filter">
        <select
          data-testid="mock-date-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="day">Por Dia</option>
          <option value="month">Por Mês</option>
        </select>
        <input
          data-testid="mock-date-input"
          type="date"
          value={date ? date.format("YYYY-MM-DD") : ""}
          onChange={(e) => setDate(dayjs(e.target.value))}
        />
      </div>
    ),
  };
});

vi.mock("@/components/common/TableWithVirtualization", () => {
  return {
    TableWithVirtualization: ({
      data,
      columns,
    }: {
      data: any[];
      columns: Record<string, string>;
    }) => (
      <table data-testid="mock-table">
        <thead>
          <tr>
            {Object.values(columns).map((col: string, i: number) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i}>
              {Object.keys(columns).map((col: string) => (
                <td key={col}>{row[col]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    ),
  };
});

vi.mock("dayjs", () => {
  const mockDayjs = vi.fn(() => ({
    format: vi.fn((format: string) => {
      if (format === "MM/YYYY") return "10/2025";
      if (format === "DD/MM/YYYY") return "24/08/2025";
      return "";
    }),
  }));

  Object.assign(mockDayjs, {
    default: mockDayjs,
  });

  return {
    __esModule: true,
    default: mockDayjs,
  };
});

describe("MainEntryByDate", () => {
  const mockData = [
    {
      id: 1,
      ovnota: "OV12345",
      pep: "PEP001",
      diagrama: "DIA-100",
      ordem_dci: "DCI-001",
      ordem_dcd: "DCD-001",
      ordem_dca: "DCA-001",
      ordem_dcim: "DCIM-001",
      entrada: "2025-08-20",
      prazo: "2025-08-25",
      prazo_fim: "2025-08-30",
      qtde_planejada: 50,
      mo_planejada: 10,
      observ_obra: "Obra teste inicial",
      tipos: "Expansão",
      turmas: "Turma A",
      municipios: "São Paulo",
      total_obras: 1,
      total_mo_planejada: 10,
      total_qtde_planejada: 50,
    },
  ];

  const mockFiltersData: MainEntryByDateFilters = {
    regional: [
      { id: "1", regional: "Regional Sul" },
      { id: "2", regional: "Regional Norte" },
    ],
    parceira: [
      { id: "1", turma: "Parceira A" },
      { id: "2", turma: "Parceira B" },
    ],
    tipo: [
      { id: "1", tipo_obra: "Tipo Obra A", id_grupo: 1 },
      { id: "2", tipo_obra: "Tipo Obra B", id_grupo: 2 },
    ],
    municipio: [
      { id: "1", municipio: "São Paulo" },
      { id: "2", municipio: "Rio de Janeiro" },
    ],
    grupo: [
      { id: "1", grupo: "Grupo A" },
      { id: "2", grupo: "Grupo B" },
    ],
  };

  const mockColumns = {
    id: "ID",
    ovnota: "Ovnota",
    pep: "Pep",
    diagrama: "Diagrama",
  };

  const mockUseSaveFilters = {
    clearFilters: vi.fn(),
    filters: {},
    saveFilters: vi.fn(),
  };

  const defaultProps = {
    data: { works: mockData },
    filtersData: mockFiltersData,
    columns: mockColumns,
    token: "mock-token",
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    (useSaveFilters as Mock).mockReturnValue(mockUseSaveFilters);

    // Mock do process.env
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000/api";
  });

  it("deve renderizar todos os componentes básicos", () => {
    render(<MainEntryByDate {...defaultProps} />);

    expect(screen.getByTestId("mock-date-filter")).toBeInTheDocument();
    expect(screen.getByTestId("mock-table")).toBeInTheDocument();
  });

  it("deve renderizar todos os filtros baseados nos dados", () => {
    render(<MainEntryByDate {...defaultProps} />);

    expect(screen.getByTestId("select-regional")).toBeInTheDocument();
    expect(screen.getByTestId("select-turma")).toBeInTheDocument();
    expect(screen.getByTestId("select-tipo_obra")).toBeInTheDocument();
    expect(screen.getByTestId("select-municipio")).toBeInTheDocument();
    expect(screen.getByTestId("select-grupo")).toBeInTheDocument();
  });

  it("deve renderizar os botões de ação", () => {
    render(<MainEntryByDate {...defaultProps} />);

    const buttons = screen.getAllByTestId("button-component");
    expect(buttons).toHaveLength(2);

    expect(screen.getByText("Aplicar filtros")).toBeInTheDocument();
    expect(screen.getByText("Limpar filtros")).toBeInTheDocument();
  });

  it("deve atualizar selectedItems ao selecionar filtros", async () => {
    const user = userEvent.setup();
    render(<MainEntryByDate {...defaultProps} />);

    const regionalSelect = screen.getByTestId("select-regional");

    // Simular seleção de uma opção
    await user.selectOptions(regionalSelect, ["1"]);

    // Verificar se o select tem as opções corretas
    expect(screen.getByText("Regional Sul")).toBeInTheDocument();
  });

  describe("fetchWorks", () => {
    it("deve chamar fetchWorks ao clicar em aplicar filtros", async () => {
      (fetchData as Mock).mockResolvedValue({
        token: "mock-token",
        data: { works: mockData },
      });

      const user = userEvent.setup();
      render(<MainEntryByDate {...defaultProps} />);

      const applyButton = screen.getByText("Aplicar filtros");
      await user.click(applyButton);

      await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith(
          "http://localhost:3000/api/entrada/data",
          { tipoFiltro: undefined, data: "10/2025" },
          "mock-token"
        );
      });
    });

    it("deve chamar fetchWorks com valores de data no formato de dia", async () => {
      const mockFilters = {
        selectedItems: { idRegional: ["1"] },
        date: "10/08/2024",
        filterType: "day",
      };

      (useSaveFilters as Mock).mockReturnValue({
        ...mockUseSaveFilters,
        filters: mockFilters,
      });

      (fetchData as Mock).mockResolvedValue({
        token: "mock-token",
        data: { works: mockData },
      });

      const user = userEvent.setup();
      render(<MainEntryByDate {...defaultProps} />);

      const applyButton = screen.getByText("Aplicar filtros");
      await user.click(applyButton);

      await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith(
          "http://localhost:3000/api/entrada/data",
          { idRegional: ["1"], tipoFiltro: "day", data: "24/08/2025" },
          "mock-token"
        );
      });
    });

    it("deve chamar saveFilters ao aplicar filtros", async () => {
      (fetchData as Mock).mockResolvedValue({
        token: "mock-token",
        data: { works: mockData },
      });

      const user = userEvent.setup();
      render(<MainEntryByDate {...defaultProps} />);

      const applyButton = screen.getByText("Aplicar filtros");
      await user.click(applyButton);

      await waitFor(() => {
        expect(mockUseSaveFilters.saveFilters).toHaveBeenCalled();
      });
    });

    it("deve exibir modal de erro quando fetchData falha", async () => {
      (fetchData as Mock).mockRejectedValue(new Error("Erro na API"));

      const user = userEvent.setup();
      render(<MainEntryByDate {...defaultProps} />);

      const applyButton = screen.getByText("Aplicar filtros");
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Erro na API"
        );
      });
    });

    it("deve fechar modal de erro ao clicar em close", async () => {
      (fetchData as Mock).mockRejectedValue(new Error("Erro na API"));

      const user = userEvent.setup();
      render(<MainEntryByDate {...defaultProps} />);

      const applyButton = screen.getByText("Aplicar filtros");
      await user.click(applyButton);

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      });

      const closeButton = screen.getByText("Close");
      await user.click(closeButton);

      expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
    });
  });

  describe("handleCleaningFilters", () => {
    it("deve chamar handleCleaningFilters e limpar os filtros corretamente", async () => {
      const mockFilters = {
        date: "10/08/2024",
        filterType: "day",
      };

      (useSaveFilters as Mock).mockReturnValue({
        ...mockUseSaveFilters,
        filters: mockFilters,
      });

      (fetchData as Mock).mockResolvedValue({
        token: "mock-token",
        data: { works: mockData },
      });

      const user = userEvent.setup();
      render(<MainEntryByDate {...defaultProps} />);

      const clearButton = screen.getByText("Limpar filtros");
      await user.click(clearButton);

      await waitFor(() => {
        expect(fetchData).toHaveBeenCalledWith(
          "http://localhost:3000/api/entrada/data",
          { tipoFiltro: "day", data: "24/08/2025" },
          "mock-token"
        );
      });
    });

    it("deve chamar saveFilters ao aplicar filtros", async () => {
      (fetchData as Mock).mockResolvedValue({
        token: "mock-token",
        data: { works: mockData },
      });

      const user = userEvent.setup();
      render(<MainEntryByDate {...defaultProps} />);

      const clearButton = screen.getByText("Limpar filtros");
      await user.click(clearButton);

      await waitFor(() => {
        expect(mockUseSaveFilters.clearFilters).toHaveBeenCalled();
      });
    });
  });
});
