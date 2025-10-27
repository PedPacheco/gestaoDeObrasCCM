import { beforeEach, describe, expect, it, vi } from "vitest";

import { render } from "@testing-library/react";
import SuspensionUpdates from "@/app/(dashboard)/atualizacoes/suspensoes/page";

vi.mock(
  "@/components/updatesComponents/updateSuspensions/deleteWorkSuspensions",
  () => ({
    __esModule: true,
    DeleteSuspensionsButton: vi.fn(() => (
      <div data-testid="delete-suspension-button" />
    )),
  })
);

vi.mock(
  "@/components/updatesComponents/updateSuspensions/importSuspensionsButton",
  () => ({
    __esModule: true,
    ImportSuspensionsButton: vi.fn(() => (
      <div data-testid="import-suspension-button" />
    )),
  })
);

vi.mock(
  "@/components/updatesComponents/updateSuspensions/suspensionImportTable",
  () => ({
    __esModule: true,
    SuspensionImportTable: vi.fn(() => (
      <div data-testid="suspension-import-table" />
    )),
  })
);

vi.mock(
  "@/components/updatesComponents/updateSuspensions/updateSuspensionsButton",
  () => ({
    __esModule: true,
    UpdateSuspensionsButton: vi.fn(() => (
      <div data-testid="update-suspension-button" />
    )),
  })
);

describe("ContractUpdate Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Deve renderizar os componentes corretamente", async () => {
    const screen = render(await SuspensionUpdates());

    expect(screen.getByTestId("delete-suspension-button")).toBeInTheDocument();
    expect(screen.getByTestId("import-suspension-button")).toBeInTheDocument();
    expect(screen.getByTestId("suspension-import-table")).toBeInTheDocument();
    expect(screen.getByTestId("update-suspension-button")).toBeInTheDocument();
  });
});
