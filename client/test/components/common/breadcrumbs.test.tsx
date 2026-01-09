import * as nextNavigation from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { BreadcrumpsComponent } from "@/components/common/Breadcrumbs";

// Mock do next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

// Mock correto do arquivo importado no componente
vi.mock("@/utils/links", () => ({
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

describe("BreadcrumpsComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve exibir um único breadcrumb quando há apenas um segmento", () => {
    vi.mocked(nextNavigation.usePathname).mockReturnValue("/programacao");

    render(<BreadcrumpsComponent />);

    expect(screen.getByText("Programação")).toBeInTheDocument();
  });

  it("deve exibir breadcrumbs com submenu corretamente", () => {
    vi.mocked(nextNavigation.usePathname).mockReturnValue(
      "/programacao/resumo-mensal"
    );

    render(<BreadcrumpsComponent />);

    expect(screen.getByText("Programação")).toBeInTheDocument();
    expect(screen.getByText("Resumo mensal")).toBeInTheDocument();
  });

  it("deve renderizar o último breadcrumb como texto e os anteriores como link", () => {
    vi.mocked(nextNavigation.usePathname).mockReturnValue(
      "/programacao/resumo-mensal"
    );

    render(<BreadcrumpsComponent />);

    const programação = screen.getByText("Programação");
    const resumoMensal = screen.getByText("Resumo mensal");

    // Programação → deve ser link
    expect(programação.closest("a")).not.toBeNull();

    // Resumo Mensal → último item, não deve ser link
    expect(resumoMensal.closest("a")).toBeNull();
  });

  it("não deve renderizar itens se o pathname estiver vazio", () => {
    vi.mocked(nextNavigation.usePathname).mockReturnValue("");

    render(<BreadcrumpsComponent />);

    // Breadcrumbs existe sempre, mas sem itens
    const links = screen.queryAllByRole("link");
    const textos = screen.queryAllByText(/./);

    expect(links.length).toBe(0);
    expect(textos.length).toBe(0);
  });
});
