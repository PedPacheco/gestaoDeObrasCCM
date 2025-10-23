import { SelectComponent } from "@/components/common/Select";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("Select component", () => {
  const label = "Serviços";
  const basicItems = Array.from({ length: 10 }, (_, i) => `Item ${i + 1}`);
  const mockSetSelectedItem = vi.fn();

  const renderComponent = (
    props?: Partial<React.ComponentProps<typeof SelectComponent>>
  ) => {
    render(
      <SelectComponent
        label={label}
        menuItems={basicItems}
        selectedItem={""}
        setSelectedItem={mockSetSelectedItem}
        {...props}
      />
    );
  };

  // it("renderiza com os 10 itens visíveis e o label da página", () => {
  //   renderComponent();

  //   fireEvent.mouseDown(screen.getByRole("combobox"));

  //   expect(screen.getByText("Serviços")).toBeInTheDocument();
  // });

  it("renderiza corretamente com valueKey e displayKey", () => {
    const customItems = [
      { id: 1, name: "Primeiro" },
      { id: 2, name: "Segundo" },
    ];

    renderComponent({
      menuItems: customItems,
      valueKey: "id",
      displayKey: "name",
    });

    fireEvent.mouseDown(screen.getByRole("combobox"));
    expect(screen.getByText("Primeiro")).toBeInTheDocument();
    expect(screen.getByText("Segundo")).toBeInTheDocument();
  });

  it("Permite selecionar 1 item", async () => {
    renderComponent();

    fireEvent.mouseDown(screen.getByRole("combobox"));
    const option = await screen.findByText("Item 1");
    fireEvent.click(option);

    expect(mockSetSelectedItem).toHaveBeenCalledTimes(1);
    expect(mockSetSelectedItem).toHaveBeenCalledWith("Item 1");
  });

  it("Mostrar botão para edição do valor do motivo de suspensão", async () => {
    const mockButton = <button>Editar</button>;

    renderComponent({ editButton: mockButton });

    expect(screen.getByText("Editar")).toBeInTheDocument();
  });
});
