import ExecutionReportPanelItem from "@/components/details/panelItems/executionReportPanelItem";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const mockData = [
  {
    id: 1,
    nome_usuario: "João",
    hora_ini: "1970-01-01T08:00:00.000Z",
    hora_ter: "1970-01-01T12:00:00.000Z",
    prog: 50,
    exec: 45,
    data_exec: "2025-07-30",
    liberado_ligacao_parcial: false,
    possui_equipamentos_aplicados: true,
    equipamentos_aplicados: "Transformador;Banco Capacitor",
    potencia_equipamento_aplicado: "500;200",
    patrimonio_equipamento_aplicado: "12345;67890",
  },
];

describe("ExecutionReportPanelItem", () => {
  it("deve renderizar corretamente os dados na tabela", () => {
    render(<ExecutionReportPanelItem data={mockData} onDelete={() => {}} />);

    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText("30/07/2025")).toBeInTheDocument();
    expect(screen.getByText("Sim")).toBeInTheDocument();
  });

  it("deve chamar onEdit quando o ícone de lápis for clicado", async () => {
    const onEditMock = vi.fn();
    render(
      <ExecutionReportPanelItem
        data={mockData}
        onEdit={onEditMock}
        onDelete={() => {}}
      />
    );

    const user = userEvent.setup();

    // Simula hover para exibir os ícones
    const linha = screen.getByText("João").closest("tr")!;
    await user.hover(linha);

    const editButton = screen.getByRole("button", {
      name: /editar programação/i,
    });

    await user.click(editButton);

    expect(onEditMock).toHaveBeenCalledWith(mockData[0]);
  });

  it("deve chamar onDelete quando o ícone de lixeira for clicado", async () => {
    const onDeleteMock = vi.fn();
    render(
      <ExecutionReportPanelItem
        data={mockData}
        onDelete={onDeleteMock}
        onEdit={() => {}}
      />
    );

    const user = userEvent.setup();

    // Simula hover para exibir os ícones
    const linha = screen.getByText("João").closest("tr")!;
    await user.hover(linha);

    const deleteButton = screen.getByRole("button", {
      name: /excluir programação/i,
    });

    await user.click(deleteButton);

    expect(onDeleteMock).toHaveBeenCalledWith(mockData[0].id);
  });
});
