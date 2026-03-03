import * as cookiesModule from "next/headers";
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { render, screen } from "@testing-library/react";

import ExportPage from "@/app/(dashboard)/exportacoes/page";

vi.mock("@/components/exports/wrapperExportButton", () => ({
  __esModule: true,
  default: vi.fn(({ text, path, token }) => (
    <div
      data-testid="export-button"
      data-text={text}
      data-path={path}
      data-token={token}
    >
      Export Button
    </div>
  )),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("ExportPage", () => {
  const mockToken = "mock-token";

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
      return undefined;
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // cookies() agora pode ser mockado diretamente
    (cookiesModule.cookies as Mock).mockImplementation(() => ({
      get: vi.fn().mockReturnValue({ value: "123" }),
      set: vi.fn(),
      delete: vi.fn(),
    }));
  });

  it("renderiza apenas os botões com visible=true", async () => {
    const page = await ExportPage();
    render(page);

    const buttons = screen.getAllByTestId("export-button");

    // sua página tem 5 botões visíveis
    expect(buttons).toHaveLength(10);
  });
});
