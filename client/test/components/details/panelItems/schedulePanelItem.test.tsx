import SchedulePanelItem from "@/components/details/panelItems/schedulePanelItem";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, describe, expect, vi } from "vitest";

const mockData = [
  {
    id: 1,
    data_prog: "2025-07-16T00:00:00.000Z",
    hora_ini: "1970-01-01T08:00:00.000Z",
    hora_ter: "1970-01-01T12:00:00.000Z",
    tipo_servico: "DP",
    prog: 100,
    exec: 50,
    observ_programacao: "ET4243",
    chi: "234",
    num_dp: "432435",
    chave_provisoria: "3243ET435",
    equipe_linha_morta: 1,
    equipe_linha_viva: 0,
    equipe_regularizacao: 0,
    tecnico: "Não definido",
    restricao: null,
    nome_responsavel_execucao: null,
  },
];

describe("SchedulePanelItem component", () => {
  it("deve renderizar corretamente os dados na tabela", () => {
    render(<SchedulePanelItem data={mockData} onDelete={() => {}} />);

    expect(screen.getByText("16/07/2025")).toBeInTheDocument();
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("3243ET435")).toBeInTheDocument();
    expect(screen.getByText("Não definido")).toBeInTheDocument();
  });

  it("deve chamar onEdit quando o ícone de lápis for clicado", async () => {
    const onEditMock = vi.fn();
    render(
      <SchedulePanelItem
        data={mockData}
        onEdit={onEditMock}
        onDelete={() => {}}
      />
    );

    const user = userEvent.setup();

    // Simula hover para exibir os ícones
    const linha = screen.getByText("16/07/2025").closest("tr")!;
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
      <SchedulePanelItem
        data={mockData}
        onDelete={onDeleteMock}
        onEdit={() => {}}
      />
    );

    const user = userEvent.setup();

    // Simula hover para exibir os ícones
    const linha = screen.getByText("16/07/2025").closest("tr")!;
    await user.hover(linha);

    const deleteButton = screen.getByRole("button", {
      name: /excluir programação/i,
    });

    await user.click(deleteButton);

    expect(onDeleteMock).toHaveBeenCalledWith(mockData[0].id);
  });
});
