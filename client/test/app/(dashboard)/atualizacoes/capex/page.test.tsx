import CapexUpdates from "@/app/(dashboard)/atualizacoes/capex/page";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock do next/headers para evitar o erro de "cookies outside request scope"
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

// Mock do EmotionCacheProvider
vi.mock("@/theme/emotionCache", () => ({
  EmotionCacheProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="emotion-cache-provider">{children}</div>
  ),
}));

// Mock do CapexPipelineButton (nome correto do export)
vi.mock("@/components/updatesComponents/updateCapex/updateCapexButton", () => ({
  CapexPipelineButton: vi.fn(({ token }: { token?: string }) => (
    <div data-testid="capex-pipeline-button" data-token={token} />
  )),
}));

import { cookies } from "next/headers";
const mockCookies = vi.mocked(cookies);

describe("CapexUpdates Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCookies.mockResolvedValue({
      get: vi.fn((name: string) => {
        if (name === "token") {
          return { value: "mocked-token-value" };
        }
        return undefined;
      }),
    } as any);
  });

  it("deve renderizar a página corretamente", async () => {
    render(await CapexUpdates());

    expect(screen.getByTestId("emotion-cache-provider")).toBeInTheDocument();
    expect(screen.getByTestId("capex-pipeline-button")).toBeInTheDocument();
  });

  it("deve passar o token dos cookies para o CapexPipelineButton", async () => {
    render(await CapexUpdates());

    const button = screen.getByTestId("capex-pipeline-button");
    expect(button).toHaveAttribute("data-token", "mocked-token-value");
  });

  it("deve lidar com token undefined quando o cookie não existe", async () => {
    // Sobrescreve o mock de cookies para retornar undefined
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValueOnce({
      get: vi.fn(() => undefined),
    } as any);

    render(await CapexUpdates());

    const button = screen.getByTestId("capex-pipeline-button");
    expect(button).toBeInTheDocument();
    expect(button.getAttribute("data-token")).toBeNull();
  });
});
