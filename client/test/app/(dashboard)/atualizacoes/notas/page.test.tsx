import { beforeEach, describe, expect, it, vi } from "vitest";
import * as cookiesModule from "next/headers";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { render, screen } from "@testing-library/react";
import { fetchData } from "@/actions/fetchData.action";
import NotesUpdates from "@/app/(dashboard)/atualizacoes/notas/page";

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/components/updatesComponents/importButtonUpdates", () => ({
  __esModule: true,
  ImportButtonUpdates: vi.fn(() => <div data-testid="import-update-button" />),
}));

vi.mock("@/components/updatesComponents/updateButton", () => ({
  __esModule: true,
  UpdateButton: vi.fn(() => <div data-testid="update-button" />),
}));

vi.mock(
  "@/components/entryComponents/importMarketWorks/tableWorksMarket",
  () => ({
    __esModule: true,
    TableMarketWorks: vi.fn(
      ({ data, columns, selectOptionsByColumn, displayValues, storageKey }) => (
        <div
          data-testid="table-notes-works"
          data-data={JSON.stringify(data)}
          data-columns={JSON.stringify(columns)}
          data-selectOptionsByColumn={JSON.stringify(selectOptionsByColumn)}
          data-displayValues={JSON.stringify(displayValues)}
          data-storageKey={storageKey}
        >
          tableWorksMarket Component
        </div>
      )
    ),
  })
);

describe("NotesUpdates Page", () => {
  const mockCookieStore = {
    get: vi.fn((key) => {
      if (key === "notesUpdatesData") return { value: "true" };
      if (key === "token") return { value: "mock-token" };
      return undefined;
    }),
  };

  const mockFilters = {
    parceira: [{ id: 1, turma: "Engelmig" }],
    tipo: [{ id: 1, tipo_obra: "Nova" }],
    municipio: [{ id: 1, municipio: "SP" }],
    circuito: [{ id: 1, circuito: "ABC" }],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookiesModule.cookies).mockReturnValue(mockCookieStore as any);
    vi.mocked(fetchFilters).mockResolvedValue(mockFilters);
  });

  it("Deve renderizar os componentes corretamente", async () => {
    const screen = render(await NotesUpdates());

    expect(screen.getByTestId("update-button")).toBeInTheDocument();
    expect(screen.getByTestId("import-update-button")).toBeInTheDocument();
    expect(screen.getByTestId("table-notes-works")).toBeInTheDocument();
  });

  it("deve usar dados do cookie quando NotesUpdates existir", async () => {
    mockCookieStore.get.mockImplementation((key) =>
      key === "notesUpdatesData" ? { value: "teste" } : { value: "mock-token" }
    );

    render(await NotesUpdates());

    expect(fetchData).not.toHaveBeenCalled();

    const table = screen.getByTestId("table-notes-works");

    expect(JSON.parse(table.getAttribute("data-data") || "[]")).toEqual([]);

    expect(
      JSON.parse(table.getAttribute("data-selectOptionsByColumn") || "[]")
    ).toEqual(mockFilters);
  });

  it("Deve buscar dados da API quando notesUpdatesData não existir", async () => {
    const mockAPIData = {
      token: "mock-token",
      data: [{ obra: "OB123", pep: "PEP229" }],
      success: true,
    };

    mockCookieStore.get.mockImplementation((key) =>
      key === "notesUpdatesData" ? undefined : { value: "mock-token" }
    );

    vi.mocked(fetchData).mockResolvedValueOnce(mockAPIData);

    render(await NotesUpdates());

    expect(fetchData).toHaveBeenCalledWith(
      "https://api.example.com/base-auxiliar/notas",
      undefined,
      "mock-token",
      { cache: "no-store" }
    );

    const table = screen.getByTestId("table-notes-works");

    expect(JSON.parse(table.getAttribute("data-data") || "[]")).toEqual(
      mockAPIData.data
    );
    expect(
      JSON.parse(table.getAttribute("data-selectOptionsByColumn") || "[]")
    ).toEqual(mockFilters);
  });
});
