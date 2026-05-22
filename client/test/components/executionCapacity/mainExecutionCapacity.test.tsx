import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MainExecutionCapacity } from "@/components/executionCapacity/mainExecutionCapacity";

// =========================
// MOCKS
// =========================

const fetchDataMock = vi.fn();
const updateExecutionCapacityMock = vi.fn();
const transformMock = vi.fn((value) => value);

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: (...args: any[]) => fetchDataMock(...args),
}));

vi.mock("@/actions/executionCapacity", () => ({
  UpdateExecutionCapacity: (...args: any[]) =>
    updateExecutionCapacityMock(...args),
}));

vi.mock("@/utils/transform", () => ({
  Transform: (...args: Parameters<typeof transformMock>) =>
    transformMock(...args),
}));

vi.mock("@/utils/getButtonContent", () => ({
  getButtonContent: (_pending: boolean, text: string) => text,
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    return ({ data, setTableData }: any) => (
      <div data-testid="table-component">
        <span>Tabela</span>

        <button
          data-testid="change-table-data"
          onClick={() =>
            setTableData([
              {
                id: 1,
                jan: "99",
              },
            ])
          }
        >
          Alterar tabela
        </button>

        <button
          data-testid="change-table-data-null"
          onClick={() =>
            setTableData([
              {
                id: 1,
                jan: null,
              },
            ])
          }
        >
          Alterar para null
        </button>

        {data.map((item: any) => (
          <div key={item.id}>{item.jan}</div>
        ))}
      </div>
    );
  },
}));

vi.mock("@/components/executionCapacity/filtersExecutionCapacity", () => ({
  FiltersExecutionCapacity: ({ setSelectedItems, setTeams, setYear }: any) => (
    <div data-testid="filters-component">
      <button
        data-testid="change-filters"
        onClick={() =>
          setSelectedItems({
            regionalFiltersData: ["1"],
          })
        }
      >
        Alterar filtros
      </button>

      <button data-testid="change-teams" onClick={() => setTeams(["LM"])}>
        Alterar equipes
      </button>

      <button data-testid="change-year" onClick={() => setYear("2025")}>
        Alterar ano
      </button>
    </div>
  ),
}));

vi.mock("@/components/executionCapacity/financialValuesModal", () => ({
  FinancialValuesModal: ({ open }: any) =>
    open ? <div data-testid="financial-modal">Modal Financeiro</div> : null,
}));

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ text, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  ),
}));

vi.mock("@/components/common/Modal", () => ({
  default: ({ open, children, title }: any) =>
    open ? (
      <div data-testid="success-modal">
        <span>{title}</span>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/components/common/ErrorModal", () => ({
  default: ({ open, message, onClose }: any) =>
    open ? (
      <>
        <div data-testid="error-modal">{message}</div>
        <button onClick={onClose}>Fechar</button>
      </>
    ) : null,
}));

// =========================
// DATA
// =========================

const mockColumns = {
  regional: "Regional",
  jan: "Jan",
};

const mockData = {
  financialValues: [
    {
      regional: "Campinas",
      jan: 100,
    },
  ],
  executionCapacityValues: [
    {
      id: 1,
      regional: "Campinas",
      jan: "10",
    },
    { id: 4, regional: "Guarulhos", jan: "29" },
  ],
};

const mockFiltersData = {
  regional: [
    {
      id: "1",
      regional: "Campinas",
    },
  ],
};

const defaultProps = {
  columns: mockColumns,
  data: mockData,
  token: "token-test",
  filtersData: mockFiltersData,
};

describe("MainExecutionCapacity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar corretamente", () => {
    render(<MainExecutionCapacity {...defaultProps} />);

    expect(screen.getByTestId("filters-component")).toBeInTheDocument();

    expect(screen.getByTestId("table-component")).toBeInTheDocument();

    expect(screen.getByText("Aplicar filtros")).toBeInTheDocument();

    expect(screen.getByText("Limpar filtros")).toBeInTheDocument();

    expect(screen.getByText("Financeiro")).toBeInTheDocument();

    expect(screen.getByText("Atualizar valores")).toBeInTheDocument();
  });

  it("deve abrir modal financeiro", () => {
    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByText("Financeiro"));

    expect(screen.getByTestId("financial-modal")).toBeInTheDocument();
  });

  it("deve aplicar filtros corretamente", async () => {
    fetchDataMock.mockResolvedValue({
      success: true,
      data: mockData,
    });

    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByTestId("change-filters"));
    fireEvent.click(screen.getByTestId("change-teams"));
    fireEvent.click(screen.getByTestId("change-year"));

    fireEvent.click(screen.getByText("Aplicar filtros"));

    await waitFor(() => {
      expect(transformMock).toHaveBeenCalled();

      expect(fetchDataMock).toHaveBeenCalledWith(
        expect.stringContaining("/capacidade-execucao"),
        {
          regionalFiltersData: ["1"],
          equipe: ["LM"],
          ano: "2025",
        },
        "token-test",
        {
          cache: "no-store",
        },
      );
    });
  });

  it("deve limpar filtros corretamente", async () => {
    fetchDataMock.mockResolvedValue({
      success: true,
      data: mockData,
    });

    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByText("Limpar filtros"));

    await waitFor(() => {
      expect(fetchDataMock).toHaveBeenCalled();
    });
  });

  it("deve atualizar tabela quando os dados mudam", () => {
    const { rerender } = render(<MainExecutionCapacity {...defaultProps} />);

    expect(screen.getByText("10")).toBeInTheDocument();

    rerender(
      <MainExecutionCapacity
        {...defaultProps}
        data={{
          ...mockData,
          executionCapacityValues: [
            {
              id: 1,
              regional: "Campinas",
              jan: "50",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("50")).toBeInTheDocument();
  });

  it("deve converter valores null para null no changeset", async () => {
    updateExecutionCapacityMock.mockResolvedValue({
      success: true,
      message: "Sucesso",
    });

    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByTestId("change-table-data-null"));

    const button = screen.getByText("Atualizar valores");

    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    await waitFor(() => {
      expect(updateExecutionCapacityMock).toHaveBeenCalledWith([
        {
          id: 1,
          jan: null,
        },
      ]);
    });
  });

  it("deve habilitar botão de atualizar quando houver mudanças", () => {
    render(<MainExecutionCapacity {...defaultProps} />);

    const updateButton = screen.getByText(
      "Atualizar valores",
    ) as HTMLButtonElement;

    expect(updateButton.disabled).toBe(true);

    fireEvent.click(screen.getByTestId("change-table-data"));

    expect(updateButton.disabled).toBe(false);
  });

  it("deve salvar dados alterados com sucesso", async () => {
    updateExecutionCapacityMock.mockResolvedValue({
      success: true,
      message: "Atualizado com sucesso",
    });

    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByTestId("change-table-data"));

    fireEvent.click(screen.getByText("Atualizar valores"));

    await waitFor(() => {
      expect(updateExecutionCapacityMock).toHaveBeenCalledWith([
        {
          id: 1,
          jan: 99,
        },
      ]);

      expect(screen.getByTestId("success-modal")).toBeInTheDocument();

      expect(screen.getByText("Atualizado com sucesso")).toBeInTheDocument();
    });
  });

  it("deve exibir erro quando UpdateExecutionCapacity falhar", async () => {
    updateExecutionCapacityMock.mockResolvedValue({
      success: false,
      message: "Erro ao atualizar",
    });

    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByTestId("change-table-data"));

    fireEvent.click(screen.getByText("Atualizar valores"));

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();

      expect(screen.getByText("Erro ao atualizar")).toBeInTheDocument();
    });
  });

  it("deve exibir erro quando fetchData falhar", async () => {
    fetchDataMock.mockResolvedValue({
      success: false,
      message: "Erro na busca",
    });

    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByText("Aplicar filtros"));

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();

      expect(screen.getByText("Erro na busca")).toBeInTheDocument();
    });
  });

  it("deve exibir erro quando fetchData falhar e fechar modal", async () => {
    fetchDataMock.mockResolvedValue({
      success: false,
      message: "Erro na busca",
    });

    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByText("Aplicar filtros"));

    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();

      expect(screen.getByText("Erro na busca")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Fechar"));

    await waitFor(() => {
      expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
    });
  });

  it("deve tratar exceção no fetchData", async () => {
    fetchDataMock.mockRejectedValue(new Error("Erro inesperado fetch"));

    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByText("Aplicar filtros"));

    await waitFor(() => {
      expect(screen.getByText("Erro inesperado fetch")).toBeInTheDocument();
    });
  });

  it("deve tratar exceção no UpdateExecutionCapacity", async () => {
    updateExecutionCapacityMock.mockRejectedValue(
      new Error("Erro inesperado update"),
    );

    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByTestId("change-table-data"));

    fireEvent.click(screen.getByText("Atualizar valores"));

    await waitFor(() => {
      expect(screen.getByText("Erro inesperado update")).toBeInTheDocument();
    });
  });

  it("deve abrir e fechar modal financeiro", () => {
    render(<MainExecutionCapacity {...defaultProps} />);

    fireEvent.click(screen.getByText("Financeiro"));

    expect(screen.getByTestId("financial-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Financeiro"));

    expect(screen.queryByTestId("financial-modal")).not.toBeInTheDocument();
  });
});
