// test/app/servicos/page.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ManageSchedule } from "@/components/services/manageSchedule";

import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { cookies } from "next/headers";
import ServicosPage from "@/app/(dashboard)/servicos/[id]/page";

import {
  programacaoServicosMock,
  servicesContractsMock,
  servicesFiltersMock,
  servicesNotScheduledDataMock,
  servicesScheduledDataMock,
  servicesTeamsMock,
} from "../../../mocks/mockServicesData";
import { render } from "@testing-library/react";

// --------------------
// Mocks base
// --------------------

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/theme/emotionCache", () => ({
  EmotionCacheProvider: ({ children }: any) => children,
}));

// --------------------
// Tipagem forte do mock do componente
// --------------------

const manageScheduleMock = vi.fn();

vi.mock("@/components/services/manageSchedule", () => ({
  ManageSchedule: (props: any) => {
    manageScheduleMock(props);
    return null;
  },
}));

// --------------------

describe("ServicosPage (Server Component)", () => {
  const mockToken = "mock-token";

  const mockCookieStore = {
    get: vi.fn(),
  };

  const mockOptions = {
    restricao: [{ id: 1, restricao: "Chuva" }],
    tecnico: [{ id: 1, tecnico: "Pedro", id_regional: 1 }],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock cookies
    (cookies as any).mockResolvedValue(mockCookieStore);

    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "token") return { value: mockToken };
      if (key === "form-data") return { value: JSON.stringify({ id: 99 }) };
      if (key === "idStatusWork") return { value: "5" };
      return undefined;
    });

    // Mock fetchFilters
    (fetchFilters as any).mockResolvedValue(mockOptions);

    // Mock fetchData por endpoint
    (fetchData as any).mockImplementation((url: string) => {
      if (url.includes("/servicos/selecionados/")) {
        return Promise.resolve({ data: servicesScheduledDataMock });
      }

      if (url.includes("/servicos/filtros/")) {
        return Promise.resolve({ data: servicesFiltersMock });
      }

      if (url.includes("/servicos/contratos/")) {
        return Promise.resolve({ data: servicesContractsMock });
      }

      if (url.includes("/servicos/equipes/")) {
        return Promise.resolve({ data: servicesTeamsMock });
      }

      if (url.includes("/servicos/historico/")) {
        return Promise.resolve({ data: programacaoServicosMock });
      }

      if (url.match(/\/servicos\/\d+$/)) {
        return Promise.resolve({ data: servicesNotScheduledDataMock });
      }

      return Promise.resolve({ data: null });
    });
  });

  // ----------------------------------------

  it("deve chamar todos os fetches corretamente", async () => {
    await ServicosPage({
      params: Promise.resolve({ id: "10" }),
    });

    expect(fetchFilters).toHaveBeenCalledWith({
      restricao: true,
      tecnico: true,
    });

    expect(fetchData).toHaveBeenCalledTimes(6);

    expect(fetchData).toHaveBeenCalledWith(
      expect.stringContaining("/servicos/10"),
      undefined,
      mockToken,
      { cache: "no-store" },
    );
  });

  // ----------------------------------------

  it("deve passar props corretas para ManageSchedule quando houver cookie", async () => {
    const Component = await ServicosPage({
      params: Promise.resolve({ id: "10" }),
    });

    render(Component);

    expect(manageScheduleMock).toHaveBeenCalled();

    const props = manageScheduleMock.mock.lastCall![0];

    expect(props.scheduleData).toEqual({ id: 99 });
    expect(props.isInsert).toBe(false);
    expect(props.idWork).toBe(10);
    expect(props.idStatusWork).toBe(5);
    expect(props.idSchedule).toBe(99);

    // 🔥 agora validando mocks reais
    expect(props.servicesData).toEqual(servicesNotScheduledDataMock);
    expect(props.scheduledServicesData).toEqual(servicesScheduledDataMock);
    expect(props.serviceContractData).toEqual(servicesContractsMock);
    expect(props.serviceFilters).toEqual(servicesFiltersMock);
    expect(props.scheduledServicesHistory).toEqual(programacaoServicosMock);
    expect(props.serviceTeams).toEqual(servicesTeamsMock);
    expect(props.options).toEqual(mockOptions);
  });

  // ----------------------------------------

  it("deve funcionar corretamente sem cookie form-data (modo insert)", async () => {
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "token") return { value: mockToken };
      if (key === "idStatusWork") return { value: "7" };
      return undefined;
    });

    const Component = await ServicosPage({
      params: Promise.resolve({ id: "10" }),
    });

    render(Component);

    expect(manageScheduleMock).toHaveBeenCalled();

    const props = manageScheduleMock.mock.lastCall![0];

    expect(props.scheduleData).toBeNull();
    expect(props.isInsert).toBe(true);
    expect(props.idWork).toBe(10);
    expect(props.idStatusWork).toBe(7);
    expect(props.idSchedule).toBeNaN();
  });

  // ----------------------------------------

  it("deve usar idProgramacao = 1 quando não houver id no cookie", async () => {
    mockCookieStore.get.mockImplementation((key: string) => {
      if (key === "token") return { value: mockToken };
      if (key === "form-data") return { value: JSON.stringify({}) };
      return undefined;
    });

    const Component = await ServicosPage({
      params: Promise.resolve({ id: "10" }),
    });

    render(Component);

    expect(fetchData).toHaveBeenCalledWith(
      expect.stringContaining("idProgramacao=1"),
      undefined,
      mockToken,
      { cache: "no-store" },
    );
  });
});
