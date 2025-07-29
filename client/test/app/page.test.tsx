import Home from "@/app/page";
import { Header } from "@/components/layout/Header";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout/Header", () => ({
  __esModule: true,
  Header: vi.fn(() => <div data-testid="mock-header">Header Mockado</div>),
}));

describe("Home page component", () => {
  it("Deve renderizar a página com o componente Header e com imagem no plano de fundo", () => {
    const { container } = render(<Home />);

    const rootDiv = container.firstChild as HTMLElement;

    expect(Header).toHaveBeenCalled();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();

    expect(rootDiv.className).toContain("bg-[url(/edp-background.png)]");
  });
});
