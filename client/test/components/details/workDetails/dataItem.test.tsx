import { afterEach, describe, expect, it, vi } from "vitest";

import DataItem from "@/components/details/workDetails/dataItem";
import { fireEvent, render, screen } from "@testing-library/react";

// Mock para useEffect com delay (simular comportamento real)
vi.useFakeTimers();

describe("DataItem Component", () => {
  const defaultProps = {
    value: "Test Value",
    label: "Test Label",
  };

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Renderização Básica", () => {
    it("deve renderizar com props mínimas", () => {
      render(<DataItem value="test" />);

      expect(screen.getByText("test")).toBeInTheDocument();
    });

    it("deve renderizar com label quando fornecido", () => {
      render(<DataItem {...defaultProps} />);

      expect(screen.getByText("Test Label")).toBeInTheDocument();
      expect(screen.getByText("Test Value")).toBeInTheDocument();
    });

    it("deve renderizar sem label quando não fornecido", () => {
      render(<DataItem value="test" />);

      expect(screen.queryByText("Test Label")).not.toBeInTheDocument();
      expect(screen.getByText("test")).toBeInTheDocument();
    });

    it("deve renderizar status quando fornecido", () => {
      render(<DataItem {...defaultProps} status="Active" />);

      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  describe("Estados de Edição", () => {
    it("deve renderizar input quando isEdit é true e mounted", async () => {
      render(
        <DataItem
          {...defaultProps}
          isEdit={true}
          onEdit={vi.fn()}
          value={undefined as unknown as string}
        />
      );

      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getAllByDisplayValue("")[0]).toBeInTheDocument();
    });

    it("não deve renderizar input quando disabled é true", async () => {
      render(
        <DataItem {...defaultProps} isEdit={true} disabled onEdit={vi.fn()} />
      );

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

      expect(screen.getByText("Test Value")).toBeInTheDocument();
    });

    it("deve chamar onEdit com o valor formatado para o dia", async () => {
      const mockOnEdit = vi.fn();
      render(<DataItem {...defaultProps} isEdit={true} onEdit={mockOnEdit} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "12" } });

      expect(mockOnEdit).toHaveBeenLastCalledWith("12");
    });

    it("deve chamar onEdit com o valor formatado para dia e mês", async () => {
      const mockOnEdit = vi.fn();
      render(<DataItem {...defaultProps} isEdit={true} onEdit={mockOnEdit} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "1234" } });

      expect(mockOnEdit).toHaveBeenLastCalledWith("12/34");
    });

    it("deve chamar onEdit com o valor formatado para data completa", async () => {
      const mockOnEdit = vi.fn();
      render(<DataItem {...defaultProps} isEdit={true} onEdit={mockOnEdit} />);

      const input = screen.getByRole("textbox");
      fireEvent.change(input, { target: { value: "12345678" } });

      expect(mockOnEdit).toHaveBeenLastCalledWith("12/34/5678");
    });
  });
});
