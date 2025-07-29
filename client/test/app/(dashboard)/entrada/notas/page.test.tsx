import { beforeEach, describe, expect, it, vi } from "vitest";
import * as cookiesModule from "next/headers";
import { fetchFilters } from "@/actions/fetchFilters.action";
import NotesEntry from "@/app/(dashboard)/entrada/notas/page";
import { render, screen } from "@testing-library/react";
import { fetchData } from "@/actions/fetchData.action";

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/components/entryComponents/importMarketWorks/deleteButton", () => ({
  __esModule: true,
  DeleteButton: vi.fn(() => <div data-testid="delete-button" />),
}));

vi.mock("@/components/entryComponents/importMarketWorks/importButton", () => ({
  __esModule: true,
  ImportButton: vi.fn(() => <div data-testid="import-button" />),
}));

vi.mock("@/components/entryComponents/importMarketWorks/insertButton", () => ({
  __esModule: true,
  InsertMarketWorksButton: vi.fn(() => <div data-testid="insert-button" />),
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

describe("NotesEntry Page", () => {
  const mockCookieStore = {
    get: vi.fn((key) => {
      if (key === "notesEntryData") return { value: "true" };
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

  it("deve usar dados do cookie quando notesEntry existir", async () => {
    mockCookieStore.get.mockImplementation((key) =>
      key === "notesEntryData" ? { value: "teste" } : { value: "mock-token" }
    );

    render(await NotesEntry());

    expect(fetchData).not.toHaveBeenCalled();

    const table = screen.getByTestId("table-notes-works");

    expect(JSON.parse(table.getAttribute("data-data") || "[]")).toEqual([]);

    expect(
      JSON.parse(table.getAttribute("data-selectOptionsByColumn") || "[]")
    ).toEqual(mockFilters);
  });

  it("Deve buscar dados da API quando notesEntryData não existir", async () => {
    const mockAPIData = {
      token: "mock-token",
      data: [{ obra: "OB123", pep: "PEP229" }],
    };

    mockCookieStore.get.mockImplementation((key) =>
      key === "notesEntryData" ? undefined : { value: "mock-token" }
    );

    vi.mocked(fetchData).mockResolvedValueOnce(mockAPIData);

    render(await NotesEntry());

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
