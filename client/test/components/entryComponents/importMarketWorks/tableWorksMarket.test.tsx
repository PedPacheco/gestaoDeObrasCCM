import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TableMarketWorks } from "@/components/entryComponents/importMarketWorks/tableWorksMarket";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const cookieStore = vi.hoisted<Record<string, unknown>>(() => ({}));

vi.mock("react-virtuoso", () => ({
  TableVirtuoso: ({
    data,
    fixedHeaderContent,
    itemContent,
  }: {
    data: unknown[];
    fixedHeaderContent: () => React.ReactNode;
    itemContent: (index: number) => React.ReactNode;
  }) => (
    <table data-testid="virtuoso-table">
      <thead>{fixedHeaderContent()}</thead>
      <tbody>
        {data.map((_: unknown, i: number) => (
          <tr key={i} data-testid={`row-${i}`}>
            {itemContent(i)}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  TableComponents: {},
}));

vi.mock("@mui/material", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@mui/material")>();
  return {
    ...actual,
    Select: ({
      value,
      onChange,
      children,
      "data-testid": testId,
    }: {
      value: string;
      onChange?: (event: { target: { value: string } }) => void;
      children: React.ReactNode;
      "data-testid"?: string;
    }) => (
      <select
        data-testid={testId ?? "select"}
        value={value}
        onChange={(e) => onChange?.({ target: { value: e.target.value } })}
      >
        {children}
      </select>
    ),
    MenuItem: ({
      value,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => <option value={value}>{children}</option>,
    TableCell: ({
      children,
      className,
    }: {
      children: React.ReactNode;
      className?: string;
    }) => <td className={className}>{children}</td>,
    TableRow: ({ children }: { children: React.ReactNode }) => (
      <tr>{children}</tr>
    ),
    TableHead: ({ children }: { children: React.ReactNode }) => (
      <thead>{children}</thead>
    ),
    TableBody: ({ children }: { children: React.ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    Table: ({ children }: { children: React.ReactNode }) => (
      <table>{children}</table>
    ),
    TableContainer: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Paper: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

vi.mock("@/components/entryComponents/importMarketWorks/deleteButton", () => ({
  DeleteButton: ({ storageKey, id }: { storageKey: string; id: string }) => (
    <button data-testid={`delete-${id}`} aria-label={`delete-${storageKey}`} />
  ),
}));

vi.mock("react-cookie", () => ({
  Cookies: vi.fn().mockImplementation(() => ({
    get: (key: string) => cookieStore[key],
    set: (key: string, value: unknown) => {
      cookieStore[key] = value;
    },
  })),
}));

vi.mock("@/utils/formatValue", () => ({
  FormatCurrency: (value: unknown) =>
    value != null ? `R$ ${Number(value).toFixed(2)}` : "",
}));

vi.mock("@/utils/validDate", () => ({
  isValidDateString: (value: string) =>
    /^\d{4}-\d{2}-\d{2}/.test(String(value)),
}));

const STORAGE_KEY = "test-market-works";

const baseColumns = {
  id: "ID",
  municipio: "Município",
  empreendimento: "Empreendimento",
  moPlanejada: "MO Planejada",
  dataInicio: "Data Início",
  horaInicio: "Hora Início",
  quantidade: "Quantidade",
};

const baseDisplayValues: Record<string, string> = {
  municipio: "name",
  empreendimento: "name",
  moPlanejada: "",
  dataInicio: "",
  horaInicio: "",
  quantidade: "",
};

const municipioOptions = [
  { id: "mun-1", name: "Campinas" },
  { id: "mun-2", name: "São Paulo" },
];

const empreendimentoOptions = [
  { id: "emp-1", name: "Projeto Alpha" },
  { id: "emp-2", name: "Projeto Beta" },
];

const selectOptionsByColumn = {
  municipio: municipioOptions,
  empreendimento: empreendimentoOptions,
};

function makeRow(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "row-001",
    municipio: "mun-1",
    empreendimento: "emp-1",
    moPlanejada: 1500,
    dataInicio: "2024-03-15T00:00:00.000Z",
    horaInicio: "1970-01-01T08:30:00.000Z",
    quantidade: 3,
    anoplan: 2024,
    ...overrides,
  };
}

function renderTable(
  dataRows: Record<string, unknown>[] = [makeRow()],
  columnOverrides: Record<string, string> = baseColumns,
  storageKey = STORAGE_KEY,
) {
  return render(
    <TableMarketWorks
      data={dataRows}
      columns={columnOverrides}
      selectOptionsByColumn={selectOptionsByColumn}
      displayValues={baseDisplayValues}
      storageKey={storageKey}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();

  localStorage.clear();
  Object.keys(cookieStore).forEach((k) => delete cookieStore[k]);
});

// ─── 1. Inicialização & prioridade da fonte de dados ─────────────────────────

describe("Inicialização", () => {
  it("renderiza a estrutura da tabela com os dados fornecidos quando não há armazenamento prévio", () => {
    renderTable();

    expect(screen.getByTestId("virtuoso-table")).toBeInTheDocument();
    expect(screen.getByTestId("row-0")).toBeInTheDocument();
  });

  it("persiste os dados no localStorage e define um cookie no primeiro render", async () => {
    const row = makeRow();
    renderTable([row]);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0].id).toBe(row.id);
      expect(cookieStore[STORAGE_KEY]).toBe(true);
    });
  });

  it("prioriza os dados do localStorage em vez das props quando existe um cookie", async () => {
    const storedRow = makeRow({ quantidade: 99, moPlanejada: 5000 });
    localStorage.setItem(STORAGE_KEY, JSON.stringify([storedRow]));
    cookieStore[STORAGE_KEY] = true;

    renderTable([makeRow({ quantidade: 1, moPlanejada: 100 })]);

    await waitFor(() => {
      expect(screen.getByText("99")).toBeInTheDocument();
    });
  });

  it("usa array vazio quando não há dados no localStorage", async () => {
    localStorage.removeItem(STORAGE_KEY);

    renderTable([]);

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");

      expect(stored).toEqual([]);
    });
  });

  it("lida com array de dados vazio sem quebrar", () => {
    expect(() => renderTable([])).not.toThrow();
    expect(screen.getByTestId("virtuoso-table")).toBeInTheDocument();
  });
});

// ─── 2. Renderização do cabeçalho ────────────────────────────────────────────

describe("Renderização do cabeçalho", () => {
  it("renderiza todos os headers exceto a primeira coluna (id)", () => {
    renderTable();

    Object.values(baseColumns)
      .slice(1)
      .forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
  });

  it("sempre renderiza a coluna fixa 'Ano do Plano'", () => {
    renderTable();
    expect(screen.getByText("Ano do Plano")).toBeInTheDocument();
  });

  it("NÃO renderiza o header da primeira coluna (id)", () => {
    renderTable();
    expect(screen.queryByText("ID")).not.toBeInTheDocument();
  });
});

// ─── 3. Renderização de valores das células ──────────────────────────────────

describe("Renderização de valores das células", () => {
  describe("Colunas monetárias", () => {
    const currencyColumns = [
      "moPlanejada",
      "mo_plan",
      "moEmpresa",
      "moCliente",
    ];

    currencyColumns.forEach((col) => {
      it(`formata "${col}" como moeda BRL`, async () => {
        render(
          <TableMarketWorks
            data={[{ id: "r1", [col]: 2500, anoplan: 2024 }]}
            columns={{ id: "ID", [col]: col }}
            selectOptionsByColumn={{}}
            displayValues={{ [col]: "" }}
            storageKey={`${STORAGE_KEY}-${col}`}
          />,
        );

        await waitFor(() => {
          expect(screen.getByText("R$ 2500.00")).toBeInTheDocument();
        });
      });
    });
  });

  describe("Formatação de datas", () => {
    it("formata uma data ISO completa como DD/MM/AAAA", async () => {
      renderTable([makeRow({ dataInicio: "2024-03-15T00:00:00.000Z" })]);

      await waitFor(() => {
        expect(screen.getByText("15/03/2024")).toBeInTheDocument();
      });
    });

    it("formata data epoch 1970 como HH:mm (apenas hora)", async () => {
      renderTable([makeRow({ horaInicio: "1970-01-01T08:30:00.000Z" })]);

      await waitFor(() => {
        expect(screen.getByText("08:30")).toBeInTheDocument();
      });
    });

    it("renderiza strings não-datas como texto simples", async () => {
      render(
        <TableMarketWorks
          data={[{ id: "r1", descricao: "valor texto simples", anoplan: 2024 }]}
          columns={{ id: "ID", descricao: "Descrição" }}
          selectOptionsByColumn={{}}
          displayValues={{ descricao: "" }}
          storageKey={`${STORAGE_KEY}-plain`}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("valor texto simples")).toBeInTheDocument();
      });
    });
  });

  describe("Precisão numérica", () => {
    it("trunca números com mais de 2 casas decimais", async () => {
      render(
        <TableMarketWorks
          data={[{ id: "r1", quantidade: 3.14159, anoplan: 2024 }]}
          columns={{ id: "ID", quantidade: "Qtd" }}
          selectOptionsByColumn={{}}
          displayValues={{ quantidade: "" }}
          storageKey={`${STORAGE_KEY}-num`}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("3.14")).toBeInTheDocument();
      });
    });

    it("mantém números com até 2 casas decimais", async () => {
      render(
        <TableMarketWorks
          data={[{ id: "r1", quantidade: 3.1, anoplan: 2024 }]}
          columns={{ id: "ID", quantidade: "Qtd" }}
          selectOptionsByColumn={{}}
          displayValues={{ quantidade: "" }}
          storageKey={`${STORAGE_KEY}-num2`}
        />,
      );

      await waitFor(() => {
        expect(screen.getByText("3.1")).toBeInTheDocument();
      });
    });
  });
});

// ─── 4. Detecção de colunas editáveis ────────────────────────────────────────

describe("Heurística de campos editáveis (isEditable)", () => {
  const editableTriggers = [
    { column: "municipio", label: "Município" },
    { column: "parceira", label: "Parceira" },
    { column: "tipo", label: "Tipo" },
    { column: "circuito", label: "Circuito" },
    { column: "empreendimento", label: "Empreendimento" },
  ];

  editableTriggers.forEach(({ column, label }) => {
    it(`renderiza um <Select> para a coluna "${column}"`, async () => {
      const opts = [
        { id: "opt-1", name: "Opção 1" },
        { id: null, name: "Opção 1" },
      ];

      render(
        <TableMarketWorks
          data={[{ id: "r1", [column]: "opt-1", anoplan: 2024 }]}
          columns={{ id: "ID", [column]: label }}
          selectOptionsByColumn={{ [column]: opts }}
          displayValues={{ [column]: "name" }}
          storageKey={`${STORAGE_KEY}-${column}`}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("combobox")).toBeInTheDocument();
      });
    });
  });

  it("NÃO renderiza <Select> para colunas não editáveis", async () => {
    render(
      <TableMarketWorks
        data={[{ id: "r1", quantidade: 5, anoplan: 2024 }]}
        columns={{ id: "ID", quantidade: "Qtd" }}
        selectOptionsByColumn={{}}
        displayValues={{ quantidade: "" }}
        storageKey={`${STORAGE_KEY}-nonedit`}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });
  });

  it("renderiza Select com valor padrão quando valor não existe nas opções", async () => {
    render(
      <TableMarketWorks
        data={[{ id: "r1", municipio: "non-existent-id", anoplan: 2024 }]}
        columns={{ id: "ID", municipio: "Município" }}
        selectOptionsByColumn={{ municipio: municipioOptions }}
        displayValues={{ municipio: "name" }}
        storageKey={`${STORAGE_KEY}-invalid-opt`}
      />,
    );

    const select = await screen.findAllByRole<HTMLSelectElement>("combobox");
    expect(select[0].value).toBe("mun-1");
  });

  it("Caso as opções de seleção venham []", async () => {
    render(
      <TableMarketWorks
        data={[{ id: "r1", municipio: "non-existent-id", anoplan: 2024 }]}
        columns={{ id: "ID", municipio: "Município" }}
        selectOptionsByColumn={[]}
        displayValues={{ municipio: "name" }}
        storageKey={`${STORAGE_KEY}-invalid-opt`}
      />,
    );

    const select = await screen.findAllByRole<HTMLSelectElement>("combobox");
    expect(select[0].value).toBe("");
  });
});

// ─── 5. onUpdate — mutação de estado e persistência ──────────────────────────

describe("onUpdate (atualização de dados)", () => {
  it("atualiza o valor do Select na UI após interação do usuário", async () => {
    const user = userEvent.setup();
    renderTable();

    const select = await screen.findAllByRole<HTMLSelectElement>("combobox");
    await user.selectOptions(select[0], "mun-2");

    expect(select[0].value).toBe("mun-2");
  });

  it("persiste a alteração no localStorage após mudança no Select", async () => {
    const user = userEvent.setup();
    renderTable();

    const select = await screen.findAllByRole<HTMLSelectElement>("combobox");

    await user.selectOptions(select[0], "mun-2");

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      expect(stored[0].municipio).toBe("mun-2");
    });
  });

  it("atualiza o campo anoplan e persiste a alteração", async () => {
    const user = userEvent.setup();
    renderTable([makeRow({ anoplan: 2024 })]);

    const input = screen.getByRole<HTMLInputElement>("spinbutton");
    await user.clear(input);
    await user.type(input, "2025");

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      expect(stored[0].anoplan).toBe("2025");
    });
  });

  it("atualiza apenas a linha alvo quando há múltiplas linhas", async () => {
    const user = userEvent.setup();
    const rows = [
      makeRow({ id: "row-001", municipio: "mun-1" }),
      makeRow({ id: "row-002", municipio: "mun-1" }),
    ];

    renderTable(rows);

    const [firstSelect] = await screen.findAllByRole("combobox");
    await user.selectOptions(firstSelect, "mun-2");

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      expect(stored[0].municipio).toBe("mun-2");
      expect(stored[1].municipio).toBe("mun-1");
    });
  });
});
