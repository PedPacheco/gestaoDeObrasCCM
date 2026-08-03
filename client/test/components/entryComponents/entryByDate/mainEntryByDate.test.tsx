import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MainEntryByDate from "@/components/entryComponents/entryByDate/MainEntryByDate";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import dayjs from "dayjs";

// ---------------------------
// Mock do dayjs
// ---------------------------

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: vi.fn(),
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
vi.mock("dayjs", async () => {
  const actual = await vi.importActual<any>("dayjs");
  return actual;
});

// ---------------------------
// Mocks dos módulos
// ---------------------------
const mockFetchData = vi.fn();

const fixedFilters = {
  selectedItems: {},
  startDate: "2024-01-10",
  endDate: "2024-01-20",
};

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: (...args: any[]) => mockFetchData(...args),
}));

vi.mock("@/hooks/useSaveFilters", () => ({
  useSaveFilters: vi.fn(),
}));

vi.mock("@/components/common/MultipleSelect", () => ({
  MultipleSelectComponent: ({ label, setSelectedItem }: any) => (
    <button
      data-testid={`select-${label}`}
      onClick={() => setSelectedItem(["1"])}
    >
      {label}
    </button>
  ),
}));

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ text, onClick }: any) => (
    <button onClick={onClick}>{text}</button>
  ),
}));

vi.mock("@/components/common/ErrorModal", () => ({
  default: ({ message, onClose }: any) => (
    <div>
      <span data-testid="error-modal">{message}</span>
      <button onClick={onClose}>fechar</button>
    </div>
  ),
}));

vi.mock("@/components/entryComponents/entryByDate/entryByDateTable", () => ({
  default: () => <div data-testid="table">Tabela Renderizada</div>,
}));

vi.mock("@/hooks/useFeedback", () => ({
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

// ---------------------------
// Dados para os testes
// ---------------------------
const mockData = { works: [] };

const mockFiltersData = {
  regional: [{ id: "1", regional: "Sul" }],
  parceira: [{ id: "1", turma: "A" }],
  tipo: [{ id: "1", tipo_obra: "Residencial", id_grupo: 2 }],
  municipio: [{ id: "1", municipio: "Curitiba", id_regional: 1 }],
  grupo: [{ id: "1", grupo: "Grupo A" }],
};

const mockColumns = {
  ovnota: "Ovnota",
  pep: "Pep",
  diagrama: "Diagrama",
  ordem_dci: "Ordem DCI",
  ordem_dcd: "Ordem DCD",
  ordem_dca: "Ordem DCA",
  ordem_dcim: "Ordem DCIM",
  entrada: "Entrada",
  prazo: "Prazo",
  prazo_fim: "Prazo Fim",
  qtde_planejada: "Qtde Planejada",
  mo_planejada: "MO Planejada",
  observ_obra: "Observação",
  tipo_obra: "Tipo de Obra",
  turma: "Turma",
  mun: "Município",
  total_obras: "Total Obras",
  total_mo_planejada: "Total MO Planejada",
  total_qtde_planejada: "Total Qtde Planejada",
};

function setup() {
  return render(
    <MainEntryByDate
      data={mockData}
      filtersData={mockFiltersData}
      columns={mockColumns}
      token="fake-token"
    />,
  );
}

// ---------------------------
// Testes
// ---------------------------
describe("MainEntryByDate (Vitest)", () => {
  beforeEach(() => {
    (useSaveFilters as Mock).mockReturnValue({
      filters: fixedFilters,
      saveFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    mockFetchData.mockReset();
  });

  it("renderiza selects e datepickers corretamente", () => {
    setup();

    expect(screen.getAllByTestId(/select-/).length).toBe(5);

    expect(screen.getAllByTestId("date-input")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("date-input")[0]).toBeInTheDocument();
  });

  it("chama fetchData ao aplicar filtros", async () => {
    mockFetchData.mockResolvedValue({ data: { works: [{ id: 1 }] } });

    setup();

    await userEvent.click(screen.getByText("Aplicar filtros"));

    await waitFor(() => {
      expect(mockFetchData).toHaveBeenCalledTimes(1);
    });
  });

  it("limpa filtros corretamente", async () => {
    mockFetchData.mockResolvedValue({ data: { works: [] } });

    setup();

    await userEvent.click(screen.getByText("Limpar filtros"));

    await waitFor(() => {
      expect(mockFetchData).toHaveBeenCalledTimes(1);
    });
  });

  it("exibe modal de erro quando fetch falha", async () => {
    mockFetchData.mockRejectedValue(new Error("Erro inesperado"));

    setup();

    await userEvent.click(screen.getByText("Aplicar filtros"));

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toHaveTextContent(
        "Erro inesperado",
      );
    });
  });

  it("carrega startDate e endDate corretamente do filtro", () => {
    const mockFilters = {
      selectedItems: {},
      startDate: "2024-01-10",
      endDate: "2024-01-20",
    };

    (useSaveFilters as Mock).mockReturnValue({
      filters: mockFilters,
      saveFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    setup();

    expect(screen.getAllByTestId("date-input")[0]).toBeInTheDocument();
  });

  it("não quebra quando não há filtros salvos", () => {
    (useSaveFilters as Mock).mockReturnValue({
      filters: {
        // 👇 selectedItems ausente
      },
      saveFilters: vi.fn(),
      clearFilters: vi.fn(),
    });

    setup();

    expect(screen.getByText("Aplicar filtros")).toBeInTheDocument();
    expect(screen.getAllByTestId("date-input")[0]).toBeInTheDocument();
    expect(screen.getAllByTestId("date-input")[1]).toBeInTheDocument();
  });

  it("envia parâmetros formatados corretamente ao aplicar filtros", async () => {
    mockFetchData.mockResolvedValue({ data: { works: [] } });

    const saveFiltersMock = vi.fn();

    (useSaveFilters as Mock).mockReturnValue({
      filters: fixedFilters,
      saveFilters: saveFiltersMock,
      clearFilters: vi.fn(),
    });

    setup();

    await userEvent.click(screen.getByText("Aplicar filtros"));

    await waitFor(() => {
      expect(saveFiltersMock).toHaveBeenCalled();
      expect(mockFetchData).toHaveBeenCalledWith(
        expect.stringContaining("/entrada/data"),
        expect.objectContaining({
          dataInicial: expect.any(String),
          dataFinal: expect.any(String),
        }),
        "fake-token",
      );
    });
  });

  it("envia parâmetros formatados corretamente sem as datas ao aplicar filtros", async () => {
    mockFetchData.mockResolvedValue({ data: { works: [] } });

    const saveFiltersMock = vi.fn();

    (useSaveFilters as Mock).mockReturnValue({
      filters: { selectedItems: fixedFilters.selectedItems },
      saveFilters: saveFiltersMock,
      clearFilters: vi.fn(),
    });

    setup();

    await userEvent.click(screen.getByText("Aplicar filtros"));

    await waitFor(() => {
      expect(saveFiltersMock).toHaveBeenCalled();
      expect(mockFetchData).toHaveBeenCalledWith(
        expect.stringContaining("/entrada/data"),
        expect.objectContaining({
          dataInicial: null,
          dataFinal: null,
        }),
        "fake-token",
      );
    });
  });

  it("chama clearFilters ao limpar filtros", async () => {
    const clearFiltersMock = vi.fn();

    (useSaveFilters as Mock).mockReturnValue({
      filters: fixedFilters,
      saveFilters: vi.fn(),
      clearFilters: clearFiltersMock,
    });

    mockFetchData.mockResolvedValue({ data: { works: [] } });

    setup();

    await userEvent.click(screen.getByText("Limpar filtros"));

    await waitFor(() => {
      expect(clearFiltersMock).toHaveBeenCalled();
      expect(mockFetchData).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          dataInicial: expect.any(String),
          dataFinal: expect.any(String),
        }),
        "fake-token",
      );
    });
  });

  it("atualiza selectedItems ao selecionar filtro", async () => {
    setup();

    const select = screen.getAllByTestId(/select-/)[0];

    await userEvent.click(select);

    expect(select).toBeInTheDocument();
  });

  it("não renderiza select quando lista está vazia", () => {
    const emptyFilters = {
      ...mockFiltersData,
      regional: [],
    };

    render(
      <MainEntryByDate
        data={mockData}
        filtersData={emptyFilters}
        columns={mockColumns}
        token="fake-token"
      />,
    );

    // um select a menos
    expect(screen.getAllByTestId(/select-/).length).toBe(4);
  });

  it("fecha modal de erro ao clicar em fechar", async () => {
    mockFetchData.mockRejectedValue(new Error("Erro"));

    setup();

    await userEvent.click(screen.getByText("Aplicar filtros"));

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("fechar"));

    await waitFor(() => {
      expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
    });
  });

  it("atualiza valores dos campos de data", () => {
    setup();

    const [startInput, endInput] = screen.getAllByTestId("date-input");

    fireEvent.change(startInput, { target: { value: "2025" } });
    fireEvent.change(endInput, { target: { value: "2026" } });

    expect(startInput).toHaveValue("2025");
    expect(endInput).toHaveValue("2026");
  });
});
