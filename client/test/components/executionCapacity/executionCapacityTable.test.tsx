import { ExecutionCapacityTable } from "@/components/executionCapacity/executionCapacityTable";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ============================================================
// vi.hoisted — estado mutável acessível nos mocks
// ============================================================

const { mockUserState } = vi.hoisted(() => ({
  mockUserState: {
    current: {
      permissions: {
        tipo_usuario: "ADMIN",
        is_admin: false,
        id_area: 8,
        permissao_edicao: true,
      },
      user: {
        id_regional: 1,
      },
    } as any,
  },
}));

// ============================================================
// MOCKS
// ============================================================

vi.mock("@/contexts/userContext", () => ({
  useUser: vi.fn(() => mockUserState.current),
}));

// Mock leve do MUI para máxima performance
vi.mock("@mui/material", () => {
  const React = require("react");

  const createComponent =
    (tag: string, testId: string) =>
    ({ children, className, ...props }: any) =>
      React.createElement(
        tag,
        {
          "data-testid": testId,
          className,
          ...props,
        },
        children,
      );

  return {
    Paper: createComponent("div", "mui-paper"),

    TableContainer: ({ children, className }: any) =>
      React.createElement(
        "div",
        {
          "data-testid": "table-container",
          className,
        },
        children,
      ),

    Table: ({ children, stickyHeader }: any) =>
      React.createElement(
        "table",
        {
          "data-testid": "table",
          "data-sticky-header": String(Boolean(stickyHeader)),
        },
        children,
      ),

    TableHead: ({ children }: any) =>
      React.createElement("thead", { "data-testid": "table-head" }, children),

    TableBody: ({ children, className }: any) =>
      React.createElement(
        "tbody",
        {
          "data-testid": "table-body",
          className,
        },
        children,
      ),

    TableRow: ({ children, className }: any) =>
      React.createElement(
        "tr",
        {
          "data-testid": "table-row",
          className,
        },
        children,
      ),

    TableCell: ({ children, className }: any) =>
      React.createElement(
        "td",
        {
          "data-testid": "table-cell",
          className,
        },
        children,
      ),

    TextField: ({
      value,
      onChange,
      type,
      className,
      size,
      variant,
      inputProps,
      InputProps,
    }: any) =>
      React.createElement("input", {
        "data-testid": "capacity-input",
        value,
        onChange,
        type,
        className,
        style: inputProps?.style,
        pattern: inputProps?.pattern,
        "data-size": size,
        "data-variant": variant,
        "data-disable-underline": String(Boolean(InputProps?.disableUnderline)),
      }),
  };
});

// ============================================================
// IMPORT DO COMPONENTE
// ============================================================

// ============================================================
// HELPERS
// ============================================================

const columns = {
  regional: "Regional",
  id_regional: "ID Regional",
  jan: "Jan",
  fev: "Fev",
  mar: "Mar",
  total: "Total",
};

const defaultData = [
  {
    id_regional: 1,
    regional: "Norte",
    jan: "10",
    fev: null,
    mar: 5,
    total: 100,
  },
  {
    id_regional: 2,
    regional: "Sul",
    jan: "20",
    fev: "3",
    mar: null,
    total: 200,
  },
];

const setTableData = vi.fn();

const renderComponent = (
  overrides: Partial<{
    columns: typeof columns;
    data: typeof defaultData;
    setTableData: typeof setTableData;
  }> = {},
) =>
  render(
    <ExecutionCapacityTable
      columns={overrides.columns ?? columns}
      data={overrides.data ?? defaultData}
      setTableData={overrides.setTableData ?? setTableData}
    />,
  );

const setUserContext = ({
  permissions,
  user,
}: {
  permissions?: any;
  user?: any;
}) => {
  mockUserState.current = {
    permissions:
      permissions === undefined
        ? {
            tipo_usuario: "ADMIN",
            is_admin: false,
            id_area: 8,
            permissao_edicao: true,
          }
        : permissions,
    user:
      user === undefined
        ? {
            id_regional: 1,
          }
        : user,
  };
};

const applyLastSetTableDataUpdater = (baseData = defaultData) => {
  const updater = setTableData.mock.calls.at(-1)?.[0];

  if (typeof updater !== "function") {
    throw new Error("setTableData não recebeu uma função updater");
  }

  return updater(baseData);
};

// ============================================================
// TESTES
// ============================================================

describe("ExecutionCapacityTable", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    setUserContext({
      permissions: {
        tipo_usuario: "ADMIN",
        is_admin: false,
        id_area: 8,
        permissao_edicao: true,
      },
      user: {
        id_regional: 1,
      },
    });
  });

  // ----------------------------------------------------------
  // Renderização base
  // ----------------------------------------------------------
  describe("Renderização", () => {
    it("deve renderizar sem erros", () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it("deve renderizar o TableContainer com as classes esperadas", () => {
      renderComponent();

      const container = screen.getByTestId("table-container");

      expect(container).toBeInTheDocument();
      expect(container.className).toContain("w-full");
      expect(container.className).toContain("min-h-96");
      expect(container.className).toContain("overflow-y-auto");
    });

    it("deve renderizar a tabela com stickyHeader", () => {
      renderComponent();

      expect(screen.getByTestId("table")).toHaveAttribute(
        "data-sticky-header",
        "true",
      );
    });

    it("deve renderizar o TableBody com altura configurada", () => {
      renderComponent();

      const body = screen.getByTestId("table-body");

      expect(body.className).toContain("h-[620px]");
      expect(body.className).toContain("2xl:h-full");
    });

    it("deve renderizar uma linha de header e uma linha para cada item", () => {
      renderComponent();

      const rows = screen.getAllByTestId("table-row");

      expect(rows).toHaveLength(defaultData.length + 1);
    });
  });

  // ----------------------------------------------------------
  // Cabeçalhos / colunas
  // ----------------------------------------------------------
  describe("Cabeçalhos", () => {
    it("deve renderizar todos os cabeçalhos informados em columns", () => {
      renderComponent();

      Object.values(columns).forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it("deve aplicar classes base nos cabeçalhos", () => {
      renderComponent();

      const header = screen.getByText("Regional");

      expect(header.className).toContain("py-1");
      expect(header.className).toContain("px-2");
      expect(header.className).toContain("text-center");
      expect(header.className).toContain("font-semibold");
      expect(header.className).toContain("bg-[#53FF75]");
    });

    it("deve aplicar borda nos cabeçalhos das colunas editáveis", () => {
      renderComponent();

      expect(screen.getByText("Jan").className).toContain("border-l-2");
      expect(screen.getByText("Fev").className).toContain("border-l-2");
      expect(screen.getByText("Mar").className).toContain("border-l-2");
    });

    it("não deve aplicar borda de coluna editável em colunas não editáveis", () => {
      renderComponent();

      expect(screen.getByText("Regional").className).not.toContain(
        "border-l-2",
      );
      expect(screen.getByText("ID Regional").className).not.toContain(
        "border-l-2",
      );
      expect(screen.getByText("Total").className).not.toContain("border-l-2");
    });
  });

  // ----------------------------------------------------------
  // Dados da tabela
  // ----------------------------------------------------------
  describe("Dados", () => {
    it("deve renderizar os valores não editáveis das linhas", () => {
      renderComponent();

      expect(screen.getByText("Norte")).toBeInTheDocument();
      expect(screen.getByText("Sul")).toBeInTheDocument();
      expect(screen.getByText("100")).toBeInTheDocument();
      expect(screen.getByText("200")).toBeInTheDocument();
    });

    it("deve renderizar valores editáveis como input quando o utilizador pode editar a regional", () => {
      renderComponent();

      const inputs = screen.getAllByTestId("capacity-input");

      // Apenas a linha com id_regional = 1 é editável.
      // Colunas editáveis no columns usado: jan, fev, mar.
      expect(inputs).toHaveLength(3);
      expect(inputs[0]).toHaveValue("10");
      expect(inputs[1]).toHaveValue("");
      expect(inputs[2]).toHaveValue("5");
    });

    it("deve renderizar os meses da linha não permitida como texto, não input", () => {
      renderComponent();

      expect(screen.getByText("20")).toBeInTheDocument();
      expect(screen.getByText("3")).toBeInTheDocument();

      const inputs = screen.getAllByTestId("capacity-input");
      expect(inputs).toHaveLength(3);
    });

    it("deve aplicar classes base nas células do corpo", () => {
      renderComponent();

      const cells = screen.getAllByTestId("table-cell");
      const bodyCell = cells.find((cell) => cell.textContent === "Norte");

      expect(bodyCell?.className).toContain("p-0");
      expect(bodyCell?.className).toContain("pl-4");
      expect(bodyCell?.className).toContain("h-16");
      expect(bodyCell?.className).toContain("text-center");
    });

    it("deve aplicar borda nas células de colunas editáveis", () => {
      renderComponent();

      const input = screen.getAllByTestId("capacity-input")[0];
      const editableCell = input.closest("td");

      expect(editableCell?.className).toContain("border-l-2");
      expect(editableCell?.className).toContain("border-solid");
    });
  });

  // ----------------------------------------------------------
  // Permissões
  // ----------------------------------------------------------
  describe("Permissões de edição", () => {
    it("deve permitir edição quando tipo_usuario é PARCEIRA", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "PARCEIRA",
          is_admin: false,
          id_area: 1,
          permissao_edicao: false,
        },
        user: {
          id_regional: 1,
        },
      });

      renderComponent();

      expect(screen.getAllByTestId("capacity-input")).toHaveLength(3);
    });

    it("deve permitir edição quando is_admin é true", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "ADMIN",
          is_admin: true,
          id_area: 1,
          permissao_edicao: false,
        },
        user: {
          id_regional: 1,
        },
      });

      renderComponent();

      expect(screen.getAllByTestId("capacity-input")).toHaveLength(3);
    });

    it("deve permitir edição quando id_area é 8 e permissao_edicao é true", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "ADMIN",
          is_admin: false,
          id_area: 8,
          permissao_edicao: true,
        },
        user: {
          id_regional: 1,
        },
      });

      renderComponent();

      expect(screen.getAllByTestId("capacity-input")).toHaveLength(3);
    });

    it("não deve permitir edição quando id_area é 8 mas permissao_edicao é false", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "ADMIN",
          is_admin: false,
          id_area: 8,
          permissao_edicao: false,
        },
        user: {
          id_regional: 1,
        },
      });

      renderComponent();

      expect(screen.queryAllByTestId("capacity-input")).toHaveLength(0);
    });

    it("não deve permitir edição quando não tem nenhuma permissão válida", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "ADMIN",
          is_admin: false,
          id_area: 3,
          permissao_edicao: true,
        },
        user: {
          id_regional: 1,
        },
      });

      renderComponent();

      expect(screen.queryAllByTestId("capacity-input")).toHaveLength(0);
    });

    it("não deve permitir edição quando permissions é null", () => {
      setUserContext({
        permissions: null,
        user: {
          id_regional: 1,
        },
      });

      renderComponent();

      expect(screen.queryAllByTestId("capacity-input")).toHaveLength(0);
    });

    it("não deve permitir edição quando user é null", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "ADMIN",
          is_admin: true,
          id_area: 8,
          permissao_edicao: true,
        },
        user: null,
      });

      renderComponent();

      expect(screen.queryAllByTestId("capacity-input")).toHaveLength(0);
    });

    it("não deve permitir edição quando user.id_regional é diferente do item.id_regional", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "ADMIN",
          is_admin: true,
          id_area: 8,
          permissao_edicao: true,
        },
        user: {
          id_regional: 99,
        },
      });

      renderComponent();

      expect(screen.queryAllByTestId("capacity-input")).toHaveLength(0);
    });

    it("deve editar apenas a linha cuja regional coincide com user.id_regional", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "ADMIN",
          is_admin: true,
          id_area: 8,
          permissao_edicao: true,
        },
        user: {
          id_regional: 2,
        },
      });

      renderComponent();

      const inputs = screen.getAllByTestId("capacity-input");

      expect(inputs).toHaveLength(3);
      expect(inputs[0]).toHaveValue("20");
      expect(inputs[1]).toHaveValue("3");
      expect(inputs[2]).toHaveValue("");
    });

    it("não deve permitir edição quando id_area é string '8', pois a comparação é estrita", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "ADMIN",
          is_admin: false,
          id_area: "8",
          permissao_edicao: true,
        },
        user: {
          id_regional: 1,
        },
      });

      renderComponent();

      expect(screen.queryAllByTestId("capacity-input")).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------
  // TextField
  // ----------------------------------------------------------
  describe("Campos editáveis", () => {
    it("deve renderizar TextField com as props corretas", () => {
      renderComponent();

      const input = screen.getAllByTestId("capacity-input")[0];

      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("data-size", "small");
      expect(input).toHaveAttribute("data-variant", "standard");
      expect(input).toHaveAttribute("data-disable-underline", "true");
      expect(input).toHaveAttribute("pattern", "[0-9]*");
      expect(input.className).toContain("w-full");
      expect(input).toHaveStyle({ textAlign: "center" });
    });

    it("deve mostrar string vazia no input quando o valor da célula é null", () => {
      renderComponent();

      const inputs = screen.getAllByTestId("capacity-input");

      // fev da primeira linha é null
      expect(inputs[1]).toHaveValue("");
    });
  });

  // ----------------------------------------------------------
  // handleValueChange
  // ----------------------------------------------------------
  describe("Alteração de valores", () => {
    it("deve chamar setTableData com função updater ao alterar um campo", () => {
      renderComponent();

      fireEvent.change(screen.getAllByTestId("capacity-input")[0], {
        target: { value: "12" },
      });

      expect(setTableData).toHaveBeenCalledTimes(1);
      expect(typeof setTableData.mock.calls[0][0]).toBe("function");
    });

    it("deve manter apenas números digitados", () => {
      renderComponent();

      fireEvent.change(screen.getAllByTestId("capacity-input")[0], {
        target: { value: "a1b2c" },
      });

      const updated = applyLastSetTableDataUpdater();

      expect(updated[0].jan).toBe("12");
    });

    it("deve limitar o valor a 2 dígitos", () => {
      renderComponent();

      fireEvent.change(screen.getAllByTestId("capacity-input")[0], {
        target: { value: "987654" },
      });

      const updated = applyLastSetTableDataUpdater();

      expect(updated[0].jan).toBe("98");
    });

    it("deve converter valor vazio para null", () => {
      renderComponent();

      fireEvent.change(screen.getAllByTestId("capacity-input")[0], {
        target: { value: "" },
      });

      const updated = applyLastSetTableDataUpdater();

      expect(updated[0].jan).toBeNull();
    });

    it("deve converter texto sem números para null", () => {
      renderComponent();

      fireEvent.change(screen.getAllByTestId("capacity-input")[0], {
        target: { value: "abc" },
      });

      const updated = applyLastSetTableDataUpdater();

      expect(updated[0].jan).toBeNull();
    });

    it("deve atualizar a coluna correta da linha correta", () => {
      renderComponent();

      const inputs = screen.getAllByTestId("capacity-input");

      // inputs da primeira linha: jan, fev, mar
      fireEvent.change(inputs[1], {
        target: { value: "7" },
      });

      const updated = applyLastSetTableDataUpdater();

      expect(updated[0].jan).toBe("10");
      expect(updated[0].fev).toBe("7");
      expect(updated[0].mar).toBe(5);
    });

    it("deve preservar os restantes campos da linha alterada", () => {
      renderComponent();

      fireEvent.change(screen.getAllByTestId("capacity-input")[0], {
        target: { value: "11" },
      });

      const updated = applyLastSetTableDataUpdater();

      expect(updated[0]).toEqual({
        ...defaultData[0],
        jan: "11",
      });
    });

    it("deve preservar as restantes linhas", () => {
      renderComponent();

      fireEvent.change(screen.getAllByTestId("capacity-input")[0], {
        target: { value: "11" },
      });

      const updated = applyLastSetTableDataUpdater();

      expect(updated[1]).toEqual(defaultData[1]);
    });

    it("deve atualizar a segunda linha quando a regional do utilizador for 2", () => {
      setUserContext({
        permissions: {
          tipo_usuario: "ADMIN",
          is_admin: true,
          id_area: 8,
          permissao_edicao: true,
        },
        user: {
          id_regional: 2,
        },
      });

      renderComponent();

      fireEvent.change(screen.getAllByTestId("capacity-input")[0], {
        target: { value: "44" },
      });

      const updated = applyLastSetTableDataUpdater();

      expect(updated[0]).toEqual(defaultData[0]);
      expect(updated[1].jan).toBe("44");
    });
  });

  // ----------------------------------------------------------
  // Columns dinâmicas
  // ----------------------------------------------------------
  describe("Columns dinâmicas", () => {
    it("deve respeitar a ordem das colunas recebidas", () => {
      const customColumns = {
        jan: "Janeiro",
        regional: "Regional",
        total: "Total",
      };

      const { container } = renderComponent({
        columns: customColumns as any,
      });

      const headerRow = within(container).getAllByTestId("table-row")[0];

      const headers = within(headerRow)
        .getAllByTestId("table-cell")
        .map((cell) => cell.textContent);

      expect(headers).toEqual(["Janeiro", "Regional", "Total"]);
    });

    it("deve criar inputs apenas para colunas editáveis presentes em columns", () => {
      const customColumns = {
        regional: "Regional",
        jan: "Janeiro",
        total: "Total",
      };

      const { container } = renderComponent({
        columns: customColumns as any,
      });

      const inputs = within(container).getAllByTestId("capacity-input");

      expect(inputs).toHaveLength(1);
      expect(inputs[0]).toHaveValue("10");
    });

    it("não deve criar inputs quando columns não contém meses editáveis", () => {
      const customColumns = {
        regional: "Regional",
        total: "Total",
      };

      const { container } = renderComponent({
        columns: customColumns as any,
      });

      const inputs = within(container).queryAllByTestId("capacity-input");

      expect(inputs).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------
  // Data vazio
  // ----------------------------------------------------------
  describe("Data vazio", () => {
    it("deve renderizar apenas o cabeçalho quando data está vazio", () => {
      renderComponent({
        data: [],
      });

      const rows = screen.getAllByTestId("table-row");

      expect(rows).toHaveLength(1);
      expect(screen.queryAllByTestId("capacity-input")).toHaveLength(0);
    });
  });
});
