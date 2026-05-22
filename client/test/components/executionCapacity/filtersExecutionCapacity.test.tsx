// filtersExecutionCapacity.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FiltersExecutionCapacity } from "@/components/executionCapacity/filtersExecutionCapacity";
import dayjs from "dayjs";

// =========================
// MOCKS
// =========================

const mockUseUser = vi.fn();

vi.mock("@/contexts/userContext", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/utils/formatValue", () => ({
  capitalize: vi.fn(
    (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
  ),
}));

const datePickerOnChangeMock = vi.fn();

// Mock DatePicker
vi.mock("@mui/x-date-pickers", () => ({
  LocalizationProvider: ({ children }: any) => <div>{children}</div>,
  DatePicker: ({ onChange }: any) => (
    <button
      data-testid="date-picker"
      onClick={() => datePickerOnChangeMock(onChange)}
    >
      DatePicker
    </button>
  ),
}));

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: {},
}));

describe("FiltersExecutionCapacity", () => {
  const setYearMock = vi.fn();
  const setSelectedItemsMock = vi.fn();
  const setTeamsMock = vi.fn();

  const defaultFiltersData = {
    regional: [
      {
        id: "1",
        regional: "Campinas",
      },
    ],
    parceira: [
      {
        id: "1",
        turma: "Turma A",
      },
    ],
  };

  const defaultProps = {
    year: "2025",
    setYear: setYearMock,
    filtersData: defaultFiltersData,
    selectedItems: {},
    setSelectedItems: setSelectedItemsMock,
    teams: [],
    setTeams: setTeamsMock,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Renderização", () => {
    it("deve renderizar DatePicker", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    });

    it("deve renderizar filtros dinamicamente", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      expect(screen.getByLabelText("Regional")).toBeInTheDocument();
      expect(screen.getByLabelText("Turma")).toBeInTheDocument();
    });

    it("deve renderizar filtro de equipes", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      expect(screen.getAllByText("Equipe")[0]).toBeInTheDocument();
    });

    it("deve ocultar filtro turma para visão parcial", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "parcial",
        },
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      expect(screen.getByLabelText("Regional")).toBeInTheDocument();

      expect(screen.queryByLabelText("Turma")).not.toBeInTheDocument();
    });

    it("deve renderizar turma para visão total", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      expect(screen.getByLabelText("Turma")).toBeInTheDocument();
    });

    it("não deve renderizar filtros vazios", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(
        <FiltersExecutionCapacity
          {...defaultProps}
          filtersData={{
            regional: [],
            parceira: [],
          }}
        />,
      );

      expect(screen.queryByLabelText("Regional")).not.toBeInTheDocument();

      expect(screen.queryByLabelText("Turma")).not.toBeInTheDocument();
    });

    it("não deve renderizar filtros null", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(
        <FiltersExecutionCapacity
          {...defaultProps}
          filtersData={{
            regional: null as any,
            parceira: null as any,
          }}
        />,
      );

      expect(screen.queryByLabelText("Regional")).not.toBeInTheDocument();
    });
  });

  describe("DatePicker", () => {
    it("deve chamar setYear ao alterar ano", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      datePickerOnChangeMock.mockImplementation((onChange) => {
        onChange({
          year: () => 2026,
        });
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      fireEvent.click(screen.getByTestId("date-picker"));

      expect(setYearMock).toHaveBeenCalledWith("2026");
    });

    it("deve selecionar o ano atual ao limpar o filtro", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      const currentYear = dayjs().year().toString();

      datePickerOnChangeMock.mockImplementation((onChange) => {
        onChange(null);
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      fireEvent.click(screen.getByTestId("date-picker"));

      expect(setYearMock).toHaveBeenCalledWith(currentYear);
    });
  });

  describe("Selects", () => {
    it("deve chamar setSelectedItems ao alterar filtro", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      const selects = screen.getAllByRole("combobox");

      fireEvent.mouseDown(selects[0]);

      const option = screen.getByText("Campinas");

      fireEvent.click(option);

      expect(setSelectedItemsMock).toHaveBeenCalled();
    });

    it("deve chamar setTeams ao alterar equipes", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      const selects = screen.getAllByRole("combobox");

      const teamSelect = selects[selects.length - 1];

      fireEvent.mouseDown(teamSelect);

      fireEvent.click(screen.getByText("BTZERO"));

      expect(setTeamsMock).toHaveBeenCalled();
    });

    it("deve renderizar todas as equipes", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      const selects = screen.getAllByRole("combobox");

      fireEvent.mouseDown(selects[selects.length - 1]);

      expect(screen.getByText("BTZERO")).toBeInTheDocument();
      expect(screen.getByText("LM")).toBeInTheDocument();
      expect(screen.getByText("LV")).toBeInTheDocument();
    });
  });

  describe("Cobertura de branches", () => {
    it("deve funcionar quando permissions for undefined", () => {
      mockUseUser.mockReturnValue({
        permissions: undefined,
      });

      render(<FiltersExecutionCapacity {...defaultProps} />);

      expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    });

    it("deve renderizar corretamente quando teams for null", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(<FiltersExecutionCapacity {...defaultProps} teams={null} />);

      expect(screen.getAllByText("Equipe")[0]).toBeInTheDocument();
    });

    it("deve renderizar corretamente quando selectedItems possuir valores", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(
        <FiltersExecutionCapacity
          {...defaultProps}
          selectedItems={{
            id_regionalRegionais: ["001"],
          }}
        />,
      );

      expect(screen.getByLabelText("Regional")).toBeInTheDocument();
    });

    it("deve renderizar corretamente quando displayKey possuir underscore", () => {
      mockUseUser.mockReturnValue({
        permissions: {
          permissao_visualizacao: "total",
        },
      });

      render(
        <FiltersExecutionCapacity
          {...defaultProps}
          filtersData={{
            tipo: [
              {
                id: "1",
                tipo_obra: "Item 1",
                id_grupo: 3,
              },
            ],
          }}
        />,
      );

      expect(screen.getByLabelText("Tipo obra")).toBeInTheDocument();
    });
  });
});
