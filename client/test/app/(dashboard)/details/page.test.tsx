import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Details from "@/app/(dashboard)/detalhes/[id]/page";
import { fetchData } from "@/actions/fetchData.action";
import * as cookiesModule from "next/headers";
import dayjs from "dayjs";
import { formatPercentage } from "@/utils/formatValue";

// Mocks
vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/components/details/dataItem", () => ({
  __esModule: true,
  default: vi.fn(({ label, value, status, background }) => (
    <div
      data-testid="data-item"
      data-label={label}
      data-value={value}
      data-status={status}
      data-background={background}
    >
      {label}: {value}
    </div>
  )),
}));

vi.mock("@/components/details/TabPanel", () => ({
  __esModule: true,
  default: vi.fn(({ props }) => (
    <div data-testid="tab-panel" data-props={JSON.stringify(props)}>
      TabPanel
    </div>
  )),
}));

vi.mock("@/utils/formatValue", () => ({
  formatPercentage: vi.fn((value) => `${value}%`),
}));

describe("Details Page", () => {
  const mockId = "123";
  const mockCookieStore = {
    get: vi.fn(() => ({ value: "mock-token" })),
  };

  const mockData = {
    ovnota: "OV12345",
    tipos: "Tipo teste",
    municipios: "Cidade Teste",
    referencia: "Ref-123",
    circuitos: "Circuito-A",
    conjunto: "Conjunto-1",
    pep: "PEP123",
    status_pep: "concluido",
    diagrama: "Diagrama-1",
    status_diagrama: "pendente",
    ordem_dci: "DCI-123",
    status_170: "em_andamento",
    ordem_dcd: "DCD-123",
    status_190: "concluido",
    ordem_dca: "DCA-123",
    status_150: "pendente",
    ordem_dcim: "DCIM-123",
    status_180: "concluido",
    entrada: "2023-05-15T10:00:00",
    prazo: 30,
    data_empreitamento: "2023-05-20T10:00:00",
    tipo_ads: "ADS-Tipo-1",
    ano_plan: 2025,
    grupo: 2,
    turmas: "Parceira XYZ",
    status_ov_sap: "Ativo",
    status: "Em andamento",
    empreendimento: "Empreendimento-1",
    executado: 75,
    data_conclusao: "2023-06-15T10:00:00",
    observ_obra: "Observação de teste para a obra",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock de cookies
    vi.mocked(cookiesModule.cookies).mockReturnValue(mockCookieStore as any);

    // Mock de fetchData
    vi.mocked(fetchData).mockResolvedValue({
      token: "mock-token",
      data: mockData,
    });

    // Mock do env
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  it("deve buscar os dados da API com o ID correto", async () => {
    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/obras/123",
      undefined,
      "mock-token"
    );
  });

  it("deve renderizar todos os DataItems com valores corretos", async () => {
    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const dataItems = screen.getAllByTestId("data-item");
    expect(dataItems.length).toBe(24); // Verificar o número total de DataItems

    // Verificar alguns DataItems específicos
    const ovNotaItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Ov/Nota"
    );
    expect(ovNotaItem).toHaveAttribute("data-value", "OV12345");

    const pepItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Pep"
    );
    expect(pepItem).toHaveAttribute("data-value", "PEP123");
    expect(pepItem).toHaveAttribute("data-status", "concluido");

    // Verificar formatação de datas
    const entradaFormatada = dayjs(mockData.entrada).format("DD/MM/YYYY");
    const entradaItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Entrada"
    );
    expect(entradaItem).toHaveAttribute("data-value", entradaFormatada);

    // Verificar prazo final calculado
    const prazoFinalFormatado = dayjs(mockData.entrada)
      .add(mockData.prazo, "day")
      .format("DD/MM/YYYY");
    const prazoFinalItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Data prazo final"
    );
    expect(prazoFinalItem).toHaveAttribute("data-value", prazoFinalFormatado);

    // Verificar valor formatado com percentual
    expect(formatPercentage).toHaveBeenCalledWith(75);
    const executadoItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Executado"
    );
    expect(executadoItem).toHaveAttribute("data-value", "75%");
  });

  it("deve aplicar o background correto para Ano Planejamento quando grupo=2 e ano_plan é o ano atual", async () => {
    const currentYear = dayjs().year();
    const modifiedData = { ...mockData, grupo: 2, ano_plan: currentYear };
    vi.mocked(fetchData).mockResolvedValueOnce({
      token: "mock-token",
      data: modifiedData,
    });

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const dataItems = screen.getAllByTestId("data-item");
    const anoPlanItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Ano planejamento"
    );
    expect(anoPlanItem).toHaveAttribute("data-background", "bg-green-600");
  });

  it("deve aplicar o background vermelho para Ano Planejamento quando grupo=2 e ano_plan não é o ano atual", async () => {
    const modifiedData = {
      ...mockData,
      grupo: 2,
      ano_plan: dayjs().year() - 1,
    };
    vi.mocked(fetchData).mockResolvedValueOnce({
      token: "mock-token",
      data: modifiedData,
    });

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const dataItems = screen.getAllByTestId("data-item");
    const anoPlanItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Ano planejamento"
    );
    expect(anoPlanItem).toHaveAttribute(
      "data-background",
      "bg-red-600 text-zinc-100"
    );
  });

  it("não deve aplicar background para Ano Planejamento quando grupo !== 2", async () => {
    const modifiedData = { ...mockData, grupo: 1, ano_plan: dayjs().year() };
    vi.mocked(fetchData).mockResolvedValueOnce({
      token: "mock-token",
      data: modifiedData,
    });

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const dataItems = screen.getAllByTestId("data-item");
    const anoPlanItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Ano planejamento"
    );
    expect(anoPlanItem).toHaveAttribute("data-background", "");
  });

  it("deve renderizar a observação corretamente", async () => {
    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    expect(screen.getByText("Observação")).toBeInTheDocument();
    expect(screen.getByText(mockData.observ_obra)).toBeInTheDocument();
  });

  it("deve passar os dados corretos para o componente TabPanel", async () => {
    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const tabPanel = screen.getByTestId("tab-panel");
    expect(tabPanel).toBeInTheDocument();
    expect(JSON.parse(tabPanel.getAttribute("data-props") || "{}")).toEqual(
      mockData
    );
  });

  it("deve lidar com valores nulos para data_conclusao e data_empreitamento", async () => {
    const modifiedData = {
      ...mockData,
      data_conclusao: null,
      data_empreitamento: null,
    };
    vi.mocked(fetchData).mockResolvedValueOnce({
      token: "mock-token",
      data: modifiedData,
    });

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const dataItems = screen.getAllByTestId("data-item");
    const dataConclItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Data conclusão"
    );
    const dataEmpreitItem = dataItems.find(
      (item) => item.getAttribute("data-label") === "Data empreitamento"
    );

    expect(dataConclItem?.getAttribute("data-value")).toBeNull();
    expect(dataEmpreitItem?.getAttribute("data-value")).toBeNull();
  });
});
