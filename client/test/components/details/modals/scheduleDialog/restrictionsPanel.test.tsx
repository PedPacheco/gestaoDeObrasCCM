import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { RestrictionsPanel } from "@/components/details/workDetails/modals/scheduleDialog/restrictionsPanel";

// ✅ Mock do DatePicker fiel (respeita disabled e propaga valor)
vi.mock("@mui/x-date-pickers", () => ({
  DatePicker: ({ label, onChange, disabled }: any) => (
    <input
      data-testid={label}
      disabled={disabled}
      onChange={(e) => {
        const value = e.target.value;
        onChange(value || null); // 👈 força null quando vazio
      }}
    />
  ),
}));

const baseProps = {
  formData: {},
  formErrors: {},
  options: {
    restricao: [
      { id: 1, restricao: "Restrição 1", tipo_restricao: "PROGRAMAÇÃO" },
      { id: 2, restricao: "Restrição 2", tipo_restricao: "OUTRO" },
    ],
  },
  onInputChange: vi.fn((field) => vi.fn()),
  disabledFields: vi.fn(() => false),
};

describe("RestrictionsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar os blocos principais", () => {
    render(<RestrictionsPanel {...baseProps} />);

    expect(screen.getByText("1ª Restrição")).toBeInTheDocument();
    expect(screen.getByText("2ª Restrição")).toBeInTheDocument();
  });

  it("deve renderizar apenas opções de PROGRAMAÇÃO no select", async () => {
    render(<RestrictionsPanel {...baseProps} />);

    const selects = screen.getAllByRole("combobox");
    await userEvent.click(selects[0]);

    const listbox = screen.getByRole("listbox");

    expect(within(listbox).getByText("Restrição 1")).toBeInTheDocument();
    expect(within(listbox).queryByText("Restrição 2")).not.toBeInTheDocument();
  });

  it("deve chamar onInputChange ao alterar um select", async () => {
    const handleChange = vi.fn();
    const onInputChange = vi.fn(() => handleChange);

    render(<RestrictionsPanel {...baseProps} onInputChange={onInputChange} />);

    const selects = screen.getAllByRole("combobox");

    await userEvent.click(selects[1]);
    await userEvent.click(screen.getByText("Edp"));

    expect(onInputChange).toHaveBeenCalledWith("responsibilityProg");
  });

  it("deve renderizar valores nos campos de texto", () => {
    render(
      <RestrictionsPanel
        {...baseProps}
        formData={{
          responsibleName: "João",
          responsibleArea: "TI",
          resolutionDate: "01-05-2026",
          resolutionDate2: "01-05-2026",
        }}
      />,
    );

    expect(screen.getByDisplayValue("João")).toBeInTheDocument();
    expect(screen.getByDisplayValue("TI")).toBeInTheDocument();
  });

  it("deve exibir todas as mensagens de erro quando fornecidas", () => {
    render(
      <RestrictionsPanel
        {...baseProps}
        formErrors={{
          idProgRestriction1: "Erro restrição 1",
          responsiblityProg: "Erro responsabilidade 1",
          responsibleName: "Erro nome 1",
          responsibleArea: "Erro área 1",
          restrictionStatus: "Erro status 1",
          idProgRestriction2: "Erro restrição 2",
          responsibilityProg2: "Erro responsabilidade 2",
          responsibleName2: "Erro nome 2",
          responsibleArea2: "Erro área 2",
          restrictionStatus2: "Erro status 2",
        }}
      />,
    );

    expect(screen.getByText("Erro restrição 1")).toBeInTheDocument();
    expect(screen.getByText("Erro responsabilidade 1")).toBeInTheDocument();
    expect(screen.getByText("Erro nome 1")).toBeInTheDocument();
    expect(screen.getByText("Erro área 1")).toBeInTheDocument();
    expect(screen.getByText("Erro status 1")).toBeInTheDocument();

    expect(screen.getByText("Erro restrição 2")).toBeInTheDocument();
    expect(screen.getByText("Erro responsabilidade 2")).toBeInTheDocument();
    expect(screen.getByText("Erro nome 2")).toBeInTheDocument();
    expect(screen.getByText("Erro área 2")).toBeInTheDocument();
    expect(screen.getByText("Erro status 2")).toBeInTheDocument();
  });

  it("deve desabilitar campos quando disabledFields retornar true", () => {
    render(<RestrictionsPanel {...baseProps} disabledFields={() => true} />);

    const inputs = screen.getAllByRole("textbox");
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });

    expect(screen.getByTestId("1° Data de resolução")).toBeDisabled();
    expect(screen.getByTestId("2° Data de resolução")).toBeDisabled();
  });

  it("deve converter e enviar a data corretamente ao alterar (bloco 1)", () => {
    const handleChange = vi.fn();
    const onInputChange = vi.fn(() => handleChange);

    render(<RestrictionsPanel {...baseProps} onInputChange={onInputChange} />);

    const dateInput = screen.getByTestId("1° Data de resolução");

    fireEvent.change(dateInput, {
      target: { value: "2024-01-01" },
    });

    expect(onInputChange).toHaveBeenCalledWith("resolutionDate");

    // garante que o handler recebeu ISO string
    const isoArg = handleChange.mock.calls[0][0];
    expect(typeof isoArg).toBe("string");
    expect(dayjs(isoArg).isValid()).toBe(true);
  });

  it("deve converter e enviar a data corretamente ao alterar (bloco 2)", () => {
    const handleChange = vi.fn();
    const onInputChange = vi.fn(() => handleChange);

    render(<RestrictionsPanel {...baseProps} onInputChange={onInputChange} />);

    const dateInput = screen.getByTestId("2° Data de resolução");

    fireEvent.change(dateInput, {
      target: { value: "2024-02-10" },
    });

    expect(onInputChange).toHaveBeenCalledWith("resolutionDate2");

    const isoArg = handleChange.mock.calls[0][0];
    expect(typeof isoArg).toBe("string");
    expect(dayjs(isoArg).isValid()).toBe(true);
  });

  it("deve renderizar corretamente o segundo bloco", () => {
    render(
      <RestrictionsPanel
        {...baseProps}
        formData={{
          responsibleName2: "Maria",
        }}
      />,
    );

    expect(screen.getByDisplayValue("Maria")).toBeInTheDocument();
  });

  it("não deve quebrar quando formData estiver vazio", () => {
    render(<RestrictionsPanel {...baseProps} />);

    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThan(0);
  });

  it("deve deixar valor nulo no segundo dataResolucao (bloco 1)", async () => {
    const handleChange = vi.fn();

    const onInputChange = (field: string) => (value: any) =>
      handleChange(field, value);

    render(<RestrictionsPanel {...baseProps} onInputChange={onInputChange} />);

    const dateInput = screen.getByTestId(
      "1° Data de resolução",
    ) as HTMLInputElement;

    // 1. Primeiro coloca um valor válido
    fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

    // 2. Depois limpa (agora sim há mudança real)
    fireEvent.change(dateInput, { target: { value: "" } });

    expect(handleChange).toHaveBeenCalledWith("resolutionDate", null);
  });

  it("deve deixar valor nulo no segundo dataResolucao (bloco 2)", async () => {
    const handleChange = vi.fn();

    const onInputChange = (field: string) => (value: any) =>
      handleChange(field, value);

    render(<RestrictionsPanel {...baseProps} onInputChange={onInputChange} />);

    const dateInput = screen.getByTestId(
      "2° Data de resolução",
    ) as HTMLInputElement;

    // 1. Primeiro coloca um valor válido
    fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

    // 2. Depois limpa (agora sim há mudança real)
    fireEvent.change(dateInput, { target: { value: "" } });

    expect(handleChange).toHaveBeenCalledWith("resolutionDate2", null);
  });
});
