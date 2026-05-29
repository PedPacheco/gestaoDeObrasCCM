// filtersExecutionCapacity.test.tsx

import { fireEvent, render, screen } from "@testing-library/react";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FiltersExecutionCapacity } from "@/components/executionCapacity/filtersExecutionCapacity";

// ============================================================
// HOISTED MOCKS
// ============================================================

const { mockUseUser, datePickerOnChangeMock } = vi.hoisted(() => ({
  mockUseUser: vi.fn(),
  datePickerOnChangeMock: vi.fn(),
}));

// ============================================================
// MOCKS
// ============================================================

vi.mock("@/contexts/userContext", () => ({
  useUser: () => mockUseUser(),
}));

vi.mock("@/utils/formatValue", () => ({
  capitalize: vi.fn(
    (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
  ),
}));

vi.mock("@mui/x-date-pickers", () => ({
  LocalizationProvider: ({ children }: any) => <div>{children}</div>,
  DatePicker: ({ onChange }: any) => (
    <button
      type="button"
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

// ============================================================
// CONSTANTES
// ============================================================

const INTERNAL_ADMIN_PERMISSIONS = {
  id_area: 8,
  permissao_edicao: false,
  is_admin: true,
  tipo_usuario: "INTERNO",
};

const PARTNER_PERMISSIONS = {
  id_area: null,
  permissao_edicao: false,
  is_admin: false,
  tipo_usuario: "PARCEIRA",
};

const DEFAULT_FILTERS_DATA = {
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

const DEFAULT_PROPS = {
  year: "2025",
  setYear: vi.fn(),
  filtersData: DEFAULT_FILTERS_DATA,
  selectedItems: {},
  setSelectedItems: vi.fn(),
  teams: [],
  setTeams: vi.fn(),
};

// ============================================================
// HELPERS
// ============================================================

function mockUserPermissions(permissions: any = INTERNAL_ADMIN_PERMISSIONS) {
  mockUseUser.mockReturnValue({
    permissions,
  });
}

function renderComponent(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  return render(
    <FiltersExecutionCapacity {...DEFAULT_PROPS} {...(overrides as any)} />,
  );
}

function openSelectByIndex(index: number) {
  const selects = screen.getAllByRole("combobox");
  fireEvent.mouseDown(selects[index]);
}

function openLastSelect() {
  const selects = screen.getAllByRole("combobox");
  fireEvent.mouseDown(selects[selects.length - 1]);
}

// ============================================================
// TESTES
// ============================================================

describe("FiltersExecutionCapacity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserPermissions();
  });

  // ----------------------------------------------------------
  // Renderização
  // ----------------------------------------------------------
  describe("Renderização", () => {
    it("deve renderizar o DatePicker", () => {
      renderComponent();

      expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    });

    it("deve renderizar os filtros dinâmicos", () => {
      renderComponent();

      expect(screen.getByLabelText("Regional")).toBeInTheDocument();
      expect(screen.getByLabelText("Turma")).toBeInTheDocument();
    });

    it("deve renderizar o filtro de equipes", () => {
      renderComponent();

      expect(screen.getAllByText("Equipe")[0]).toBeInTheDocument();
    });

    it("deve ocultar o filtro Turma para utilizador PARCEIRA", () => {
      mockUserPermissions(PARTNER_PERMISSIONS);

      renderComponent();

      expect(screen.getByLabelText("Regional")).toBeInTheDocument();
      expect(screen.queryByLabelText("Turma")).not.toBeInTheDocument();
    });

    it("não deve renderizar filtros quando os arrays estiverem vazios", () => {
      renderComponent({
        filtersData: {
          regional: [],
          parceira: [],
        },
      });

      expect(screen.queryByLabelText("Regional")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Turma")).not.toBeInTheDocument();
    });

    it("não deve renderizar filtros quando os valores forem null", () => {
      renderComponent({
        filtersData: {
          regional: null as any,
          parceira: null as any,
        },
      });

      expect(screen.queryByLabelText("Regional")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Turma")).not.toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // DatePicker
  // ----------------------------------------------------------
  describe("DatePicker", () => {
    it("deve chamar setYear com o ano selecionado", () => {
      datePickerOnChangeMock.mockImplementation((onChange) => {
        onChange({
          year: () => 2026,
        });
      });

      renderComponent();

      fireEvent.click(screen.getByTestId("date-picker"));

      expect(DEFAULT_PROPS.setYear).toHaveBeenCalledWith("2026");
    });

    it("deve selecionar o ano atual ao limpar o filtro", () => {
      const currentYear = dayjs().year().toString();

      datePickerOnChangeMock.mockImplementation((onChange) => {
        onChange(null);
      });

      renderComponent();

      fireEvent.click(screen.getByTestId("date-picker"));

      expect(DEFAULT_PROPS.setYear).toHaveBeenCalledWith(currentYear);
    });
  });

  // ----------------------------------------------------------
  // Selects
  // ----------------------------------------------------------
  describe("Selects", () => {
    it("deve chamar setSelectedItems ao alterar um filtro dinâmico", () => {
      renderComponent();

      openSelectByIndex(0);

      fireEvent.click(screen.getByText("Campinas"));

      expect(DEFAULT_PROPS.setSelectedItems).toHaveBeenCalled();
    });

    it("deve chamar setTeams ao alterar o filtro de equipes", () => {
      renderComponent();

      openLastSelect();

      fireEvent.click(screen.getByText("BTZERO"));

      expect(DEFAULT_PROPS.setTeams).toHaveBeenCalled();
    });

    it("deve renderizar todas as opções de equipe", () => {
      renderComponent();

      openLastSelect();

      expect(screen.getByText("BTZERO")).toBeInTheDocument();
      expect(screen.getByText("LM")).toBeInTheDocument();
      expect(screen.getByText("LV")).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // Branches / casos limite
  // ----------------------------------------------------------
  describe("Branches e casos limite", () => {
    it("deve funcionar quando permissions for undefined", () => {
      mockUserPermissions(undefined);

      renderComponent();

      expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    });

    it("deve renderizar corretamente quando teams for null", () => {
      renderComponent({
        teams: null as any,
      });

      expect(screen.getAllByText("Equipe")[0]).toBeInTheDocument();
    });

    it("deve renderizar corretamente quando selectedItems possuir valores", () => {
      renderComponent({
        selectedItems: {
          id_regionalRegionais: ["001"],
        },
      });

      expect(screen.getByLabelText("Regional")).toBeInTheDocument();
    });

    it("deve renderizar corretamente quando displayKey possuir underscore", () => {
      renderComponent({
        filtersData: {
          tipo: [
            {
              id: "1",
              tipo_obra: "Item 1",
              id_grupo: 3,
            },
          ],
        } as any,
      });

      expect(screen.getByLabelText("Tipo obra")).toBeInTheDocument();
    });
  });
});
