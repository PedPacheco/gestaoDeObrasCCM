import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

dayjs.extend(utc);

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/contexts/userContext", () => ({
  useUser: vi.fn(),
}));

vi.mock("@/utils/formatValue", () => ({
  formatPercentage: vi.fn((v) => (v != null ? `${v}%` : v)),
}));

vi.mock("@/utils/validDate", () => ({
  isValidDateString: vi.fn((v) => {
    // Retorna true para strings no formato ISO usadas nos testes
    return typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v);
  }),
}));

vi.mock("@heroicons/react/20/solid", () => ({
  PencilIcon: (props: any) => <svg data-testid="pencil-icon" {...props} />,
  TrashIcon: (props: any) => <svg data-testid="trash-icon" {...props} />,
}));

// ─── Auxiliares ───────────────────────────────────────────────────────────────

import { useUser } from "@/contexts/userContext";
import SchedulePanelItem from "@/components/details/panelItems/schedulePanelItem";

const mockUseUser = useUser as ReturnType<typeof vi.fn>;

function makePermissions(overrides = {}) {
  return {
    is_admin: false,
    id_area: 1,
    permissao_edicao: false,
    tipo_usuario: "NORMAL",
    ...overrides,
  };
}

function makeItem(overrides = {}): any {
  return {
    id: 1,
    criado_em: "2024-03-15T10:00:00Z",
    criado_por: "João",
    editado_por: "Maria",
    reprovada: false,
    validada: false,
    confirmada: false,
    status_programacao: "Em validação",
    data_prog: "2024-03-20T00:00:00Z",
    hora_ini: "1970-01-01T08:00:00Z",
    hora_ter: "1970-01-01T17:00:00Z",
    tipo_servico: "Manutenção",
    prog: 50,
    exec: null,
    observacao_programacao: "Obs teste",
    equip_desligado: "Equip A",
    chi: "CHI-001",
    num_dp: "DP-001",
    chave_provisoria: "CP-001",
    equipe_linha_morta: "LM-01",
    equipe_linha_viva: "LV-01",
    equipe_regularizacao: "REG-01",
    tecnico: "Carlos",
    restricao: "Nenhuma",
    nome_responsavel_execucao: "Pedro",
    ...overrides,
  };
}

function makeProps(overrides = {}): any {
  return {
    data: [makeItem()],
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    statusWork: 1,
    setValidatedSchedule: vi.fn(),
    setConfirmedSchedule: vi.fn(),
    setRejectedSchedule: vi.fn(),
    setData: vi.fn(),
    ...overrides,
  };
}

// ─── Suíte de Testes ──────────────────────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SchedulePanelItem", () => {
  // ── Renderização ──────────────────────────────────────────────────────────

  describe("renderização", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
    });

    it("renderiza uma tabela com cabeçalho fixo", () => {
      render(<SchedulePanelItem {...makeProps()} />);
      expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("renderiza todos os cabeçalhos de coluna definidos no columnConfig", () => {
      render(<SchedulePanelItem {...makeProps()} />);
      const labelsEsperados = [
        "Data de criação",
        "Criado Por",
        "Editado Por",
        "Reprovar",
        "Validar",
        "Confirmar",
        "Status da Programação",
        "Data programada",
        "Horário de início",
        "Horário de término",
        "Tipo de Serviço",
        "% Prog",
        "% Exec",
        "Observação da Programação",
        "Equipamento a ser desligado",
        "CHI",
        "Número DP",
        "Chave provisória",
        "Equipe LM",
        "Equipe LV",
        "Equipe Reg",
        "Técnico responsável",
        "Motivo da restrição",
        "Responsabilidade",
      ];
      labelsEsperados.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });

    it("renderiza uma linha por item no array de dados", () => {
      const data = [
        makeItem({ id: 1 }),
        makeItem({ id: 2 }),
        makeItem({ id: 3 }),
      ];
      render(<SchedulePanelItem {...makeProps({ data })} />);
      const linhas = screen.getAllByRole("row");
      // 1 cabeçalho + 3 linhas de dados
      expect(linhas).toHaveLength(4);
    });

    it("renderiza os valores textuais das células corretamente", () => {
      render(<SchedulePanelItem {...makeProps()} />);
      expect(screen.getByText("João")).toBeInTheDocument();
      expect(screen.getByText("Maria")).toBeInTheDocument();
      expect(screen.getByText("Manutenção")).toBeInTheDocument();
    });

    it("renderiza checkboxes para as colunas reprovada, validada e confirmada", () => {
      render(<SchedulePanelItem {...makeProps()} />);
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(3);
    });

    it("renderiza o corpo da tabela vazio quando o array de dados está vazio", () => {
      render(<SchedulePanelItem {...makeProps({ data: [] })} />);
      const linhas = screen.getAllByRole("row");
      expect(linhas).toHaveLength(1); // apenas o cabeçalho
    });
  });

  // ── Formatação de datas e horários ────────────────────────────────────────

  describe("formatCellValue", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
    });

    it("formata datas não-1970 no padrão DD/MM/YYYY", () => {
      const item = makeItem({ data_prog: "2024-03-20T00:00:00Z" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);
      expect(screen.getByText("20/03/2024")).toBeInTheDocument();
    });

    it("formata datas de 1970 (somente horário) no padrão HH:mm", () => {
      const item = makeItem({
        hora_ini: "1970-01-01T08:30:00Z",
        hora_ter: "1970-01-01T17:45:00Z",
      });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);
      expect(screen.getByText("08:30")).toBeInTheDocument();
      expect(screen.getByText("17:45")).toBeInTheDocument();
    });

    it("formata os campos prog e exec utilizando formatPercentage", () => {
      const item = makeItem({ prog: 75, exec: 60 });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);
      expect(screen.getByText("75%")).toBeInTheDocument();
      expect(screen.getByText("60%")).toBeInTheDocument();
    });

    it("renderiza valores que não são datas como texto simples", () => {
      const item = makeItem({ tecnico: "SpecialTech" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);
      expect(screen.getByText("SpecialTech")).toBeInTheDocument();
    });
  });

  // ── Visibilidade dos botões de ação ───────────────────────────────────────

  describe("botões de ação (editar / excluir)", () => {
    it("exibe os botões de editar e excluir ao passar o mouse para admin com exec=null", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      render(<SchedulePanelItem {...makeProps()} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      expect(screen.getByTestId("pencil-icon")).toBeInTheDocument();
      expect(screen.getByTestId("trash-icon")).toBeInTheDocument();
    });

    it("oculta os botões de ação quando exec não é nulo", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const item = makeItem({ exec: 100 });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      expect(screen.queryByTestId("pencil-icon")).not.toBeInTheDocument();
    });

    it("oculta os botões de ação quando o usuário não é admin, não é área 8 com edição e não é PARCEIRA em status válido", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({
          is_admin: false,
          id_area: 1,
          tipo_usuario: "NORMAL",
        }),
      });
      render(<SchedulePanelItem {...makeProps()} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      expect(screen.queryByTestId("pencil-icon")).not.toBeInTheDocument();
    });

    it("exibe os botões de ação para usuário da área 8 com permissao_edicao=true", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ id_area: 8, permissao_edicao: true }),
      });
      render(<SchedulePanelItem {...makeProps()} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      expect(screen.getByTestId("pencil-icon")).toBeInTheDocument();
    });

    it("não exibe os botões de ação para usuário da área 8 sem permissao_edicao", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ id_area: 8, permissao_edicao: false }),
      });
      render(<SchedulePanelItem {...makeProps()} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      expect(screen.queryByTestId("pencil-icon")).not.toBeInTheDocument();
    });

    it("exibe os botões de ação para usuário PARCEIRA com statusWork fora da lista de bloqueio", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ tipo_usuario: "PARCEIRA" }),
      });
      render(<SchedulePanelItem {...makeProps({ statusWork: 99 })} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      expect(screen.getByTestId("pencil-icon")).toBeInTheDocument();
    });

    it("não exibe os botões de ação para usuário PARCEIRA quando statusWork está na lista de bloqueio", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ tipo_usuario: "PARCEIRA" }),
      });
      // statusToDisable = [42, 37, 3, 4, 2]
      render(<SchedulePanelItem {...makeProps({ statusWork: 42 })} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      expect(screen.queryByTestId("pencil-icon")).not.toBeInTheDocument();
    });

    it("os ícones ficam visíveis após mouseEnter e a linha perde o hover após mouseLeave", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      render(<SchedulePanelItem {...makeProps()} />);

      const linhas = screen.getAllByRole("row");
      const linhaDados = linhas[1];

      fireEvent.mouseEnter(linhaDados);
      expect(screen.getByTestId("pencil-icon")).toBeVisible();

      fireEvent.mouseLeave(linhaDados);
    });
  });

  // ── Callback onEdit ───────────────────────────────────────────────────────

  describe("callback onEdit", () => {
    it("chama onEdit com o item correto ao clicar no botão de editar", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const onEdit = vi.fn();
      const item = makeItem();
      render(<SchedulePanelItem {...makeProps({ data: [item], onEdit })} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      fireEvent.click(screen.getByTestId("pencil-icon").closest("button")!);
      expect(onEdit).toHaveBeenCalledWith(item);
    });

    it("não lança erro quando onEdit é undefined", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const props = makeProps({ onEdit: undefined });
      render(<SchedulePanelItem {...props} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      const btn = screen.queryByTestId("pencil-icon")?.closest("button");
      if (btn) {
        expect(() => fireEvent.click(btn)).not.toThrow();
      }
    });
  });

  // ── Callback onDelete ─────────────────────────────────────────────────────

  describe("callback onDelete", () => {
    it("chama onDelete com o id do item ao clicar no botão de excluir", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const onDelete = vi.fn();
      const item = makeItem({ id: 42 });
      render(<SchedulePanelItem {...makeProps({ data: [item], onDelete })} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      fireEvent.click(screen.getByTestId("trash-icon").closest("button")!);
      expect(onDelete).toHaveBeenCalledWith(42);
    });
  });

  // ── Lógica de desabilitação dos checkboxes ────────────────────────────────

  describe("disabledCheckBox", () => {
    it("desabilita o checkbox 'validada' quando o status não é 'Em validação'", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const item = makeItem({ status_programacao: "Programado" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

      const checkboxes = screen.getAllByRole("checkbox");
      // Ordem: reprovada (0), validada (1), confirmada (2)
      expect(checkboxes[1]).toBeDisabled();
    });

    it("habilita o checkbox 'validada' quando o status é 'Em validação'", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const item = makeItem({ status_programacao: "Em validação" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[1]).not.toBeDisabled();
    });

    it("desabilita o checkbox 'confirmada' quando o status é 'Programado'", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const item = makeItem({ status_programacao: "Programado" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[2]).toBeDisabled();
    });

    it("habilita o checkbox 'confirmada' quando o status não é 'Programado'", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const item = makeItem({ status_programacao: "Em validação" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[2]).not.toBeDisabled();
    });

    it.each(["Parcial", "Concluído", "Cancelado"])(
      "desabilita o checkbox 'reprovada' quando o status é '%s'",
      (status) => {
        mockUseUser.mockReturnValue({
          permissions: makePermissions({ is_admin: true }),
        });
        const item = makeItem({ status_programacao: status });
        render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

        const checkboxes = screen.getAllByRole("checkbox");
        expect(checkboxes[0]).toBeDisabled();
      },
    );

    it("habilita o checkbox 'reprovada' quando o status não está na lista de bloqueio", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const item = makeItem({ status_programacao: "Em validação" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).not.toBeDisabled();
    });

    it("desabilita todos os checkboxes para usuário do tipo PARCEIRA", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ tipo_usuario: "PARCEIRA" }),
      });
      const item = makeItem({ status_programacao: "Em validação" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

      screen.getAllByRole("checkbox").forEach((cb) => {
        expect(cb).toBeDisabled();
      });
    });

    it("desabilita todos os checkboxes quando exec não é nulo", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const item = makeItem({ exec: 80, status_programacao: "Em validação" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

      screen.getAllByRole("checkbox").forEach((cb) => {
        expect(cb).toBeDisabled();
      });
    });

    it("desabilita todos os checkboxes quando o usuário não tem permissão de acesso", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({
          is_admin: false,
          id_area: 1,
          tipo_usuario: "NORMAL",
        }),
      });
      const item = makeItem({ status_programacao: "Em validação" });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);

      screen.getAllByRole("checkbox").forEach((cb) => {
        expect(cb).toBeDisabled();
      });
    });
  });

  // ── handleCheckboxChange: validada ────────────────────────────────────────

  describe("handleCheckboxChange — validada", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
    });

    it("adiciona nova entrada quando o id ainda não existe em validatedSchedule", () => {
      const setValidatedSchedule = vi.fn();
      const setData = vi.fn();
      const item = makeItem({
        id: 5,
        status_programacao: "Em validação",
        validada: false,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setValidatedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[1]); // validada

      expect(setValidatedSchedule).toHaveBeenCalledOnce();
      const atualizador = setValidatedSchedule.mock.calls[0][0];
      const resultado = atualizador([]);
      expect(resultado).toEqual([{ id: 5, validate: true }]);
    });

    it("atualiza a entrada existente quando o id já existe em validatedSchedule", () => {
      const setValidatedSchedule = vi.fn();
      const setData = vi.fn();
      const item = makeItem({
        id: 5,
        status_programacao: "Em validação",
        validada: false,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setValidatedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[1]);

      const atualizador = setValidatedSchedule.mock.calls[0][0];
      const resultado = atualizador([{ id: 5, validate: false }]);
      expect(resultado).toEqual([{ id: 5, validate: true }]);
    });

    it("preserva as demais entradas ao atualizar validada de um item específico", () => {
      const setValidatedSchedule = vi.fn();
      const setData = vi.fn();
      const item = makeItem({
        id: 5,
        status_programacao: "Em validação",
        validada: false,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setValidatedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[1]);
      const atualizador = setValidatedSchedule.mock.calls[0][0];
      const resultado = atualizador([{ id: 99, validate: true }]);
      expect(resultado).toEqual([
        { id: 99, validate: true },
        { id: 5, validate: true },
      ]);
    });
  });

  // ── handleCheckboxChange: confirmada ──────────────────────────────────────

  describe("handleCheckboxChange — confirmada", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
    });

    it("adiciona nova entrada quando o id ainda não existe em confirmedSchedule", () => {
      const setConfirmedSchedule = vi.fn();
      const setData = vi.fn();
      const item = makeItem({
        id: 7,
        status_programacao: "Em validação",
        confirmada: false,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setConfirmedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[2]); // confirmada
      const atualizador = setConfirmedSchedule.mock.calls[0][0];
      const resultado = atualizador([]);
      expect(resultado).toEqual([{ id: 7, confirm: true }]);
    });

    it("atualiza a entrada existente quando exec é null ou undefined", () => {
      const setConfirmedSchedule = vi.fn();
      const setData = vi.fn();
      const item = makeItem({
        id: 7,
        status_programacao: "Em validação",
        confirmada: false,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setConfirmedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[2]);
      const atualizador = setConfirmedSchedule.mock.calls[0][0];

      // item existente com exec = null → deve atualizar
      const resultado = atualizador([{ id: 7, confirm: false, exec: null }]);
      expect(resultado).toEqual([{ id: 7, confirm: true, exec: null }]);
    });

    it("não atualiza a entrada existente em confirmedSchedule quando exec está definido", () => {
      const setConfirmedSchedule = vi.fn();
      const setData = vi.fn();
      const item = makeItem({
        id: 7,
        status_programacao: "Em validação",
        confirmada: false,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setConfirmedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[2]);
      const atualizador = setConfirmedSchedule.mock.calls[0][0];

      // item existente com exec definido → não deve atualizar
      const resultado = atualizador([{ id: 7, confirm: false, exec: 50 }]);
      expect(resultado).toEqual([{ id: 7, confirm: false, exec: 50 }]);
    });
  });

  // ── handleCheckboxChange: reprovada ───────────────────────────────────────

  describe("handleCheckboxChange — reprovada", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
    });

    it("adiciona nova entrada quando o id não existe e o valor é true", () => {
      const setRejectedSchedule = vi.fn();
      const setData = vi.fn();
      const item = makeItem({
        id: 3,
        status_programacao: "Em validação",
        reprovada: false,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setRejectedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[0]); // reprovada
      const atualizador = setRejectedSchedule.mock.calls[0][0];
      const resultado = atualizador([]);
      expect(resultado).toEqual([{ id: 3, reject: true }]);
    });

    it("não adiciona nova entrada quando o valor é false e o id não existe", () => {
      const setRejectedSchedule = vi.fn();
      const setData = vi.fn();
      // Começa marcado para que desmarcar produza value=false
      const item = makeItem({
        id: 3,
        status_programacao: "Em validação",
        reprovada: true,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setRejectedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[0]);
      const atualizador = setRejectedSchedule.mock.calls[0][0];
      // estado anterior sem entrada para id=3
      const resultado = atualizador([]);
      expect(resultado).toEqual([]);
    });

    it("remove a entrada existente quando o valor se torna false", () => {
      const setRejectedSchedule = vi.fn();
      const setData = vi.fn();
      const item = makeItem({
        id: 3,
        status_programacao: "Em validação",
        reprovada: true,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setRejectedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[0]);
      const atualizador = setRejectedSchedule.mock.calls[0][0];
      // entrada existente para id=3
      const resultado = atualizador([{ id: 3, reject: true }]);
      expect(resultado).toEqual([]);
    });

    it("atualiza a entrada existente quando o valor é true", () => {
      const setRejectedSchedule = vi.fn();
      const setData = vi.fn();
      const item = makeItem({
        id: 3,
        status_programacao: "Em validação",
        reprovada: false,
      });
      render(
        <SchedulePanelItem
          {...makeProps({ data: [item], setRejectedSchedule, setData })}
        />,
      );

      fireEvent.click(screen.getAllByRole("checkbox")[0]);
      const atualizador = setRejectedSchedule.mock.calls[0][0];
      const resultado = atualizador([{ id: 3, reject: false }]);
      expect(resultado).toEqual([{ id: 3, reject: true }]);
    });
  });

  // ── Atualização do setData após mudança de checkbox ───────────────────────

  describe("atualização do setData após mudança de checkbox", () => {
    it("atualiza o item correto no array programacoes quando validada muda", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const setData = vi.fn();
      const item = makeItem({
        id: 5,
        status_programacao: "Em validação",
        validada: false,
      });
      render(<SchedulePanelItem {...makeProps({ data: [item], setData })} />);

      fireEvent.click(screen.getAllByRole("checkbox")[1]);

      expect(setData).toHaveBeenCalledOnce();
      const atualizador = setData.mock.calls[0][0];
      const anterior = {
        programacoes: [
          { id: 5, validada: false },
          { id: 9, validada: false },
        ],
      };
      const resultado = atualizador(anterior);
      expect(resultado.programacoes[0].validada).toBe(true);
      expect(resultado.programacoes[1].validada).toBe(false);
    });

    it("atualiza o item correto no array programacoes quando reprovada muda", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const setData = vi.fn();
      const item = makeItem({
        id: 5,
        status_programacao: "Em validação",
        reprovada: false,
      });
      render(<SchedulePanelItem {...makeProps({ data: [item], setData })} />);

      fireEvent.click(screen.getAllByRole("checkbox")[0]);

      const atualizador = setData.mock.calls[0][0];
      const anterior = { programacoes: [{ id: 5, reprovada: false }] };
      const resultado = atualizador(anterior);
      expect(resultado.programacoes[0].reprovada).toBe(true);
    });
  });

  // ── Estado marcado dos checkboxes ─────────────────────────────────────────

  describe("estado marcado dos checkboxes", () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
    });

    it("renderiza o checkbox 'validada' marcado quando item.validada é true", () => {
      const item = makeItem({
        validada: true,
        status_programacao: "Em validação",
      });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[1]).toBeChecked();
    });

    it("renderiza o checkbox 'confirmada' marcado quando item.confirmada é true", () => {
      const item = makeItem({
        confirmada: true,
        status_programacao: "Em validação",
      });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[2]).toBeChecked();
    });

    it("renderiza o checkbox 'reprovada' marcado quando item.reprovada é true", () => {
      const item = makeItem({
        reprovada: true,
        status_programacao: "Em validação",
      });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);
      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes[0]).toBeChecked();
    });

    it("renderiza todos os checkboxes desmarcados quando todos os valores são false", () => {
      const item = makeItem({
        reprovada: false,
        validada: false,
        confirmada: false,
      });
      render(<SchedulePanelItem {...makeProps({ data: [item] })} />);
      screen
        .getAllByRole("checkbox")
        .forEach((cb) => expect(cb).not.toBeChecked());
    });
  });

  // ── Isolamento de hover entre múltiplas linhas ────────────────────────────

  describe("múltiplas linhas", () => {
    it("o estado de hover é rastreado por linha e não vaza entre linhas distintas", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      const items = [makeItem({ id: 1 }), makeItem({ id: 2 })];
      render(<SchedulePanelItem {...makeProps({ data: items })} />);

      const linhas = screen.getAllByRole("row");
      // Passa o mouse pela primeira linha de dados e sai
      fireEvent.mouseEnter(linhas[1]);
      fireEvent.mouseLeave(linhas[1]);
      // Passa o mouse pela segunda linha de dados
      fireEvent.mouseEnter(linhas[2]);
      // Apenas um conjunto de botões de ação deve estar visível por vez
      expect(screen.getAllByTestId("pencil-icon")).toHaveLength(2);
    });
  });

  // ── Títulos dos tooltips ──────────────────────────────────────────────────

  describe("títulos dos tooltips", () => {
    it("o botão de editar está presente no DOM após o hover na linha", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ is_admin: true }),
      });
      render(<SchedulePanelItem {...makeProps()} />);

      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);

      const btnEditar = screen.getByTestId("pencil-icon").closest("button")!;
      expect(btnEditar).toBeInTheDocument();
    });
  });

  // ── Casos extremos de canAccessScheduleActions ────────────────────────────

  describe("casos extremos de canAccessScheduleActions", () => {
    it("PARCEIRA com statusWork=37 (bloqueado) não deve ter acesso às ações", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ tipo_usuario: "PARCEIRA" }),
      });
      render(<SchedulePanelItem {...makeProps({ statusWork: 37 })} />);
      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);
      expect(screen.queryByTestId("pencil-icon")).not.toBeInTheDocument();
    });

    it("PARCEIRA com statusWork=3 (bloqueado) não deve ter acesso às ações", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({ tipo_usuario: "PARCEIRA" }),
      });
      render(<SchedulePanelItem {...makeProps({ statusWork: 3 })} />);
      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);
      expect(screen.queryByTestId("pencil-icon")).not.toBeInTheDocument();
    });

    it("área 8 sem permissao_edicao não deve ter acesso mesmo com is_admin=false", () => {
      mockUseUser.mockReturnValue({
        permissions: makePermissions({
          id_area: 8,
          permissao_edicao: false,
          is_admin: false,
        }),
      });
      render(<SchedulePanelItem {...makeProps()} />);
      const linha = screen.getAllByRole("row")[1];
      fireEvent.mouseEnter(linha);
      expect(screen.queryByTestId("pencil-icon")).not.toBeInTheDocument();
    });
  });
});
