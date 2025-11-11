import * as cookiesModule from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import Details from "@/app/(dashboard)/detalhes/[id]/page";
import { render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { formatPercentage } from "@/utils/formatValue";

// Mocks
vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/components/details/workDetails/workDetails", () => ({
  WorkDetails: vi.fn(({ formattedData }) => (
    <div
      data-testid="work-details"
      data-background={formattedData.backgroundColor}
      data-executado={formattedData.executadoFormatted}
    />
  )),
}));

vi.mock("@/components/common/ErrorThrower", () => ({
  ErrorThrower: vi.fn(({ message }) => (
    <div data-testid="error-component" data-message={message} />
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

vi.mock("@/contexts/UserContext", () => ({
  useUser: vi.fn(() => ({
    user: { id: 1, nome: "Usuário Teste", grupo: 2 },
    setUser: vi.fn(),
  })),
}));

vi.mock("@/utils/formatValue", () => ({
  formatPercentage: vi.fn((value) => `${value}%`),
  FormatCurrency: vi.fn((value) => `R$ ${value}`),
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

    vi.mocked(cookiesModule.cookies).mockReturnValue(mockCookieStore as any);

    vi.mocked(fetchData).mockResolvedValue({
      success: true,
      token: "mock-token",
      data: mockData,
      success: true,
    });

    vi.mocked(fetchFilters).mockResolvedValue({
      restricao: [{ id: 1, restricao: "chuva" }],
      tecnico: [{ id: 1, tecnico: "Elias" }],
      parceira: [{ id: 1, turma: "Engelmig" }],
      status: [{ id: 1, status: "Programado" }],
    });

    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  it("deve buscar os dados da API com o ID correto", async () => {
    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/obras/123",
      undefined,
      "mock-token",
      { cache: "no-store" }
    );
    expect(fetchData).toBeCalledTimes(2);
    expect(fetchFilters).toHaveBeenCalledWith({
      circuito: true,
      empreendimento: true,
      municipio: true,
      tipo: true,
      restricao: true,
      tecnico: true,
      parceira: true,
      status: true,
    });
  });

  it("deve aplicar background verde quando grupo for 2 e ano_plan for o ano atual", async () => {
    const currentYear = dayjs().year();
    const modifiedData = { ...mockData, grupo: 2, ano_plan: currentYear };

    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      token: "mock-token",
      data: modifiedData,
      success: true,
    });

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const details = screen.getByTestId("work-details");
    expect(details.getAttribute("data-background")).toBe(
      "bg-green-600 text-zinc-100"
    );
  });

  it("deve aplicar background vermelho quando grupo for 2 e ano_plan for diferente do ano atual", async () => {
    const modifiedData = {
      ...mockData,
      grupo: 2,
      ano_plan: dayjs().year() - 1,
    };

    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      token: "mock-token",
      data: modifiedData,
      success: true,
    });

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const details = screen.getByTestId("work-details");
    expect(details.getAttribute("data-background")).toBe(
      "bg-red-600 text-zinc-100"
    );
  });

  it("não deve aplicar background quando grupo for diferente de 2", async () => {
    const modifiedData = { ...mockData, grupo: 1 };

    vi.mocked(fetchData).mockResolvedValueOnce({
      success: true,
      token: "mock-token",
      data: modifiedData,
      success: true,
    });

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const details = screen.getByTestId("work-details");
    expect(details.getAttribute("data-background")).toBe("");
  });

  it("deve formatar o valor executado corretamente com formatPercentage", async () => {
    vi.mocked(formatPercentage).mockReturnValue("75%");

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const details = screen.getByTestId("work-details");
    expect(details.getAttribute("data-executado")).toBe("75%");
  });

  it("deve retornar uma string vazia caso formatPercentage retorne null", async () => {
    vi.mocked(formatPercentage).mockReturnValue(null);

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    const details = screen.getByTestId("work-details");
    expect(details.getAttribute("data-executado")).toBe("");
  });

  it("Deve renderizar o componente, caso algum erro seja retornado do fetchData", async () => {
    vi.mocked(fetchData).mockResolvedValueOnce({
      success: false,
      token: "mock-token",
      data: mockData,
    });

    render(await Details({ params: Promise.resolve({ id: mockId }) }));

    expect(screen.getByTestId("error-component")).toBeInTheDocument();
  });
});
