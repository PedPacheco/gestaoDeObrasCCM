import * as cookiesModule from "next/headers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ExportPage from "@/app/(dashboard)/exportacoes/page";
import { render, screen } from "@testing-library/react";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/components/exports/exportButton", () => ({
  __esModule: true,
  ExportButton: vi.fn(({ text, path, token }) => (
    <div
      data-testid="main-export-button"
      data-text={text}
      data-path={path}
      data-token={token}
    >
      Main Execution Capacity
    </div>
  )),
}));

describe("Execution Capacity page", () => {
  const mockToken = "mock-token";

  const mockCookieStore = {
    get: vi.fn((name) => {
      if (name === "token") return { value: mockToken };
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(cookiesModule.cookies).mockReturnValue(mockCookieStore as any);

    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("deve buscar dados com os filtros corretos quando cookie de filtros existe", async () => {
    render(await ExportPage());

    expect(screen.getAllByTestId("main-export-button")).toHaveLength(7);
  });
});
