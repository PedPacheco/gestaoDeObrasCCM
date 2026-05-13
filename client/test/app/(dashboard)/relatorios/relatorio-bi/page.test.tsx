/**
 * @vitest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import BiReports from "@/app/(dashboard)/relatorios/relatorio-bi/page";

// 🔹 Mock do botão (isolando UI pesada / navegação externa)
vi.mock("@/components/exports/buttonForBILink", () => ({
  ButtonForBILink: ({ text, path, visible }: any) => {
    if (!visible) return null;

    return (
      <div data-testid="bi-link" data-path={path} data-visible={visible}>
        {text}
      </div>
    );
  },
}));

// 🔹 Mock MUI (evita custo de render e problemas com theme)
vi.mock("@mui/material", () => ({
  Box: ({ children }: any) => <div data-testid="mui-box">{children}</div>,
  Card: ({ children }: any) => <div data-testid="mui-card">{children}</div>,
  CardContent: ({ children }: any) => (
    <div data-testid="mui-card-content">{children}</div>
  ),
  Typography: ({ children }: any) => (
    <div data-testid="mui-typography">{children}</div>
  ),
}));

describe("Página BiReports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o título da página corretamente", async () => {
    const component = await BiReports();

    render(component);

    expect(screen.getByText("Links para BI's da DSPT")).toBeInTheDocument();
  });

  it("deve renderizar todos os links de BI visíveis", async () => {
    const component = await BiReports();

    render(component);

    const links = screen.getAllByTestId("bi-link");

    expect(links).toHaveLength(4);

    expect(screen.getByText("Capex DSPT")).toBeInTheDocument();
    expect(screen.getByText("Blitz de Segurança")).toBeInTheDocument();
    expect(screen.getByText("KPI de Segurança")).toBeInTheDocument();
    expect(screen.getByText("Controle SMC")).toBeInTheDocument();
  });

  it("deve passar as props corretas para o ButtonForBILink", async () => {
    const component = await BiReports();

    render(component);

    const links = screen.getAllByTestId("bi-link");

    expect(links[0]).toHaveAttribute(
      "data-path",
      expect.stringContaining("powerbi.com"),
    );
  });

  it("deve renderizar a estrutura de containers corretamente", async () => {
    const component = await BiReports();

    render(component);

    expect(screen.getAllByTestId("mui-box").length).toBeGreaterThan(0);
    expect(screen.getByTestId("mui-card")).toBeInTheDocument();
    expect(screen.getByTestId("mui-card-content")).toBeInTheDocument();
  });

  it("deve utilizar chaves únicas para os itens da lista", async () => {
    const component = await BiReports();

    render(component);

    const links = screen.getAllByTestId("bi-link");

    const paths = links.map((el) => el.getAttribute("data-path"));

    const uniquePaths = new Set(paths);

    expect(uniquePaths.size).toBe(paths.length);
  });
});
