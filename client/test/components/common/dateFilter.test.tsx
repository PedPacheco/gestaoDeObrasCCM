import dayjs from "dayjs";
import { describe, expect, it, vi } from "vitest";

import { DateFilter } from "@/components/common/DateFilter";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@mui/x-date-pickers", async () => {
  const actual = await vi.importActual<any>("@mui/x-date-pickers");

  return {
    ...actual,
    DatePicker: ({ value, onChange, format }: any) => {
      return (
        <div>
          <button
            type="button"
            onClick={() => onChange(value)}
            data-testid="open-calendar"
          >
            Abrir calendário
          </button>
          <input
            data-testid="mock-datepicker"
            type="text"
            value={value?.format(format)}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "null") {
                onChange(null);
              } else {
                onChange(dayjs(val, format));
              }
            }}
          />
        </div>
      );
    },
  };
});

describe("Date Filter Component", () => {
  const mockSetType = vi.fn();
  const mockSetDate = vi.fn();
  const today = dayjs("2025-07-17");

  const renderComponent = (type = "day", marginLeft?: undefined | string) => {
    render(
      <DateFilter
        date={today}
        setDate={mockSetDate}
        type={type}
        setType={mockSetType}
        marginLeft={marginLeft}
      />
    );
  };

  it("deve renderizar o seletor de tipo e o datepicker", () => {
    renderComponent();

    expect(screen.getAllByText("Tipo de Filtro")[0]).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renderiza o DatePicker com visualização correta para 'month'", () => {
    renderComponent("month");
    expect(screen.getByRole("textbox")).toHaveValue("07/2025");
  });

  it("altera o tipo de filtro quando selecionado", async () => {
    renderComponent();

    const select = screen.getByRole("combobox");
    expect(select).toHaveTextContent("Por Dia");

    await userEvent.click(select);
    const option = await screen.findByText("Por Mês");
    await userEvent.click(option);

    expect(mockSetType).toHaveBeenCalledWith("month");
  });

  it("chama setDate ao selecionar nova data", () => {
    renderComponent("day");

    const input = screen.getByTestId("mock-datepicker");
    fireEvent.change(input, { target: { value: "15/01/2023" } });

    expect(mockSetDate).toHaveBeenCalledWith(expect.any(dayjs));
  });

  it("Deve utilizar o valor de margin left passado", () => {
    renderComponent("day", "ml-4");

    const input = screen.getByRole("textbox");
    const containerDiv = input.closest("div")?.parentElement?.parentElement;

    console.log(containerDiv);

    expect(containerDiv).toHaveClass("mb-2 ml-4 w-full lg:w-3/4");
    expect(containerDiv).not.toHaveClass("lg:mx-auto");
  });

  it("não chama setDate se valor for null", () => {
    renderComponent();

    const input = screen.getByTestId("mock-datepicker");

    input.dispatchEvent(new Event("change", { bubbles: true }));

    expect(mockSetDate).not.toHaveBeenCalled();
  });
});
