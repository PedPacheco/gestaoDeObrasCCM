import { render, screen, fireEvent } from "@testing-library/react";
import { DateFilter } from "@/components/common/DateFilter";
import dayjs from "dayjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

// MOCK do MUI DatePicker para simplificar o teste
vi.mock("@mui/x-date-pickers", () => ({
  DatePicker: ({ label, value, onChange, className }: any) => (
    <input
      type="text"
      aria-label={label}
      data-testid={label}
      value={value ? value.format("DD/MM/YYYY") : ""}
      onChange={(e) => onChange(dayjs(e.target.value, "DD/MM/YYYY"))}
      className={className}
    />
  ),
  LocalizationProvider: ({ children }: any) => <div>{children}</div>,
}));

describe("DateFilter Component", () => {
  const mockSetStartDate = vi.fn();
  const mockSetEndDate = vi.fn();

  const defaultProps = {
    startDate: dayjs("2025-01-01"),
    endDate: dayjs("2025-02-01"),
    setStartDate: mockSetStartDate,
    setEndDate: mockSetEndDate,
    size: "w-40",
    spacing: "mx-2",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar os dois DatePickers com labels corretos", () => {
    render(<DateFilter {...defaultProps} />);

    expect(screen.getByLabelText("Data Inicial")).toBeInTheDocument();
    expect(screen.getByLabelText("Data Final")).toBeInTheDocument();
  });

  it("deve exibir os valores iniciais formatados corretamente", () => {
    render(<DateFilter {...defaultProps} />);

    expect(screen.getByTestId("Data Inicial")).toHaveValue("01/01/2025");
    expect(screen.getByTestId("Data Final")).toHaveValue("01/02/2025");
  });

  it("deve chamar setStartDate ao alterar a data inicial", () => {
    render(<DateFilter {...defaultProps} />);

    const input = screen.getByTestId("Data Inicial");

    fireEvent.change(input, { target: { value: "2025-01-10" } });

    expect(mockSetStartDate).toHaveBeenCalledTimes(1);
    expect(mockSetStartDate).toHaveBeenCalledWith(dayjs("2025-01-10"));
  });

  it("deve chamar setEndDate ao alterar a data final", () => {
    render(<DateFilter {...defaultProps} />);

    const input = screen.getByTestId("Data Final");

    fireEvent.change(input, { target: { value: "2025-03-20" } });

    expect(mockSetEndDate).toHaveBeenCalledTimes(1);
    expect(mockSetEndDate).toHaveBeenCalledWith(dayjs("2025-03-20"));
  });

  it("deve aplicar size e spacing no className", () => {
    render(<DateFilter {...defaultProps} />);

    // O label "Data Inicial" está no input, mas as classes estão no Box container
    const startInput = screen.getByLabelText("Data Inicial");
    // Subir até ao Box que contém as classes
    const startBox = startInput.closest(".mb-2");

    expect(startBox).toBeInTheDocument();
    expect(startBox?.className).toContain("w-40");
    expect(startBox?.className).toContain("mx-2");
  });
});
