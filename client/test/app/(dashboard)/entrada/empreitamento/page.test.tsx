import { beforeEach, describe, expect, it, vi } from "vitest";

import Contract from "@/app/(dashboard)/entrada/empreitamento/page";
import { render } from "@testing-library/react";

vi.mock(
  "@/components/entryComponents/importContract/buttonInsertContract",
  () => ({
    __esModule: true,
    ButtonInsertContract: vi.fn(() => (
      <div data-testid="insert-contract-button" />
    )),
  })
);

vi.mock(
  "@/components/entryComponents/importContract/buttonImportContract",
  () => ({
    __esModule: true,
    ButtonImportContract: vi.fn(() => (
      <div data-testid="import-contract-button" />
    )),
  })
);

vi.mock(
  "@/components/entryComponents/importContract/tableImportedContracts",
  () => ({
    __esModule: true,
    TableImportedContracts: vi.fn(() => (
      <div data-testid="table-imported-contracts" />
    )),
  })
);

describe("ContractUpdate Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Deve renderizar os componentes corretamente", async () => {
    const screen = render(await Contract());

    expect(screen.getByTestId("insert-contract-button")).toBeInTheDocument();
    expect(screen.getByTestId("import-contract-button")).toBeInTheDocument();
    expect(screen.getByTestId("table-imported-contracts")).toBeInTheDocument();
  });
});
