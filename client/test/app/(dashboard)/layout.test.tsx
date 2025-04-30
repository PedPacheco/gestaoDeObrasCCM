import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardLayout from "@/app/(dashboard)/layout";
import { Header } from "@/components/layout/Header";
import BreadcrumpsComponent from "@/components/common/Breadcrumbs";

// Mock dos componentes
vi.mock("@/components/layout/Header", () => ({
  Header: vi.fn(() => <div data-testid="mock-header">Header Mockado</div>),
}));

vi.mock("@/components/common/Breadcrumbs", () => ({
  __esModule: true,
  default: vi.fn(() => (
    <div data-testid="mock-breadcrumbs">Breadcrumbs Mockados</div>
  )),
}));

describe("DashboardLayout", () => {
  const childrenMock = {
    children: <div data-testid="mock-children">Conteúdo Filho</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o layout corretamente com todos os componentes", () => {
    render(DashboardLayout(childrenMock));

    // Verifica se o Header foi renderizado
    expect(Header).toHaveBeenCalled();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();

    // Verifica se o Breadcrumbs foi renderizado
    expect(BreadcrumpsComponent).toHaveBeenCalled();
    expect(screen.getByTestId("mock-breadcrumbs")).toBeInTheDocument();

    // Verifica se o conteúdo filho foi renderizado
    expect(screen.getByTestId("mock-children")).toBeInTheDocument();
  });

  it("deve ter a estrutura correta de classes e elementos", () => {
    const { container } = render(DashboardLayout(childrenMock));

    // Verifica os elementos principais
    const mainDiv = container.querySelector(
      ".relative.z-0.flex.min-h-screen.w-full"
    );
    expect(mainDiv).toBeInTheDocument();

    const contentDiv = container.querySelector(
      ".relative.flex.min-h-screen.max-w-full.flex-1.flex-col"
    );
    expect(contentDiv).toBeInTheDocument();

    const mainElement = container.querySelector(
      "main.overflow-y-auto.h-\\[calc\\(100vh-3\\.5rem\\)\\]"
    );
    expect(mainElement).toBeInTheDocument();

    // Verifica o container do Breadcrumbs
    const breadcrumbsContainer = container.querySelector(".py-2.w-4\\/5");
    expect(breadcrumbsContainer).toBeInTheDocument();

    // Verifica o separador (borda)
    const separator = container.querySelector(
      ".border-b.border-solid.border-zinc-300.w-full"
    );
    expect(separator).toBeInTheDocument();
  });

  it("deve ter o main com a altura correta", () => {
    const { container } = render(DashboardLayout(childrenMock));

    const mainElement = container.querySelector("main");
    expect(mainElement).toHaveClass("h-[calc(100vh-3.5rem)]");
  });
});
