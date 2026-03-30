import { describe, expect, it, vi } from "vitest";

import { EditableColumn } from "@/components/details/workDetails/editableColumn";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/common/Select", () => {
  return {
    __esModule: true,
    SelectComponent: ({
      label,
      menuItems,
      selectedItem,
      setSelectedItem,
      valueKey,
      displayKey,
      disabled,
    }: any) => (
      <div data-testid="mock-select-component">
        <span>{label}</span>
        <select
          data-testid="mock-select"
          value={selectedItem}
          disabled={disabled}
          onChange={(e) => setSelectedItem?.(e.target.value)}
        >
          {menuItems.map((item: any, index: number) => (
            <option key={index} value={item[valueKey]?.toString() || ""}>
              {item[displayKey] || ""}
            </option>
          ))}
        </select>
      </div>
    ),
  };
});

vi.mock("@/components/details/workDetails/DataItem", () => {
  return {
    default: ({ label, value, isEdit, onEdit }: any) => {
      return (
        <div data-testid="mock-data-item">
          <span>{label}</span>{" "}
          {isEdit && (
            <input
              data-testid="mock-data-input"
              value={value}
              onChange={(e) => onEdit(e.target.value)}
            />
          )}{" "}
        </div>
      );
    },
  };
});

vi.mock("@/contexts/userContext", () => {
  return {
    useUser: () => ({
      user: {
        id: 1,
        username: "test-user",
        id_regional: "001",
        nome_usuario: "Test User",
        email: "test@example.com",
      },
      permissions: {
        id: 1,
        username: "test-user",
        permissao: "total",
        permissao_visualizacao: "total",
      },
    }),
  };
});

describe("EditableColumn component", () => {
  const mockFormData = {
    id_turma: "2",
    id_status: 2,
    data_empreitamento: "",
    tipo_ads: "",
  };

  const options = {
    parceira: [
      { id: 1, turma: "Não definido" },
      { id: 2, turma: "Engelmig" },
    ],
    status: [
      { id: 1, status: "Aguardando" },
      { id: 2, status: "programado" },
    ],
  };

  it("deve renderizar os campos corretamente", () => {
    const onHandleChange = vi.fn();

    render(
      <EditableColumn
        data={mockFormData}
        options={options}
        onHandleChange={onHandleChange}
      />,
    );

    expect(screen.getByText("Parceira")).toBeInTheDocument();
    expect(screen.getByText("Status da Obra")).toBeInTheDocument();
    expect(screen.getByText("Data empreitamento")).toBeInTheDocument();
    expect(screen.getByText("Tipo ADS")).toBeInTheDocument();
  });

  it("deve usar valor padrão '1' quando id_turma ou id_status não é enviado", () => {
    const onHandleChange = vi.fn();

    render(
      <EditableColumn
        data={{
          ...mockFormData,
          id_turma: undefined as unknown as string,
          id_status: null as unknown as number,
        }}
        options={options}
        onHandleChange={onHandleChange}
      />,
    );

    const select = screen.getAllByTestId("mock-select")[0] as HTMLSelectElement;
    expect(select.value).toBe("1");
  });

  it("deve chamar onHandleChange ao alterar select", async () => {
    const user = userEvent.setup();
    const onHandleChange = vi.fn();

    render(
      <EditableColumn
        data={mockFormData}
        options={options}
        onHandleChange={onHandleChange}
      />,
    );

    const selects = screen.getAllByTestId("mock-select") as HTMLSelectElement[];
    const input = screen.getByTestId("mock-data-input");

    await user.selectOptions(selects[0], "2");
    await user.selectOptions(selects[1], "2");
    await user.selectOptions(selects[2], "CONVENCIONAL");
    await user.type(input, "2");

    expect(onHandleChange).toHaveBeenCalledWith("id_turma", "2");
    expect(onHandleChange).toHaveBeenCalledWith("id_status", "2");
    expect(onHandleChange).toHaveBeenLastCalledWith("data_empreitamento", "2");
    expect(onHandleChange).toHaveBeenCalledWith("tipo_ads", "CONVENCIONAL");

    expect(onHandleChange).toHaveBeenCalledTimes(4);
  });
});
