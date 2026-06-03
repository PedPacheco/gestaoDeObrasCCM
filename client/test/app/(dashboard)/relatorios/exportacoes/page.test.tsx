import * as cookiesModule from "next/headers";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";

import ExportPage from "@/app/(dashboard)/relatorios/exportacoes/page";
import { render } from "@testing-library/react";
import WrapperExportButton from "@/components/exports/wrapperExportButton";

vi.mock("@/components/exports/wrapperExportButton", () => ({
  __esModule: true,
  default: vi.fn(({ text, path, token, visible }) => {
    if (!visible) return null;

    return (
      <div
        data-testid="export-button"
        data-text={text}
        data-path={path}
        data-token={token}
        data-visible={visible}
      >
        Export Button
      </div>
    );
  }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("ExportPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (cookiesModule.cookies as Mock).mockImplementation(() => ({
      get: vi.fn((name: string) => {
        if (name === "token") return { value: "mock-token" };
        return undefined;
      }),
      set: vi.fn(),
      delete: vi.fn(),
    }));
  });

  it("deve chamar WrapperExportButton com visible true e false", async () => {
    const page = await ExportPage();
    render(page);

    const mock = WrapperExportButton as unknown as Mock;

    const calls = mock.mock.calls;

    const visibles = calls.map((call) => call[0].visible);

    expect(visibles).toContain(true);
    expect(visibles).toContain(false);
  });
});
