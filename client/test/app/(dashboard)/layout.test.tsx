import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardLayout from "@/app/(dashboard)/layout";
import { Header } from "@/components/layout/Header";
import { BreadcrumpsComponent } from "@/components/common/Breadcrumbs";

vi.mock("@/components/layout/Header", () => ({
  __esModule: true,
  Header: vi.fn(() => <div data-testid="mock-header">Header Mockado</div>),
}));

vi.mock("@/components/common/Breadcrumbs", () => ({
  __esModule: true,
  BreadcrumpsComponent: vi.fn(() => (
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
    render(<DashboardLayout>{childrenMock.children}</DashboardLayout>);

    expect(Header).toHaveBeenCalled();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();

    expect(BreadcrumpsComponent).toHaveBeenCalled();
    expect(screen.getByTestId("mock-breadcrumbs")).toBeInTheDocument();

    expect(screen.getByTestId("mock-children")).toBeInTheDocument();
  });

  it("deve ter a estrutura correta de classes e elementos", () => {
    const { container } = render(<DashboardLayout {...childrenMock} />);

    expect(
      container.querySelector(".relative.z-0.flex.min-h-screen.w-full")
    ).toBeInTheDocument();

    expect(
      container.querySelector(
        ".relative.flex.min-h-screen.max-w-full.flex-1.flex-col"
      )
    ).toBeInTheDocument();

    expect(
      container.querySelector(
        "main.overflow-y-auto.h-\\[calc\\(100vh-3\\.5rem\\)\\]"
      )
    ).toBeInTheDocument();

    expect(container.querySelector(".py-2.w-4\\/5")).toBeInTheDocument();
    expect(
      container.querySelector(".border-b.border-solid.border-zinc-300.w-full")
    ).toBeInTheDocument();
  });

  it("deve ter o main com a altura correta", () => {
    const { container } = render(<DashboardLayout {...childrenMock} />);
    const mainElement = container.querySelector("main");
    expect(mainElement).toHaveClass("h-[calc(100vh-3.5rem)]");
  });
});
