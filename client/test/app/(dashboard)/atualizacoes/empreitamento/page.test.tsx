import { beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/react";
import Contract from "@/app/(dashboard)/atualizacoes/empreitamento/page";

vi.mock(
  "@/components/updatesComponents/updateContract/updateContractButton",
  () => ({
    __esModule: true,
    UpdateContractButton: vi.fn(() => (
      <div data-testid="update-contract-button" />
    )),
  })
);

vi.mock(
  "@/components/updatesComponents/updateContract/importContractButton",
  () => ({
    __esModule: true,
    ImportContractButton: vi.fn(() => (
      <div data-testid="import-contract-button" />
    )),
  })
);

vi.mock(
  "@/components/updatesComponents/updateContract/importTableContracts",
  () => ({
    __esModule: true,
    ImportTableContracts: vi.fn(() => (
      <div data-testid="import-table-contracts" />
    )),
  })
);

describe("ContractUpdate Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Deve renderizar os componentes corretamente", async () => {
    const screen = render(await Contract());

    expect(screen.getByTestId("update-contract-button")).toBeInTheDocument();
    expect(screen.getByTestId("import-contract-button")).toBeInTheDocument();
    expect(screen.getByTestId("import-table-contracts")).toBeInTheDocument();
  });
});
