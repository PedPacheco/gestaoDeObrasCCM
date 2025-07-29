import * as nextNavigation from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BreadcrumpsComponent } from "@/components/common/Breadcrumbs";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

vi.mock("@utils/links", () => ({
  links: [
    { name: "Tela inicial", href: "/", needPermission: false },
    {
      name: "Programação",
      href: "/programacao",
      needPermission: false,
      submenu: [
        {
          name: "Resumo mensal",
          href: "/programacao/resumo-mensal",
          needPermission: true,
        },
      ],
    },
  ],
}));

describe("Breadcrumbs component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Deve exibir um único breadcrumb só há um segmento", () => {
    vi.mocked(nextNavigation.usePathname).mockReturnValue("/programacao");

    render(<BreadcrumpsComponent />);

    expect(screen.queryByText("Programação")).toBeInTheDocument();
  });

  it("deve exibir breadcrumbs com submenus corretamente", () => {
    vi.mocked(nextNavigation.usePathname).mockReturnValue(
      "/programacao/resumo-mensal"
    );

    render(<BreadcrumpsComponent />);

    expect(screen.getByText("Programação")).toBeInTheDocument();
    expect(screen.getByText("Resumo mensal")).toBeInTheDocument();
  });

  it("Deve destacar apenas o último breadcrumb como texto (sem link)", () => {
    vi.mocked(nextNavigation.usePathname).mockReturnValue(
      "/programacao/resumo-mensal"
    );

    render(<BreadcrumpsComponent />);

    expect(screen.getByText("Programação").closest("a")).toBeInTheDocument();

    expect(
      screen.getByText("Resumo mensal").closest("a")
    ).not.toBeInTheDocument();
  });

  it("não deve renderizar nada se nenhum breadcrumb for encontrado", () => {
    vi.mocked(nextNavigation.usePathname).mockReturnValue("");

    const { container } = render(<BreadcrumpsComponent />);

    expect(container.querySelectorAll("a").length).toBe(0);
    expect(container.querySelectorAll("p").length).toBe(0);
  });
});
