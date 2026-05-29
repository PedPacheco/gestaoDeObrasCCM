import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================
// MOCKS
// ============================================================

vi.mock("@/components/exports/buttonForBILink", () => ({
  ButtonForBILink: vi.fn(({ text, path, visible, compact }) => (
    <a
      data-testid="bi-link-button"
      data-path={path}
      data-visible={String(visible)}
      data-compact={String(compact)}
      href={path}
    >
      {text}
    </a>
  )),
}));

import { ButtonForBILink } from "@/components/exports/buttonForBILink";
import BiReports from "@/app/(dashboard)/relatorios/relatorio-bi/page";
const mockButtonForBILink = vi.mocked(ButtonForBILink);

// ============================================================
// DADOS ESPERADOS (espelho do componente)
// ============================================================

const EXPECTED_CATEGORIES = ["Segurança", "Pessoas", "Cliente", "Eficiência"];

const EXPECTED_ITEMS_PER_CATEGORY: Record<string, string[]> = {
  Segurança: [
    "Blitz de Segurança",
    "KPI de Segurança",
    "Queremos te Ouvir",
    "Cority",
    "Dono de Área",
    "IDSP",
    "Relatório GAP ANALYSIS",
  ],
  Pessoas: ["EDPON", "Portal de Serviços", "About Me", "Udemy"],
  Cliente: ["COI – DEC Programado"],
  Eficiência: [
    "Capex DSPT",
    "Controle SMC",
    "Árteri",
    "Equipes para Contingência",
    "EFEN's / TA's",
  ],
};

const TOTAL_ITEMS = Object.values(EXPECTED_ITEMS_PER_CATEGORY).flat().length; // 17

// ============================================================
// TESTES
// ============================================================

describe("BiReports Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // Renderização base
  // ----------------------------------------------------------
  describe("Renderização", () => {
    it("deve renderizar sem erros", async () => {
      const { container } = render(await BiReports());
      expect(container).toBeTruthy();
    });

    it("deve renderizar o container principal com as classes corretas", async () => {
      const { container } = render(await BiReports());

      const wrapper = container.querySelector(".w-full.p-6");
      expect(wrapper).toBeInTheDocument();
    });

    it("deve renderizar o grid com 4 colunas no layout xl", async () => {
      const { container } = render(await BiReports());

      const grid = container.querySelector(
        ".grid.grid-cols-1.sm\\:grid-cols-2.xl\\:grid-cols-4.gap-5",
      );
      expect(grid).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // Categorias
  // ----------------------------------------------------------
  describe("Categorias", () => {
    it("deve renderizar todas as 4 categorias", async () => {
      render(await BiReports());

      EXPECTED_CATEGORIES.forEach((title) => {
        expect(screen.getByText(title)).toBeInTheDocument();
      });
    });

    it("deve renderizar os títulos com as classes de estilo corretas", async () => {
      render(await BiReports());

      EXPECTED_CATEGORIES.forEach((title) => {
        const el = screen.getByText(title);
        expect(el.tagName).toBe("SPAN");
        expect(el.className).toContain("uppercase");
        expect(el.className).toContain("font-black");
        expect(el.className).toContain("text-zinc-700");
        expect(el.className).toContain("text-center");
      });
    });

    it("deve renderizar cada categoria dentro de um card com gradiente", async () => {
      const { container } = render(await BiReports());

      const allDivs = container.querySelectorAll("div");
      const cards = Array.from(allDivs).filter((div) => {
        const cls = div.className;
        return (
          cls.includes("bg-gradient-to-br") &&
          cls.includes("rounded-2xl") &&
          cls.includes("shadow-xl")
        );
      });

      expect(cards).toHaveLength(4);
    });
  });

  // ----------------------------------------------------------
  // Items
  // ----------------------------------------------------------
  describe("Items", () => {
    it("deve renderizar todos os 17 items", async () => {
      render(await BiReports());

      Object.values(EXPECTED_ITEMS_PER_CATEGORY)
        .flat()
        .forEach((name) => {
          expect(screen.getByText(name)).toBeInTheDocument();
        });
    });

    it("deve renderizar os items corretos em cada categoria", async () => {
      const { container } = render(await BiReports());

      // Cada coluna do grid é um flex-col gap-2
      const columns = container.querySelectorAll(".flex.flex-col.gap-2");

      columns.forEach((column) => {
        const title = column.querySelector("span")?.textContent || "";
        const itemNames = Array.from(
          column.querySelectorAll(".text-sm.font-semibold.text-zinc-200"),
        ).map((el) => el.textContent);

        if (EXPECTED_ITEMS_PER_CATEGORY[title]) {
          expect(itemNames).toEqual(EXPECTED_ITEMS_PER_CATEGORY[title]);
        }
      });
    });

    it("deve renderizar os nomes dos items com as classes corretas", async () => {
      render(await BiReports());

      const firstItem = screen.getByText("Blitz de Segurança");
      expect(firstItem.className).toContain("text-sm");
      expect(firstItem.className).toContain("font-semibold");
      expect(firstItem.className).toContain("text-zinc-200");
    });
  });

  // ----------------------------------------------------------
  // Separadores
  // ----------------------------------------------------------
  describe("Separadores", () => {
    it("deve renderizar separadores entre items (não antes do primeiro)", async () => {
      const { container } = render(await BiReports());

      // Os separadores são divs com style height:1px e background inline
      // Buscar por todos os divs que têm exatamente style com height: 1px
      const allDivs = container.querySelectorAll("div");
      const separators = Array.from(allDivs).filter((div) => {
        const style = div.getAttribute("style");
        return style && style.includes("height") && style.includes("1");
      });

      // Cada categoria tem (items.length - 1) separadores
      // Segurança: 6, Pessoas: 3, Cliente: 0, Eficiência: 4 = 13
      const expectedSeparators = Object.values(
        EXPECTED_ITEMS_PER_CATEGORY,
      ).reduce((sum, items) => sum + Math.max(0, items.length - 1), 0);

      expect(separators).toHaveLength(expectedSeparators);
    });

    it("cada separador deve ter height 1px", async () => {
      const { container } = render(await BiReports());

      const allDivs = container.querySelectorAll("div");
      const separators = Array.from(allDivs).filter((div) => {
        const style = div.getAttribute("style");
        return style && style.includes("height") && style.includes("1");
      });

      separators.forEach((sep) => {
        expect((sep as HTMLElement).style.height).toBe("1px");
      });
    });
  });

  // ----------------------------------------------------------
  // ButtonForBILink
  // ----------------------------------------------------------
  describe("ButtonForBILink", () => {
    it("deve renderizar um ButtonForBILink para cada item", async () => {
      render(await BiReports());

      const buttons = screen.getAllByTestId("bi-link-button");
      expect(buttons).toHaveLength(TOTAL_ITEMS);
    });

    it("deve passar text vazio para todos os botões", async () => {
      render(await BiReports());

      mockButtonForBILink.mock.calls.forEach((call) => {
        expect(call[0].text).toBe("");
      });
    });

    it("deve passar visible=true para todos os botões", async () => {
      render(await BiReports());

      mockButtonForBILink.mock.calls.forEach((call) => {
        expect(call[0].visible).toBe(true);
      });
    });

    it("deve passar compact=true para todos os botões", async () => {
      render(await BiReports());

      mockButtonForBILink.mock.calls.forEach((call) => {
        expect(call[0].compact).toBe(true);
      });
    });

    it("deve passar os paths corretos para os botões de Segurança", async () => {
      render(await BiReports());

      const buttons = screen.getAllByTestId("bi-link-button");

      // Primeiro botão = "Blitz de Segurança"
      expect(buttons[0].dataset.path).toContain("powerbi.com");
      expect(buttons[0].dataset.path).toContain("853706ab");

      // Último de Segurança (index 6) = "Relatório GAP ANALYSIS" (link interno)
      expect(buttons[6].dataset.path).toBe("/relatorios/gap-analysis");
    });

    it("deve passar paths de links internos e externos corretamente", async () => {
      render(await BiReports());

      const buttons = screen.getAllByTestId("bi-link-button");
      const paths = buttons.map((b) => b.dataset.path!);

      // Verificar que existe pelo menos um link interno
      const internalLinks = paths.filter((p) => p.startsWith("/"));
      expect(internalLinks).toHaveLength(1);
      expect(internalLinks[0]).toBe("/relatorios/gap-analysis");

      // Todos os outros são externos
      const externalLinks = paths.filter((p) => !p.startsWith("/"));
      expect(externalLinks).toHaveLength(TOTAL_ITEMS - 1);
      externalLinks.forEach((link) => {
        expect(link).toMatch(/^https?:\/\//);
      });
    });
  });

  // ----------------------------------------------------------
  // Estrutura HTML
  // ----------------------------------------------------------
  describe("Estrutura HTML", () => {
    it("deve renderizar 4 colunas no grid", async () => {
      const { container } = render(await BiReports());

      const grid = container.querySelector(".grid");
      expect(grid?.children).toHaveLength(4);
    });

    it("cada item deve estar dentro de um container flex com py-3", async () => {
      const { container } = render(await BiReports());

      const itemRows = container.querySelectorAll(
        ".flex.items-center.justify-between.gap-3.py-3",
      );
      expect(itemRows).toHaveLength(TOTAL_ITEMS);
    });
  });
});
