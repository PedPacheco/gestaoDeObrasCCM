import * as cookiesModule from "next/headers";
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import { render, screen } from "@testing-library/react";

import ExportPage from "@/app/(dashboard)/exportacoes/page";
import WrapperExportButton from "@/components/exports/wrapperExportButton";

vi.mock("@/components/exports/wrapperExportButton", () => ({
  __esModule: true,
  default: vi.fn(({ text, path, token, visible }) => (
    <div
      data-testid="export-button"
      data-text={text}
      data-path={path}
      data-token={token}
      data-visible={visible}
    >
      Export Button
    </div>
  )),
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

  it("passa corretamente todas as props para WrapperExportButton", async () => {
    const page = await ExportPage();
    render(page);

    expect(WrapperExportButton).toHaveBeenCalledTimes(10);

    const calls = (WrapperExportButton as any).mock.calls;

    expect(calls[0][0]).toMatchObject({
      text: "EXPORTAÇÃO DADOS OBRAS",
      path: "obras-carteira-bi",
      token: "mock-token",
      visible: true,
    });

    expect(calls[3][0]).toMatchObject({
      text: "Exportar obras a serem multadas",
      visible: false,
    });
  });
});
