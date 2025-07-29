import { LoadingComponent } from "@/components/common/Loading";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Loading Component", () => {
  const renderComponent = (color = "bg-black") => {
    render(<LoadingComponent color={color} />);
  };

  it("renderiza com a cor enviada como props", () => {
    renderComponent("bg-black");
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("bg-black");
  });
});
