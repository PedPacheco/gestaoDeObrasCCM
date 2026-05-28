import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SchedulePanelItem from "@/components/details/panelItems/schedulePanelItem";
import * as UserContextModule from "@/contexts/userContext";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/contexts/userContext", () => {
  return {
    useUser: () => ({
      user: {
        id: 1,
        username: "test-user",
        id_regional: "001",
        nome_usuario: "Test User",
        email: "test@example.com",
        tipo_usuario: "INTERNO",
        is_admin: false,
        permissao_edicao: true,
        id_turma: 1,
        id_area: 1,
      },
      permissions: {
        sub: 1,
        username: "test-user",
        tipo_usuario: "INTERNO",
        is_admin: false,
        permissao_edicao: true,
        id_turma: 1,
        id_area: 1,
      },
    }),
  };
});

const mockData = [
  {
    id: 1,
    data_prog: "2025-07-16T00:00:00.000Z",
    hora_ini: "1970-01-01T08:00:00.000Z",
    hora_ter: "1970-01-01T12:00:00.000Z",
    tipo_servico: "DP",
    prog: 100,
    exec: null,
    equip_desligado: "ET4243",
    chi: "234",
    num_dp: "432435",
    chave_provisoria: "3243ET435",
    equipe_linha_morta: 1,
    equipe_linha_viva: 0,
    equipe_regularizacao: 0,
    tecnico: "Não definido",
    restricao: null,
    nome_responsavel_execucao: null,
    status_programacao: "Em validação",
    validada: false,
    confirmada: false,
    reprovada: false,
  },
];

const setConfirmedScheduleMock = vi.fn();
const setValidadedScheduleMock = vi.fn();
const setRejectedScheduleMock = vi.fn();
const setDataMock = vi.fn();

describe("SchedulePanelItem component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it("deve renderizar corretamente os dados na tabela", () => {
    render(
      <SchedulePanelItem
        data={mockData}
        onDelete={() => {}}
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setData={setDataMock}
        setRejectedSchedule={setRejectedScheduleMock}
        statusWork={1}
      />,
    );

    expect(screen.getByText("16/07/2025")).toBeInTheDocument();
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("12:00")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
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
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setData={setDataMock}
        setRejectedSchedule={setRejectedScheduleMock}
        statusWork={1}
      />,
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
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setRejectedSchedule={setRejectedScheduleMock}
        setData={setDataMock}
        statusWork={1}
      />,
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

  it("deve desabilitar botões de edição e deleção", async () => {
    vi.spyOn(UserContextModule, "useUser").mockReturnValue({
      user: {
        id: 2,
        username: "partial-user",
        nome_usuario: "Partial User",
        id_regional: 2,
        email: "partial@example.com",
        tipo_usuario: "PARCEIRA",
        is_admin: false,
        permissao_edicao: true,
        id_turma: 1,
        id_area: 1,
      },
      permissions: {
        sub: 1,
        username: "test-user",
        tipo_usuario: "PARCEIRA",
        is_admin: false,
        permissao_edicao: true,
        id_turma: 1,
        id_area: 1,
        exp: 132,
      },
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    const mockDataWithExec = [
      {
        ...mockData[0],
        exec: "50%",
      },
    ];

    render(
      <SchedulePanelItem
        data={mockDataWithExec}
        onEdit={() => {}}
        onDelete={() => {}}
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setRejectedSchedule={setRejectedScheduleMock}
        setData={setDataMock}
        statusWork={1}
      />,
    );

    const deleteButton = screen.queryByRole("button", {
      name: /excluir programação/i,
    });
    const editButton = screen.queryByRole("button", {
      name: /editar programação/i,
    });

    expect(deleteButton).not.toBeInTheDocument();
    expect(editButton).not.toBeInTheDocument();
  });

  it("deve desabilitar os checkbox quando item.exec estiver definido", () => {
    const mockDataWithExec = [
      {
        ...mockData[0],
        exec: "50%", // força a condição de disable pelo exec
      },
    ];

    render(
      <SchedulePanelItem
        data={mockDataWithExec}
        onEdit={() => {}}
        onDelete={() => {}}
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setRejectedSchedule={setRejectedScheduleMock}
        setData={setDataMock}
        statusWork={43} // status que normalmente permitiria validar
      />,
    );

    screen.getAllByRole("checkbox").forEach((checkbox) => {
      expect(checkbox).toBeDisabled();
    });
  });

  it("deve chamar a função handleCheckbox quando o usuário validar uma programação e adicionar um novo item no array de programações validadas", async () => {
    const user = userEvent.setup();

    render(
      <SchedulePanelItem
        data={mockData}
        onDelete={() => {}}
        onEdit={() => {}}
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setData={setDataMock}
        setRejectedSchedule={setRejectedScheduleMock}
        statusWork={43}
      />,
    );

    const validarCheckbox = screen.getAllByRole("checkbox")[1];

    await user.click(validarCheckbox);

    const updaterFn = setValidadedScheduleMock.mock.calls[0][0];
    const result = updaterFn([]);
    const dataUpdate = setDataMock.mock.calls[0][0];
    const resultData = dataUpdate({
      programacoes: [{ ...mockData[0], id: 2 }],
    });

    expect(result).toEqual([{ id: mockData[0].id, validate: true }]);
    expect(resultData).toEqual({
      programacoes: [{ ...mockData[0], id: 2 }],
    });
  });

  it("deve chamar a função handleCheckbox quando o usuário confirmar uma programação e adicionar um novo item no array de programações confirmadas", async () => {
    const user = userEvent.setup();

    render(
      <SchedulePanelItem
        data={mockData}
        onDelete={() => {}}
        onEdit={() => {}}
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setRejectedSchedule={setRejectedScheduleMock}
        setData={setDataMock}
        statusWork={37}
      />,
    );

    const confirmarCheckbox = screen.getAllByRole("checkbox")[2];

    await user.click(confirmarCheckbox);

    const updaterFn = setConfirmedScheduleMock.mock.calls[0][0];
    const result = updaterFn([]);
    const dataUpdate = setDataMock.mock.calls[0][0];
    const resultData = dataUpdate({ programacoes: mockData });

    expect(result).toEqual([{ id: mockData[0].id, confirm: true }]);
    expect(resultData).toEqual({
      programacoes: [{ ...mockData[0], confirmada: true }],
    });
  });

  it("deve chamar a função handleCheckbox quando o usuário validar uma programação e alterar o item já existente", async () => {
    const user = userEvent.setup();

    const mockDataWithExtra = [
      ...mockData,
      {
        ...mockData[0],
        id: 2,
        prog: 50,
        exec: null,
      },
    ];

    render(
      <SchedulePanelItem
        data={mockDataWithExtra}
        onDelete={() => {}}
        onEdit={() => {}}
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setRejectedSchedule={setRejectedScheduleMock}
        setData={setDataMock}
        statusWork={43}
      />,
    );

    const validarCheckbox = screen.getAllByRole("checkbox")[1];

    await user.click(validarCheckbox);

    const updaterFn = setValidadedScheduleMock.mock.calls[0][0];

    const result = updaterFn([
      { id: mockDataWithExtra[0].id, validate: true },
      { id: mockDataWithExtra[1], validate: false },
    ]);

    expect(result).toEqual([
      { id: mockDataWithExtra[0].id, validate: true },
      { id: mockDataWithExtra[1], validate: false },
    ]);
  });

  it("deve chamar a função handleCheckbox quando o usuário confirmar uma programação e alterar o item já existente", async () => {
    const user = userEvent.setup();

    const mockDataWithExtra = [
      {
        ...mockData[0],
        status_programacao: "Em programação",
      },
      {
        ...mockData[0],
        id: 2,
        prog: 50,
        exec: null,
        status_programacao: "Em programação",
      },
    ];

    render(
      <SchedulePanelItem
        data={mockDataWithExtra}
        onDelete={() => {}}
        onEdit={() => {}}
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setRejectedSchedule={setRejectedScheduleMock}
        setData={setDataMock}
        statusWork={43}
      />,
    );

    const confirmarCheckbox = screen.getAllByRole("checkbox")[2];

    await user.click(confirmarCheckbox);

    const updaterFn = setConfirmedScheduleMock.mock.calls[0][0];
    const result = updaterFn([
      { id: mockDataWithExtra[0].id, confirm: true },
      { id: mockDataWithExtra[1].id, confirm: false },
    ]);
    expect(result).toEqual([
      { id: mockDataWithExtra[0].id, confirm: true },
      { id: mockDataWithExtra[1].id, confirm: false },
    ]);
  });

  it("deve chamar a função handleCheckbox quando o usuário reprovar uma programação", async () => {
    const user = userEvent.setup();

    render(
      <SchedulePanelItem
        data={mockData}
        onDelete={() => {}}
        onEdit={() => {}}
        setConfirmedSchedule={setConfirmedScheduleMock}
        setValidatedSchedule={setValidadedScheduleMock}
        setData={setDataMock}
        setRejectedSchedule={setRejectedScheduleMock}
        statusWork={43}
      />,
    );

    const reprovarCheckbx = screen.getAllByRole("checkbox")[0];

    await user.click(reprovarCheckbx);

    const result = setRejectedScheduleMock.mock.calls[0][0];
    const dataUpdate = setDataMock.mock.calls[0][0];
    const resultData = dataUpdate({
      programacoes: [{ ...mockData[0], id: 2 }],
    });

    expect(result).toEqual({ id: 1, reject: true });
    expect(resultData).toEqual({
      programacoes: [{ ...mockData[0], id: 2 }],
    });
  });
});
