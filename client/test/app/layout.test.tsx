import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/userContext", () => ({
  UserProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

describe("RootLayout", () => {
  it("deve renderizar o layout com os filhos corretamente", () => {
    render(
      <RootLayout>
        <div data-testid="conteudo-filho">Olá, mundo!</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("conteudo-filho")).toBeInTheDocument();
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.classList.contains("h-full")).toBe(true);
    expect(document.body.classList.contains("h-full")).toBe(true);
  });
});
