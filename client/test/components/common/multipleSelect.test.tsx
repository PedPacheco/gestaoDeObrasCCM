import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

describe("Multiple select component", () => {
  const label = "Serviços";
  const basicItems = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);
  const mockSetSelectedItem = vi.fn();

  const renderComponent = (
    props?: Partial<React.ComponentProps<typeof MultipleSelectComponent>>
  ) => {
    render(
      <MultipleSelectComponent
        label={label}
        menuItems={basicItems}
        selectedItem={[]}
        setSelectedItem={mockSetSelectedItem}
        {...props}
      />
    );
  };

  it("Permite selecionar múltiplos itens", async () => {
    renderComponent();

    fireEvent.mouseDown(screen.getAllByLabelText("Serviços")[0]);
    const option = await screen.findByText("Item 1");
    fireEvent.click(option);

    fireEvent.mouseDown(screen.getAllByLabelText("Serviços")[0]);
    const option2 = await screen.findByText("Item 2");
    fireEvent.click(option2);

    expect(mockSetSelectedItem).toHaveBeenCalledTimes(2);
    expect(mockSetSelectedItem).toHaveBeenCalledWith(["Item 1"]);
    expect(mockSetSelectedItem).toHaveBeenCalledWith(["Item 2"]);
  });

  it("Carrega mais itens ao rolar até o fim ", async () => {
    renderComponent();

    fireEvent.mouseDown(screen.getByLabelText("Serviços"));

    const menuList = screen.getByRole("listbox");

    fireEvent.scroll(menuList, {
      scrollHeight: 9999,
      scrollTop: 9999,
      clientHeight: 100,
    });

    await waitFor(() => {
      const items = screen.getAllByRole("option");
      expect(items.length).toBeGreaterThan(20);
    });
  });

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

    fireEvent.mouseDown(screen.getByLabelText("Serviços"));
    expect(screen.getByText("Primeiro")).toBeInTheDocument();
    expect(screen.getByText("Segundo")).toBeInTheDocument();
  });

  it("usa array vazio como valor padrão se selectedItem for undefined", () => {
    render(
      <MultipleSelectComponent
        label="Serviços"
        menuItems={basicItems}
        selectedItem={undefined as any}
        setSelectedItem={mockSetSelectedItem}
      />
    );

    const select = screen.getByRole("combobox");
    expect(select).not.toHaveTextContent(/Item/);
  });
});
