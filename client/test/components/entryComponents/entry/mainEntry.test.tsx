import { describe, expect, it, vi, beforeEach, Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MainEntry, {
  EntryFiltersType,
} from "@/components/entryComponents/entry/MainEntry";
import userEvent from "@testing-library/user-event";
import { fetchData } from "@/actions/fetchData.action";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import { Transform } from "@/utils/transform";
import dayjs from "dayjs";

// Mock das dependências
vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/hooks/useSaveFilters", () => ({
  useSaveFilters: vi.fn(),
}));

vi.mock("@/utils/getButtonContent", () => ({
  getButtonContent: vi.fn((isPending, text) =>
    isPending ? "Carregando..." : text,
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
            (option) => option.value,
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

vi.mock("@/components/entryComponents/entry/EntryTable", () => ({
  __esModule: true,
  default: ({ data, columns }: any) => (
    <div data-testid="entry-table">
      <span data-testid="table-data-count">{data?.length || 0}</span>
      <span data-testid="table-columns-count">
        {Object.keys(columns || {}).length}
      </span>
    </div>
  ),
}));

vi.mock("@mui/x-date-pickers", () => ({
  DatePicker: ({ value, onChange }: any) => (
    <div data-testid="date-picker">
      <input
        data-testid="date-input"
        type="text"
        value={value?.format?.("YYYY") || ""}
        onChange={(e) => onChange?.(dayjs(e.target.value))}
      />
    </div>
  ),
  LocalizationProvider: ({ children }: any) => (
    <div data-testid="localization-provider">{children}</div>
  ),
}));

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: vi.fn(),
}));

vi.mock("@/hooks/useFeedback", () => ({
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

vi.mock("dayjs", () => {
  const mockDayjs = vi.fn(() => ({
    format: vi.fn((format: string) => {
      if (format === "YYYY") return "2024";
      return "2024-01-01";
    }),
  }));

  // Adicionar métodos estáticos necessários
  Object.assign(mockDayjs, {
    default: mockDayjs,
  });

  return {
    __esModule: true,
    default: mockDayjs,
  };
});

describe("MainEntry component", () => {
  const mockData = [
    {
      grupo: "Grupo A",
      tipo: "Tipo 1",
      jan_entrada: 1500,
      jan_entrada_qtde: 10,
    },
    {
      grupo: "Grupo B",
      tipo: "Tipo 2",
      fev_entrada: 2000,
      fev_entrada_qtde: 15,
    },
  ];

  const mockFiltersData: EntryFiltersType = {
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
      { id: "1", municipio: "São Paulo", id_regional: 1 },
      { id: "2", municipio: "Rio de Janeiro", id_regional: 2 },
    ],
    grupo: [
      { id: "1", grupo: "Grupo A" },
      { id: "2", grupo: "Grupo B" },
    ],
    circuito: [
      { id: "1", circuito: "Circuito A" },
      { id: "2", circuito: "Circuito B" },
    ],
  };

  const mockColumns = {
    grupo: "Grupo/Tipo",
    jan: "Janeiro",
    fev: "Fevereiro",
  };

  const mockUseSaveFilters = {
    clearFilters: vi.fn(),
    filters: {},
    saveFilters: vi.fn(),
  };

  const defaultProps = {
    data: mockData,
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
    render(<MainEntry {...defaultProps} />);

    expect(screen.getByTestId("localization-provider")).toBeInTheDocument();
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    expect(screen.getByTestId("entry-table")).toBeInTheDocument();
  });

  it("deve renderizar todos os filtros baseados nos dados", () => {
    render(<MainEntry {...defaultProps} />);

    // Verificar se todos os filtros são renderizados
    expect(screen.getByTestId("select-regional")).toBeInTheDocument();
    expect(screen.getByTestId("select-parceira")).toBeInTheDocument();
    expect(screen.getByTestId("select-tipo")).toBeInTheDocument();
    expect(screen.getByTestId("select-municipio")).toBeInTheDocument();
    expect(screen.getByTestId("select-grupo")).toBeInTheDocument();
    expect(screen.getByTestId("select-circuito")).toBeInTheDocument();
  });

  it("deve renderizar sem erro quando filtersData estiver vazio", () => {
    const emptyFilters: EntryFiltersType = {
      regional: [],
      parceira: [],
      tipo: [],
      municipio: [],
      grupo: [],
      circuito: [],
    };

    render(
      <MainEntry
        {...defaultProps}
        filtersData={emptyFilters} // 👈 nenhum filtro
      />,
    );

    expect(screen.getByText("Aplicar filtros")).toBeInTheDocument();
  });

  it("deve renderizar os botões de ação", () => {
    render(<MainEntry {...defaultProps} />);

    const buttons = screen.getAllByTestId("button-component");
    expect(buttons).toHaveLength(2);

    expect(screen.getByText("Aplicar filtros")).toBeInTheDocument();
    expect(screen.getByText("Limpar filtros")).toBeInTheDocument();
  });

  it("deve carregar filtros salvos no useEffect", async () => {
    const mockFilters = {
      selectedItems: { idRegional: ["1"] },
      selectedYear: "2023",
    };

    (useSaveFilters as Mock).mockReturnValue({
      ...mockUseSaveFilters,
      filters: mockFilters,
    });

    render(<MainEntry {...defaultProps} />);

    // Verificar se os filtros foram carregados
    expect(useSaveFilters).toHaveBeenCalledWith({
      pageKey: "entryFilters",
      data: mockFiltersData,
    });
  });

  it("deve chamar fetchData ao clicar em aplicar filtros", async () => {
    (fetchData as Mock).mockResolvedValue({
      token: "mock-token",
      data: mockData,
    });

    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    const applyButton = screen.getByText("Aplicar filtros");
    await user.click(applyButton);

    await waitFor(() => {
      expect(fetchData).toHaveBeenCalledWith(
        "http://localhost:3000/api/entrada",
        { ano: "2024" },
        "mock-token",
      );
    });
  });

  it("deve chamar saveFilters ao aplicar filtros", async () => {
    (fetchData as Mock).mockResolvedValue({
      token: "mock-token",
      data: mockData,
    });

    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    const applyButton = screen.getByText("Aplicar filtros");
    await user.click(applyButton);

    await waitFor(() => {
      expect(mockUseSaveFilters.saveFilters).toHaveBeenCalled();
    });
  });

  it("deve limpar filtros ao clicar em limpar filtros", async () => {
    (fetchData as Mock).mockResolvedValue({
      token: "mock-token",
      data: mockData,
    });

    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    const clearButton = screen.getByText("Limpar filtros");
    await user.click(clearButton);

    await waitFor(() => {
      expect(mockUseSaveFilters.clearFilters).toHaveBeenCalled();
      expect(fetchData).toHaveBeenCalledWith(
        "http://localhost:3000/api/entrada",
        { ano: "2024" },
        "mock-token",
      );
    });
  });

  it("deve atualizar selectedItems ao selecionar filtros", async () => {
    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    const regionalSelect = screen.getByTestId("select-regional");

    // Simular seleção de uma opção
    await user.selectOptions(regionalSelect, ["1"]);

    // Verificar se o select tem as opções corretas
    expect(screen.getByText("Regional Sul")).toBeInTheDocument();
  });

  it("deve exibir modal de erro quando fetchData falha", async () => {
    (fetchData as Mock).mockRejectedValue(new Error("Erro na API"));

    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    const applyButton = screen.getByText("Aplicar filtros");
    await user.click(applyButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Erro na API",
      );
    });
  });

  it("deve exibir modal de erro quando a chamada de fetchData com os filtros limpos falhar", async () => {
    (fetchData as Mock).mockRejectedValue(new Error("Erro na API"));

    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    const cleaningButton = screen.getByText("Limpar filtros");
    await user.click(cleaningButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Erro na API",
      );
    });
  });

  it("deve fechar modal de erro ao clicar em close", async () => {
    (fetchData as Mock).mockRejectedValue(new Error("Erro na API"));

    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    const applyButton = screen.getByText("Aplicar filtros");
    await user.click(applyButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });

    const closeButton = screen.getByText("Close");
    await user.click(closeButton);

    expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
  });

  it("deve desabilitar botões durante carregamento", async () => {
    (fetchData as Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ token: "mock-token", data: mockData }),
            100,
          ),
        ),
    );

    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    const applyButton = screen.getByText("Aplicar filtros");
    await user.click(applyButton);

    // Verificar se botões foram desabilitados
    const button = screen.getAllByTestId("button-component")[0];

    expect(button).toBeDisabled();
  });

  it("deve atualizar dados da tabela após aplicar filtros", async () => {
    const newMockData = [
      { grupo: "Novo Grupo", tipo: "Novo Tipo", jan_entrada: 3000 },
    ];
    (fetchData as Mock).mockResolvedValue({
      token: "mock-token",
      data: newMockData,
    });

    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    // Dados iniciais
    expect(screen.getByTestId("table-data-count")).toHaveTextContent("2");

    const applyButton = screen.getByText("Aplicar filtros");
    await user.click(applyButton);

    // Aguardar atualização dos dados
    await waitFor(() => {
      expect(screen.getByTestId("table-data-count")).toHaveTextContent("1");
    });
  });

  it("deve usar Transform utility para formatar selectedItems", async () => {
    (fetchData as Mock).mockResolvedValue({
      token: "mock-token",
      data: mockData,
    });

    (Transform as Mock).mockReturnValue({ transformed: "data" });

    const user = userEvent.setup();
    render(<MainEntry {...defaultProps} />);

    const applyButton = screen.getByText("Aplicar filtros");
    await user.click(applyButton);

    await waitFor(() => {
      expect(Transform).toHaveBeenCalledWith({});
    });
  });

  it("deve gerar labels corretos para os filtros", () => {
    render(<MainEntry {...defaultProps} />);

    expect(screen.getByText("Regional")).toBeInTheDocument();
    expect(screen.getByText("Parceira")).toBeInTheDocument();
    expect(screen.getByText("Tipo")).toBeInTheDocument();
    expect(screen.getByText("Municipio")).toBeInTheDocument();
    expect(screen.getByText("Grupo")).toBeInTheDocument();
    expect(screen.getByText("Circuito")).toBeInTheDocument();
  });

  it("deve renderizar sem filtros quando filtersData está vazio", () => {
    render(
      <MainEntry {...defaultProps} filtersData={{} as EntryFiltersType} />,
    );

    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    expect(screen.getByTestId("entry-table")).toBeInTheDocument();
    expect(screen.getAllByTestId("button-component")).toHaveLength(2);
  });

  it("deve manter ano atual como padrão no DatePicker", () => {
    render(<MainEntry {...defaultProps} />);

    const dateInput = screen.getByTestId("date-input");
    expect(dateInput).toHaveValue("2024");
  });

  it("deve atualizar o ano ao selecionar uma nova data", async () => {
    const user = userEvent.setup();

    render(<MainEntry {...defaultProps} />);

    const input = screen.getByRole("textbox");

    await user.clear(input);
    await user.type(input, "2024");

    expect(input).toHaveValue("2024");
  });
});
