import Home from "@/app/page";
import { Header } from "@/components/layout/Header";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout/Header", () => ({
  __esModule: true,
  Header: vi.fn(() => <div data-testid="mock-header">Header Mockado</div>),
}));

vi.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  default: (props: any) => <img {...props} />,
}));

describe("Home page component", () => {
  it("Deve renderizar a página com o componente Header e com imagem no plano de fundo", () => {
    render(<Home />);

    expect(Header).toHaveBeenCalled();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();

    const image = screen.getByAltText("Logo SIGO");

    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/logo-sigo.png");
  });
});
