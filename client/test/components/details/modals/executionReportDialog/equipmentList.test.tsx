import { EquipmentList } from "@/components/details/modals/executionReportDialog/equipmentList";
import { render, screen, fireEvent } from "@testing-library/react";

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ onClick, text }: any) => (
    <button onClick={onClick}>{text}</button>
  ),
}));

const baseEquipment = {
  equipment: "Transformador",
  installation: "",
  power: "",
  patrimony: "",
  type: "DEFAULT",
} as const;

const mockHandlers = {
  onAddEquipment: vi.fn(),
  onEquipmentChange: vi.fn(),
  onRemoveEquipment: vi.fn(),
};

const baseProps = {
  fieldKey: "appliedEquipment" as const,
  prefix: "TEST",
  formErrors: {},
  ...mockHandlers,
};

describe("Componente EquipmentList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar corretamente um equipamento padrão (DEFAULT)", () => {
    render(<EquipmentList {...baseProps} items={[baseEquipment]} />);

    expect(screen.getByLabelText("Equipamento")).toBeInTheDocument();
    expect(screen.getByLabelText("Número de Instalação")).toBeInTheDocument();
    expect(screen.getByLabelText("Potência")).toBeInTheDocument();
    expect(screen.getByLabelText("Patrimônio")).toBeInTheDocument();
    expect(
      screen.getByText("Remover equipamento aplicado")
    ).toBeInTheDocument();
  });

  it("deve exibir o botão 'Adicionar CS' apenas quando o equipamento for 'Transformador'", () => {
    render(<EquipmentList {...baseProps} items={[baseEquipment]} />);
    expect(screen.getByText("Adicionar CS")).toBeInTheDocument();
  });

  it("não deve exibir o botão 'Adicionar CS' quando o equipamento for 'Banco capacitor'", () => {
    const equipamento = { ...baseEquipment, equipment: "" };
    render(<EquipmentList {...baseProps} items={[equipamento]} />);
    expect(screen.queryByText("Adicionar CS")).not.toBeInTheDocument();
  });

  it("deve chamar 'onEquipmentChange' ao selecionar um novo tipo de equipamento", () => {
    render(<EquipmentList {...baseProps} items={[baseEquipment]} />);
    const select = screen.getByLabelText("Equipamento");

    fireEvent.mouseDown(select);
    const option = screen.getByText("Religador");
    fireEvent.click(option);

    expect(mockHandlers.onEquipmentChange).toHaveBeenCalledWith(
      "appliedEquipment",
      0,
      "equipment",
      "Religador",
      "TEST"
    );
  });

  it("deve chamar 'onEquipmentChange' ao alterar o campo de número de instalação", () => {
    render(<EquipmentList {...baseProps} items={[baseEquipment]} />);
    const installationInput = screen.getByLabelText("Número de Instalação");

    fireEvent.change(installationInput, { target: { value: "123" } });

    expect(mockHandlers.onEquipmentChange).toHaveBeenCalledWith(
      "appliedEquipment",
      0,
      "installation",
      "123",
      "TEST"
    );
  });

  it("deve chamar 'onEquipmentChange' ao selecionar uma nova potência", () => {
    render(<EquipmentList {...baseProps} items={[baseEquipment]} />);
    const select = screen.getByLabelText("Potência");

    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByText("5"));

    expect(mockHandlers.onEquipmentChange).toHaveBeenCalledWith(
      "appliedEquipment",
      0,
      "power",
      "5",
      "TEST"
    );
  });

  it("deve chamar 'onEquipmentChange' ao digitar no campo de patrimônio", () => {
    render(<EquipmentList {...baseProps} items={[baseEquipment]} />);
    const patrimonyInput = screen.getByLabelText("Patrimônio");

    fireEvent.change(patrimonyInput, { target: { value: "ABC123" } });

    expect(mockHandlers.onEquipmentChange).toHaveBeenCalledWith(
      "appliedEquipment",
      0,
      "patrimony",
      "ABC123",
      "TEST"
    );
  });

  it("deve chamar 'onAddEquipment' ao clicar no botão 'Adicionar CS'", () => {
    render(<EquipmentList {...baseProps} items={[baseEquipment]} />);
    fireEvent.click(screen.getByText("Adicionar CS"));

    expect(mockHandlers.onAddEquipment).toHaveBeenCalledWith(
      "appliedEquipment",
      "TEST",
      "CS",
      0
    );
  });

  it("deve chamar 'onRemoveEquipment' ao clicar no botão 'Remover equipamento aplicado'", () => {
    render(<EquipmentList {...baseProps} items={[baseEquipment]} />);
    fireEvent.click(screen.getByText("Remover equipamento aplicado"));
    expect(mockHandlers.onRemoveEquipment).toHaveBeenCalledWith(
      "appliedEquipment",
      0,
      "TEST"
    );
  });

  it("deve exibir corretamente as mensagens de erro de validação", () => {
    const formErrors = {
      "appliedEquipment.0.equipment": "Campo obrigatório",
      "appliedEquipment.0.power": "Selecione uma potência",
      "appliedEquipment.0.patrimony": "Informe o patrimônio",
      "appliedEquipment.0.installation": "Número de instalação inválido",
    };

    render(
      <EquipmentList
        {...baseProps}
        items={[baseEquipment]}
        formErrors={formErrors}
      />
    );

    expect(screen.getByText("Campo obrigatório")).toBeInTheDocument();
    expect(screen.getByText("Selecione uma potência")).toBeInTheDocument();
    expect(screen.getByText("Informe o patrimônio")).toBeInTheDocument();
    expect(
      screen.getByText("Número de instalação inválido")
    ).toBeInTheDocument();
  });

  it("deve renderizar corretamente equipamentos do tipo CS com campos 'Número CS' e 'Marca CS'", () => {
    const csEquipment = {
      ...baseEquipment,
      equipment: "",
      type: "CS",
      power: "",
    } as const;

    render(<EquipmentList {...baseProps} items={[csEquipment]} />);

    expect(screen.getByLabelText("Número CS")).toBeInTheDocument();
    expect(screen.getByLabelText("Marca CS")).toBeInTheDocument();
  });

  it("deve renderizar corretamente o campo 'Número CS' quando o tipo do equipamento for 'CS'", async () => {
    const mockOnEquipmentChange = vi.fn();

    const mockEquipment = {
      equipment: "CS123",
      installation: "A1",
      power: "10kW",
      patrimony: "12345",
      type: "CS",
    } as const;

    render(
      <EquipmentList
        {...baseProps}
        items={[mockEquipment]}
        onEquipmentChange={mockOnEquipmentChange}
        fieldKey="appliedEquipment"
      />
    );

    const input = screen.getByLabelText("Número CS");
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("CS123");

    fireEvent.change(input, { target: { value: "CS123999" } });

    expect(mockOnEquipmentChange).toHaveBeenCalledWith(
      "appliedEquipment",
      0,
      "equipment",
      "CS123999",
      "TEST"
    );
  });
});
