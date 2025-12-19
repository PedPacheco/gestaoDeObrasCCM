import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MainEntryByDate from "@/components/entryComponents/entryByDate/MainEntryByDate";

// ---------------------------
// Mock do dayjs
// ---------------------------

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: vi.fn(),
}));

vi.mock("@mui/x-date-pickers", () => ({
  LocalizationProvider: ({ children }: any) => <div>{children}</div>,
  DatePicker: ({ label }: any) => (
    <input aria-label={label} data-testid={label} />
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

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: (...args: any[]) => mockFetchData(...args),
}));

const fixedFilters = {
  selectedItems: {},
  startDate: "2024-01-10",
  endDate: "2024-01-20",
};

vi.mock("@/hooks/useSaveFilters", () => ({
  useSaveFilters: () => ({
    filters: fixedFilters,
    saveFilters: vi.fn(),
    clearFilters: vi.fn(),
  }),
}));

vi.mock("@/components/common/MultipleSelect", () => ({
  MultipleSelectComponent: ({ label }: any) => (
    <div data-testid="mock-select">{label}</div>
  ),
}));

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ text, onClick }: any) => (
    <button onClick={onClick}>{text}</button>
  ),
}));

vi.mock("@/components/common/ErrorModal", () => ({
  default: ({ message }: any) => <div data-testid="error-modal">{message}</div>,
}));

vi.mock("@/components/entryComponents/entryByDate/entryByDateTable", () => ({
  default: () => <div data-testid="table">Tabela Renderizada</div>,
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
    />
  );
}

// ---------------------------
// Testes
// ---------------------------
describe("MainEntryByDate (Vitest)", () => {
  beforeEach(() => {
    mockFetchData.mockReset();
  });

  it("renderiza selects e datepickers corretamente", () => {
    setup();

    expect(screen.getAllByTestId("mock-select").length).toBe(5);

    expect(screen.getByLabelText("Data Inicial")).toBeInTheDocument();
    expect(screen.getByLabelText("Data Final")).toBeInTheDocument();
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
        "Erro inesperado"
      );
    });
  });

  // it("carrega filtros salvos via useEffect", () => {
  //   setup();

  //   const start = screen.getByLabelText("Data Inicial") as HTMLInputElement;
  //   const end = screen.getByLabelText("Data Final") as HTMLInputElement;

  //   expect(start.value).toBe("10/01/2024");
  //   expect(end.value).toBe("20/01/2024");
  // });
});
