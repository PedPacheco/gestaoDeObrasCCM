import CapexUpdates from "@/app/(dashboard)/atualizacoes/capex/page";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/updatesComponents/updateCapex/updateCapexButton", () => ({
  UpdateCapexButton: vi.fn(() => <div data-testid="update-button-id" />),
}));

vi.mock("@/hooks/useFeedback", () => ({
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

describe("Update Capex Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  it("Deve renderizar a página de atualização do capex e MO corretamente", async () => {
    const Page = await CapexUpdates();
    render(Page);

    expect(screen.getByTestId("update-button-id")).toBeInTheDocument();
  });
});
