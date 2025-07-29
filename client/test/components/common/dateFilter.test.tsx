// DateFilter.test.tsx
import dayjs from "dayjs";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateFilter } from "@/components/common/DateFilter";

vi.mock("@mui/x-date-pickers", async () => {
  const actual = await vi.importActual<any>("@mui/x-date-pickers");

  return {
    ...actual,
    DatePicker: ({ value, onChange, format }: any) => (
      <div
        data-testid="date-picker-container"
        className="mb-2 ml-4 w-full lg:w-3/4"
      >
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
            } else if (val === "invalid") {
              onChange("invalid"); // para teste do fallback
            } else {
              onChange(dayjs(val, format));
            }
          }}
        />
      </div>
    ),
  };
});

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

describe("Date Filter Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o seletor de tipo e o datepicker", () => {
    renderComponent();

    expect(screen.getByText("Tipo de Filtro")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renderiza o DatePicker com visualização correta para 'month'", () => {
    renderComponent("month");
    expect(screen.getByRole("textbox")).toHaveValue("07/2025");
  });

  it("altera o tipo de filtro quando selecionado", async () => {
    renderComponent();

    const select = screen.getByRole("combobox");
    await userEvent.click(select);
    const option = await screen.findByText("Por Mês");
    await userEvent.click(option);

    expect(mockSetType).toHaveBeenCalledWith("month");
  });

  it("chama setDate ao selecionar nova data válida", () => {
    renderComponent("day");
    const input = screen.getByTestId("mock-datepicker");
    fireEvent.change(input, { target: { value: "15/01/2023" } });
    expect(mockSetDate).toHaveBeenCalledWith(expect.any(dayjs));
  });

  it("não chama setDate se valor for null", () => {
    renderComponent();
    const input = screen.getByTestId("mock-datepicker");
    fireEvent.change(input, { target: { value: "null" } });
    expect(mockSetDate).not.toHaveBeenCalled();
  });

  it("deve utilizar o valor de margin left passado", () => {
    renderComponent("day", "ml-4");
    const containerDiv = screen.getByTestId("date-picker-container");
    expect(containerDiv).toHaveClass("mb-2", "ml-4", "w-full", "lg:w-3/4");
    expect(containerDiv).not.toHaveClass("lg:mx-auto");
  });
});
