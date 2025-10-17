import CapexUpdates from "@/app/(dashboard)/atualizacoes/capex/page";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/updatesComponents/updateCapexButton", () => ({
  UpdateCapexButton: vi.fn(() => <div data-testid="update-button-id" />),
}));

describe("Update Capex Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  it("Deve renderizar a página de atualiação do capex e MO corretamente", async () => {
    render(await CapexUpdates());

    expect(screen.getByTestId("update-button-id")).toBeInTheDocument();
  });
});
