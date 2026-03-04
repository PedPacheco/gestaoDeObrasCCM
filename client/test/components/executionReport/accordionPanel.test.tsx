import { AccordionPanel } from "@/components/executionReport/accordionPanel";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

describe("AccordionPanel", () => {
  const defaultProps = {
    id: "panel1",
    title: "Título do Painel",
    expanded: "panel1",
    onChange: vi.fn(),
    children: <div data-testid="conteudo">Conteúdo do Painel</div>,
  };

  it("deve renderizar o título corretamente", () => {
    render(<AccordionPanel {...defaultProps} />);
    expect(screen.getByText("Título do Painel")).toBeInTheDocument();
  });

  it("deve exibir os filhos quando o painel está expandido", () => {
    render(<AccordionPanel {...defaultProps} />);
    expect(screen.getByTestId("conteudo")).toBeInTheDocument();
  });

  it("deve chamar onChange quando o cabeçalho for clicado", () => {
    render(<AccordionPanel {...defaultProps} />);
    const summary = screen.getByRole("button"); // AccordionSummary usa role="button"
    fireEvent.click(summary);
    expect(defaultProps.onChange).toHaveBeenCalledWith("panel1");
  });
});
