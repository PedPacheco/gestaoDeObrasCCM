import { InsertWorks } from "@/actions/works";
import { InsertMarketWorksButton } from "@/components/entryComponents/importMarketWorks/insertButton";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ text, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  ),
}));

vi.mock("@/components/common/ErrorModal", () => ({
  default: ({ open, message, onClose, icon }: any) =>
    open ? (
      <div data-testid="error-modal">
        <p>{message}</p>
        <button onClick={onClose} data-testid="error-close">
          Fechar
        </button>
        {icon}
      </div>
    ) : null,
}));

vi.mock("@/components/common/Modal", () => ({
  default: ({ open, children, onClose, title }: any) =>
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
        <button onClick={onClose} data-testid="modal-close">
          Fechar
        </button>
      </div>
    ) : null,
}));

vi.mock("@/actions/works", () => ({
  InsertWorks: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    refresh: vi.fn(),
  })),
}));

describe("InsertButton component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o botão", () => {
    render(<InsertMarketWorksButton storageKey="notesEntryData" />);

    expect(screen.getByText("Inserir Notas")).toBeInTheDocument();
  });

  it("deve chamar InsertWorks com os dados das notas formatados, e se for retornado sucesso, fechar a modal de sucesso", async () => {
    const user = userEvent.setup();
    vi.mocked(InsertWorks).mockResolvedValue({
      success: true,
      message: "Obra inserida com sucesso",
    });

    const mockData = JSON.stringify([
      {
        obra: "OBRA-001",
        entrada: "2025-08-26",
        prazo: "2025-09-10",
        referencia: "REF-123",
        municipio: "São Paulo",
        empreendimento: "Empreendimento A",
        tipo: "Residencial",
        parceira: "Turma X",
        circuito: "Circuito 1",
        tecnico: "João Silva",
        anoplan: "2025",
      },
    ]);

    const response = [
      {
        obra: "OBRA-001",
        entrada: "2025-08-26",
        prazo: "2025-09-10",
        referencia: "REF-123",
        aux_gpm: "São Paulo",
        aux_empreendimento: "Empreendimento A",
        aux_tipo: "Residencial",
        aux_turma: "Turma X",
        aux_circuito: "Circuito 1",
        aux_tecnico: "João Silva",
        anoplan: 2025,
      },
    ];

    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => {
      if (key === "notesEntryData") return mockData;
      return null;
    });

    render(<InsertMarketWorksButton storageKey="notesEntryData" />);
    await user.click(screen.getByText("Inserir Notas"));

    await waitFor(() => {
      expect(InsertWorks).toHaveBeenCalledWith(response, "notesEntryData");
    });
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();

    const closeButton = screen.getByTestId("modal-close");
    await user.click(closeButton);

    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("deve chamar InsertWorks com os dados das obras de mercado formatados", async () => {
    const user = userEvent.setup();
    vi.mocked(InsertWorks).mockResolvedValue({
      success: true,
      message: "Obra inserida com sucesso",
    });

    const mockData = JSON.stringify([
      {
        obra: "Obra de expansão elétrica",
        pep: "PEP123456",
        diagrama: "DIA-001",
        entrada: "2025-08-26",
        municipio: 42,
        tipo: 3,
        circuito: 7,
        prazoTexto: "30 dias",
        referencia: "EQP-2025-01",
        statusOv: "Em andamento",
        statusDiagrama: "Aprovado",
        statusPep: "Validado",
        moCliente: 10000,
        moEmpresa: 8500,
        observacao: "Obra em fase de execução, aguardando materiais.",
        parceira: 12,
      },
    ]);

    const response = [
      {
        obra: "Obra de expansão elétrica",
        pep: "PEP123456",
        diagrama: "DIA-001",
        entrada: "2025-08-26",
        idMunicipio: 42,
        idTipo: 3,
        idCircuito: 7,
        prazoTexto: "30 dias",
        equipeNumPedido: "EQP-2025-01",
        statusOv: "Em andamento",
        statusDiagrama: "Aprovado",
        statusPep: "Validado",
        moCliente: 10000,
        moEmpresa: 8500,
        observacao: "Obra em fase de execução, aguardando materiais.",
        idParceira: 12,
      },
    ];

    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => {
      if (key === "marketEntryData") return mockData;
      return null;
    });

    render(<InsertMarketWorksButton storageKey="marketEntryData" />);
    await user.click(screen.getByText("Inserir obras de mercado"));

    await waitFor(() => {
      expect(InsertWorks).toHaveBeenCalledWith(response, "marketEntryData");
    });
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
  });

  it("não deve quebrar caso não haja dados no localStorage", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => null);

    vi.mocked(InsertWorks).mockResolvedValue({
      success: true,
      message: "Nenhuma obra inserida",
    });

    render(<InsertMarketWorksButton storageKey="marketEntryData" />);

    await user.click(screen.getByText("Inserir obras de mercado"));

    await waitFor(() => {
      expect(InsertWorks).toHaveBeenCalledWith([], "marketEntryData");
    });
    expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
  });

  it("deve renderizar a modal de erro ao insertWorks retornar um erro ao inserir obra", async () => {
    const user = userEvent.setup();
    vi.mocked(InsertWorks).mockResolvedValue({
      success: false,
      error: "Erro ao inserir obra",
    });

    const mockData = JSON.stringify([
      {
        obra: "OBRA-001",
        entrada: "2025-08-26",
        prazo: "2025-09-10",
        referencia: "REF-123",
        municipio: "São Paulo",
        empreendimento: "Empreendimento A",
        tipo: "Residencial",
        parceira: "Turma X",
        circuito: "Circuito 1",
        tecnico: "João Silva",
        anoplan: 2025,
      },
    ]);

    const response = [
      {
        obra: "OBRA-001",
        entrada: "2025-08-26",
        prazo: "2025-09-10",
        referencia: "REF-123",
        aux_gpm: "São Paulo",
        aux_empreendimento: "Empreendimento A",
        aux_tipo: "Residencial",
        aux_turma: "Turma X",
        aux_circuito: "Circuito 1",
        aux_tecnico: "João Silva",
        anoplan: 2025,
      },
    ];

    vi.spyOn(Storage.prototype, "getItem").mockImplementation((key: string) => {
      if (key === "notesEntryData") return mockData;
      return null;
    });

    render(<InsertMarketWorksButton storageKey="notesEntryData" />);
    await user.click(screen.getByText("Inserir Notas"));

    await waitFor(() => {
      expect(InsertWorks).toHaveBeenCalledWith(response, "notesEntryData");
    });
    expect(screen.getByTestId("error-modal")).toBeInTheDocument();
  });

  it("deve renderizar a modal de erro caso aconteça um erro ao inserir obra", async () => {
    const user = userEvent.setup();
    vi.mocked(InsertWorks).mockRejectedValue(new Error("Network error"));

    render(<InsertMarketWorksButton storageKey="notesEntryData" />);
    await user.click(screen.getByText("Inserir Notas"));

    await waitFor(() => {
      expect(InsertWorks).toHaveBeenCalledWith([], "notesEntryData");
    });
    expect(screen.getByTestId("error-modal")).toBeInTheDocument();
  });

  it("deve fechar o modal de erro ao clicar em close", async () => {
    const user = userEvent.setup();
    render(<InsertMarketWorksButton storageKey="notesEntryData" />);

    await user.click(screen.getByText("Inserir Notas"));
    await waitFor(() => {
      expect(screen.getByTestId("error-modal")).toBeInTheDocument();
    });

    const closeButton = screen.getByTestId("error-close");
    await user.click(closeButton);

    expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
  });
});
