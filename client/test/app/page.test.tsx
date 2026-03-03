import Home from "@/app/page";
import { Header } from "@/components/layout/Header";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout/Header", () => ({
  __esModule: true,
  Header: vi.fn(() => <div data-testid="mock-header">Header Mockado</div>),
}));

vi.mock("next/image", () => {
  return {
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
      // eslint-disable-next-line @next/next/no-img-element
      return <img {...props} alt={props.alt ?? ""} />;
    },
  };
});

describe("Home page component", () => {
  it("Deve renderizar corretamente todos os elementos da Home", () => {
    const { container } = render(<Home />);

    // Header
    expect(Header).toHaveBeenCalled();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();

    // Main
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main?.className).toContain("bg-[url(/fundo.png)]");
    expect(main?.className).toContain("bg-cover");
    expect(main?.className).toContain("bg-center");
    expect(main?.className).toContain("bg-no-repeat");

    // Imagem
    const image = screen.getByAltText("Logo SIGO");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/logo-sigo.png");

    // Estrutura base
    expect(container.querySelector(".min-h-screen")).toBeInTheDocument();
    expect(container.querySelector(".flex")).toBeInTheDocument();
  });
});
