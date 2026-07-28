import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardLayout from "@/app/(dashboard)/layout";
import { Header } from "@/components/layout/Header";
import { BreadcrumpsComponent } from "@/components/common/Breadcrumbs";

vi.mock("@/contexts/userContext", () => ({
  useUser: () => ({
    user: {
      id: 1,
      username: "test-user",
      id_regional: "001",
      nome_usuario: "Test User",
      email: "test@example.com",
    },
    permissions: {
      id: 1,
      username: "test-user",
      permissao: "total",
      permissao_visualizacao: "total",
    },
  }),
}));

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

vi.mock("@/contexts/userContext", () => ({
  useUser: () => ({
    user: { name: "Pedro" },
    isAuthenticated: true,
  }),
  UserProvider: ({ children }: any) => <>{children}</>,
}));

describe("DashboardLayout", () => {
  const childrenMock = {
    children: <div data-testid="mock-children">Conteúdo Filho</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o layout com header, breadcrumbs e conteúdo filho", () => {
    render(<DashboardLayout>{childrenMock.children}</DashboardLayout>);

    expect(Header).toHaveBeenCalled();
    expect(screen.getByTestId("mock-header")).toBeInTheDocument();

    expect(BreadcrumpsComponent).toHaveBeenCalled();
    expect(screen.getByTestId("mock-breadcrumbs")).toBeInTheDocument();

    expect(screen.getByTestId("mock-children")).toBeInTheDocument();
  });

  it("deve conter estrutura semântica principal", () => {
    const { container } = render(
      <DashboardLayout>{childrenMock.children}</DashboardLayout>,
    );

    const outerDiv = container.querySelector("div.flex.h-screen.w-full");
    const innerFlex = container.querySelector("div.flex-1.flex-col");
    const main = container.querySelector("main");
    const breadcrumbsArea = container.querySelector("div.py-2");
    const borderSpan = container.querySelector("span.border-b");

    expect(outerDiv).toBeInTheDocument();
    expect(innerFlex).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(breadcrumbsArea).toBeInTheDocument();
    expect(borderSpan).toBeInTheDocument();
  });
});
