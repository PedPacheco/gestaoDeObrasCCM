// executionCapacityTable.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExecutionCapacityTable } from "@/components/executionCapacity/executionCapacityTable";

// Mock do contexto
const mockUseUser = vi.fn();

vi.mock("@/contexts/userContext", () => ({
  useUser: () => mockUseUser(),
}));

describe("ExecutionCapacityTable", () => {
  const setTableDataMock = vi.fn();

  const columns = {
    regional: "Regional",
    jan: "Jan",
    fev: "Fev",
    mar: "Mar",
  };

  const mockData = [
    {
      id_regional: "001",
      regional: "Campinas",
      jan: "10",
      fev: "20",
      mar: "30",
    },
    {
      id_regional: "002",
      regional: "São Paulo",
      jan: "40",
      fev: null,
      mar: "60",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderização", () => {
    it("deve renderizar todas as colunas", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Total",
        },
        user: {
          id_regional: "001",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      expect(screen.getByText("Regional")).toBeInTheDocument();
      expect(screen.getByText("Jan")).toBeInTheDocument();
      expect(screen.getByText("Fev")).toBeInTheDocument();
      expect(screen.getByText("Mar")).toBeInTheDocument();
    });

    it("deve renderizar os dados da tabela", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Total",
        },
        user: {
          id_regional: "001",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      expect(screen.getByText("Campinas")).toBeInTheDocument();
      expect(screen.getByText("São Paulo")).toBeInTheDocument();
    });

    it("deve renderizar inputs editáveis para permissao Total", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Total",
        },
        user: {
          id_regional: "999",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      const inputs = screen.getAllByRole("textbox");

      expect(inputs.length).toBeGreaterThan(0);
    });

    it("deve renderizar inputs editáveis para permissao Parcial na mesma regional", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Parcial",
        },
        user: {
          id_regional: "001",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      const inputs = screen.getAllByRole("textbox");

      expect(inputs.length).toBeGreaterThan(0);
    });

    it("não deve renderizar inputs editáveis para permissao Parcial em regional diferente", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Parcial",
        },
        user: {
          id_regional: "999",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("20")).toBeInTheDocument();
    });
  });

  describe("Edição de valores", () => {
    it("deve chamar setTableData ao editar um valor", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Total",
        },
        user: {
          id_regional: "001",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      const inputs = screen.getAllByRole("textbox");

      fireEvent.change(inputs[0], {
        target: {
          value: "55",
        },
      });

      expect(setTableDataMock).toHaveBeenCalled();
    });

    it("deve remover caracteres não numéricos", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Total",
        },
        user: {
          id_regional: "001",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      const inputs = screen.getAllByRole("textbox");

      fireEvent.change(inputs[0], {
        target: {
          value: "12abc34",
        },
      });

      const callback = setTableDataMock.mock.calls[0][0];

      const result = callback(mockData);

      expect(result[0].jan).toBe("12");
    });

    it("deve limitar o valor para dois dígitos", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Total",
        },
        user: {
          id_regional: "001",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      const inputs = screen.getAllByRole("textbox");

      fireEvent.change(inputs[0], {
        target: {
          value: "123456",
        },
      });

      const callback = setTableDataMock.mock.calls[0][0];

      const result = callback(mockData);

      expect(result[0].jan).toBe("12");
    });

    it("deve salvar null quando o input estiver vazio", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Total",
        },
        user: {
          id_regional: "001",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      const inputs = screen.getAllByRole("textbox");

      fireEvent.change(inputs[0], {
        target: {
          value: "",
        },
      });

      const callback = setTableDataMock.mock.calls[0][0];

      const result = callback(mockData);

      expect(result[0].jan).toBeNull();
    });
  });

  describe("Cobertura de branches", () => {
    it("deve renderizar string vazia quando valor for null", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Total",
        },
        user: {
          id_regional: "001",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      const inputs = screen.getAllByRole("textbox");

      expect(inputs.some((input) => input.getAttribute("value") === "")).toBe(
        true,
      );
    });

    it("deve renderizar tabela vazia corretamente", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao: "Total",
        },
        user: {
          id_regional: "001",
        },
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={[]}
          setTableData={setTableDataMock}
        />,
      );

      expect(screen.getByText("Regional")).toBeInTheDocument();
    });

    it("deve renderizar corretamente quando permissions for undefined", () => {
      mockUseUser.mockReturnValue({
        permissions: undefined,
        user: undefined,
      });

      render(
        <ExecutionCapacityTable
          columns={columns}
          data={mockData}
          setTableData={setTableDataMock}
        />,
      );

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
  });
});
