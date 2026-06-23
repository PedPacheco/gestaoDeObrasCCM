// LaborDashboardFilters.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import dayjs from "dayjs";
import { LaborDashboardFilters } from "@/components/dashboard/laborDashboard/laborDashboardFilters";

// ── Mocks ────────────────────────────────────────────────────────
vi.mock("@/components/common/DateFilter", () => ({
  DateFilter: vi.fn(({ startDate, endDate, setStartDate, setEndDate }) => (
    <div data-testid="date-filter">
      <span data-testid="start-date">
        {startDate?.format("YYYY-MM-DD") ?? ""}
      </span>
      <span data-testid="end-date">{endDate?.format("YYYY-MM-DD") ?? ""}</span>
      <button
        data-testid="btn-set-start"
        onClick={() => setStartDate(dayjs("2026-01-01"))}
      >
        Set Start
      </button>
      <button
        data-testid="btn-set-end"
        onClick={() => setEndDate(dayjs("2026-12-31"))}
      >
        Set End
      </button>
    </div>
  )),
}));

vi.mock("@/components/common/MultipleSelect", () => ({
  MultipleSelectComponent: vi.fn(
    ({ label, menuItems, selectedItem, setSelectedItem }) => (
      <div data-testid={`select-${label}`}>
        <span data-testid={`select-${label}-count`}>{menuItems.length}</span>
        <span data-testid={`select-${label}-selected`}>
          {JSON.stringify(selectedItem)}
        </span>
        <button
          data-testid={`select-${label}-set`}
          onClick={() => setSelectedItem(["mock-id"])}
        >
          Select
        </button>
      </div>
    ),
  ),
}));

vi.mock("@/components/dashboard/common/FilterTag", () => ({
  FilterTag: vi.fn(({ label, variant }) => (
    <span data-testid="filter-tag" data-variant={variant ?? "default"}>
      {label}
    </span>
  )),
}));

// ── Helpers ──────────────────────────────────────────────────────
const filtersData = {
  regional: [
    { id: "r1", regional: "Regional SP" },
    { id: "r2", regional: "Regional RJ" },
  ],
  parceira: [
    { id: "p1", turma: "Parceira Alpha" },
    { id: "p2", turma: "Parceira Beta" },
  ],
  tipo: [
    { id: "t1", tipo_obra: "Tipo Civil", id_grupo: 2 },
    { id: "t2", tipo_obra: "Tipo Elétrica", id_grupo: 2 },
    { id: "t3", tipo_obra: "Tipo Outro", id_grupo: 1 }, // id_grupo !== 2
  ],
  grupo: [
    { id: "g1", grupo: "Grupo A" },
    { id: "g2", grupo: "Grupo B" },
  ],
};

const defaultProps = {
  filtersData,
  isPending: false,
  startDate: dayjs("2026-06-01"),
  endDate: dayjs("2026-06-30"),
  setStartDate: vi.fn(),
  setEndDate: vi.fn(),
  selectedRegionais: [] as string[],
  setSelectedRegionais: vi.fn(),
  selectedParceiras: [] as string[],
  setSelectedParceiras: vi.fn(),
  selectedTiposObra: [] as string[],
  setSelectedTiposObra: vi.fn(),
  selectedGroup: [] as string[],
  setSelectedGroup: vi.fn(),
  onApply: vi.fn(),
  clearFilters: vi.fn(),
  filtersTop: 64,
};

const renderFilters = (overrides: Record<string, any> = {}) =>
  render(<LaborDashboardFilters {...defaultProps} {...overrides} />);

// ── Testes ───────────────────────────────────────────────────────
describe("LaborDashboardFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. Renderização básica
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("renderização básica", () => {
    it("renderiza o DateFilter", () => {
      renderFilters();
      expect(screen.getByTestId("date-filter")).toBeInTheDocument();
    });

    it("renderiza os 4 selects (Regionais, Parceiras, Tipos de Obra, Grupo)", () => {
      renderFilters();
      expect(screen.getByTestId("select-Regionais")).toBeInTheDocument();
      expect(screen.getByTestId("select-Parceiras")).toBeInTheDocument();
      expect(screen.getByTestId("select-Tipos de Obra")).toBeInTheDocument();
      expect(screen.getByTestId("select-Grupo")).toBeInTheDocument();
    });

    it("renderiza os botões Aplicar e Limpar", () => {
      renderFilters();
      expect(screen.getByText("Aplicar")).toBeInTheDocument();
      expect(screen.getByText("Limpar")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. filtersTop (sticky position)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("filtersTop", () => {
    it("aplica filtersTop como style.top no container", () => {
      const { container } = renderFilters({ filtersTop: 80 });
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ top: "80px" });
    });

    it("aplica filtersTop=0 corretamente", () => {
      const { container } = renderFilters({ filtersTop: 0 });
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveStyle({ top: "0px" });
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. DateFilter — props e interação
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("DateFilter", () => {
    it("passa startDate e endDate formatados", () => {
      renderFilters();
      expect(screen.getByTestId("start-date").textContent).toBe("2026-06-01");
      expect(screen.getByTestId("end-date").textContent).toBe("2026-06-30");
    });

    it("chama setStartDate ao interagir", () => {
      renderFilters();
      fireEvent.click(screen.getByTestId("btn-set-start"));
      expect(defaultProps.setStartDate).toHaveBeenCalledOnce();
    });

    it("chama setEndDate ao interagir", () => {
      renderFilters();
      fireEvent.click(screen.getByTestId("btn-set-end"));
      expect(defaultProps.setEndDate).toHaveBeenCalledOnce();
    });

    it("lida com startDate null", () => {
      renderFilters({ startDate: null });
      expect(screen.getByTestId("start-date").textContent).toBe("");
    });

    it("lida com endDate null", () => {
      renderFilters({ endDate: null });
      expect(screen.getByTestId("end-date").textContent).toBe("");
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. MultipleSelect — dados passados
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("MultipleSelect — dados", () => {
    it("passa todas as regionais como menuItems", () => {
      renderFilters();
      expect(screen.getByTestId("select-Regionais-count").textContent).toBe(
        "2",
      );
    });

    it("passa todas as parceiras como menuItems", () => {
      renderFilters();
      expect(screen.getByTestId("select-Parceiras-count").textContent).toBe(
        "2",
      );
    });

    it("filtra tipos de obra por id_grupo === 2", () => {
      renderFilters();
      // filtersData.tipo tem 3 itens, mas só 2 com id_grupo === 2
      expect(screen.getByTestId("select-Tipos de Obra-count").textContent).toBe(
        "2",
      );
    });

    it("passa todos os grupos como menuItems", () => {
      renderFilters();
      expect(screen.getByTestId("select-Grupo-count").textContent).toBe("2");
    });

    it("exibe os itens selecionados de regionais", () => {
      renderFilters({ selectedRegionais: ["r1", "r2"] });
      expect(screen.getByTestId("select-Regionais-selected").textContent).toBe(
        JSON.stringify(["r1", "r2"]),
      );
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. MultipleSelect — interação (setters)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("MultipleSelect — interação", () => {
    it("chama setSelectedRegionais ao selecionar regional", () => {
      renderFilters();
      fireEvent.click(screen.getByTestId("select-Regionais-set"));
      expect(defaultProps.setSelectedRegionais).toHaveBeenCalledWith([
        "mock-id",
      ]);
    });

    it("chama setSelectedParceiras ao selecionar parceira", () => {
      renderFilters();
      fireEvent.click(screen.getByTestId("select-Parceiras-set"));
      expect(defaultProps.setSelectedParceiras).toHaveBeenCalledWith([
        "mock-id",
      ]);
    });

    it("chama setSelectedTiposObra ao selecionar tipo de obra", () => {
      renderFilters();
      fireEvent.click(screen.getByTestId("select-Tipos de Obra-set"));
      expect(defaultProps.setSelectedTiposObra).toHaveBeenCalledWith([
        "mock-id",
      ]);
    });

    it("chama setSelectedGroup ao selecionar grupo", () => {
      renderFilters();
      fireEvent.click(screen.getByTestId("select-Grupo-set"));
      expect(defaultProps.setSelectedGroup).toHaveBeenCalledWith(["mock-id"]);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. Fallback para arrays vazios (filtersData parcial)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("filtersData parcial / undefined", () => {
    it("renderiza sem erro quando filtersData está vazio", () => {
      renderFilters({ filtersData: {} });
      expect(screen.getByTestId("select-Regionais-count").textContent).toBe(
        "0",
      );
      expect(screen.getByTestId("select-Parceiras-count").textContent).toBe(
        "0",
      );
      expect(screen.getByTestId("select-Tipos de Obra-count").textContent).toBe(
        "0",
      );
      expect(screen.getByTestId("select-Grupo-count").textContent).toBe("0");
    });

    it("renderiza sem erro quando regional é undefined", () => {
      renderFilters({
        filtersData: { ...filtersData, regional: undefined },
      });
      expect(screen.getByTestId("select-Regionais-count").textContent).toBe(
        "0",
      );
    });

    it("renderiza sem erro quando tipo é undefined", () => {
      renderFilters({
        filtersData: { ...filtersData, tipo: undefined },
      });
      expect(screen.getByTestId("select-Tipos de Obra-count").textContent).toBe(
        "0",
      );
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. Botão Aplicar
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("botão Aplicar", () => {
    it("chama onApply ao clicar", () => {
      renderFilters();
      fireEvent.click(screen.getByText("Aplicar"));
      expect(defaultProps.onApply).toHaveBeenCalledOnce();
    });

    it("fica desabilitado quando isPending=true", () => {
      renderFilters({ isPending: true });
      const btn = screen.getAllByText("Carregando...")[0];
      expect(btn).toBeDisabled();
    });

    it("exibe 'Carregando...' quando isPending=true", () => {
      renderFilters({ isPending: true });
      const buttons = screen.getAllByText("Carregando...");
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });

    it("exibe 'Aplicar' quando isPending=false", () => {
      renderFilters();
      expect(screen.getByText("Aplicar")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. Botão Limpar
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("botão Limpar", () => {
    it("chama clearFilters ao clicar", () => {
      renderFilters();
      fireEvent.click(screen.getByText("Limpar"));
      expect(defaultProps.clearFilters).toHaveBeenCalledOnce();
    });

    it("fica desabilitado quando isPending=true", () => {
      renderFilters({ isPending: true });
      const buttons = screen.getAllByText("Carregando...");
      // Ambos os botões ficam "Carregando..." — o segundo é o Limpar
      expect(buttons[1]).toBeDisabled();
    });

    it("exibe 'Limpar' quando isPending=false", () => {
      renderFilters();
      expect(screen.getByText("Limpar")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 9. FilterTags — sem filtros ativos
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("FilterTags — sem filtros ativos", () => {
    it("não renderiza tags quando nenhum filtro está selecionado", () => {
      renderFilters();
      expect(screen.queryAllByTestId("filter-tag")).toHaveLength(0);
    });

    it("não renderiza a borda separadora quando não há filtros ativos", () => {
      const { container } = renderFilters();
      expect(container.querySelector(".border-t.border-white\\/5")).toBeNull();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 10. FilterTags — regionais
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("FilterTags — regionais", () => {
    it("renderiza tags para regionais selecionadas com variant='blue'", () => {
      renderFilters({ selectedRegionais: ["r1"] });
      const tag = screen.getByText("Regional SP");
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveAttribute("data-variant", "blue");
    });

    it("renderiza múltiplas tags de regionais", () => {
      renderFilters({ selectedRegionais: ["r1", "r2"] });
      expect(screen.getByText("Regional SP")).toBeInTheDocument();
      expect(screen.getByText("Regional RJ")).toBeInTheDocument();
    });

    it("não renderiza tag se o id não existe em filtersData", () => {
      renderFilters({ selectedRegionais: ["inexistente"] });
      const tags = screen.queryAllByTestId("filter-tag");
      expect(tags).toHaveLength(0);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 11. FilterTags — parceiras
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("FilterTags — parceiras", () => {
    it("renderiza tags para parceiras selecionadas com variant default", () => {
      renderFilters({ selectedParceiras: ["p1"] });
      const tag = screen.getByText("Parceira Alpha");
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveAttribute("data-variant", "default");
    });

    it("renderiza múltiplas tags de parceiras", () => {
      renderFilters({ selectedParceiras: ["p1", "p2"] });
      expect(screen.getByText("Parceira Alpha")).toBeInTheDocument();
      expect(screen.getByText("Parceira Beta")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 12. FilterTags — tipos de obra
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("FilterTags — tipos de obra", () => {
    it("renderiza tags para tipos de obra selecionados", () => {
      renderFilters({ selectedTiposObra: ["t1"] });
      expect(screen.getByText("Tipo Civil")).toBeInTheDocument();
    });

    it("renderiza tag mesmo para tipo com id_grupo !== 2 (tag usa filtersData.tipo completo)", () => {
      // O filtro id_grupo === 2 aplica-se ao select, não às tags
      renderFilters({ selectedTiposObra: ["t3"] });
      expect(screen.getByText("Tipo Outro")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 13. FilterTags — grupos
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("FilterTags — grupos", () => {
    it("renderiza tags para grupos selecionados", () => {
      renderFilters({ selectedGroup: ["g1"] });
      expect(screen.getByText("Grupo A")).toBeInTheDocument();
    });

    it("renderiza múltiplas tags de grupos", () => {
      renderFilters({ selectedGroup: ["g1", "g2"] });
      expect(screen.getByText("Grupo A")).toBeInTheDocument();
      expect(screen.getByText("Grupo B")).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 14. FilterTags — múltiplos tipos de filtro simultâneos
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("FilterTags — combinação de filtros", () => {
    it("renderiza tags de todos os tipos simultaneamente", () => {
      renderFilters({
        selectedRegionais: ["r1"],
        selectedParceiras: ["p2"],
        selectedTiposObra: ["t2"],
        selectedGroup: ["g1"],
      });

      expect(screen.getByText("Regional SP")).toBeInTheDocument();
      expect(screen.getByText("Parceira Beta")).toBeInTheDocument();
      expect(screen.getByText("Tipo Elétrica")).toBeInTheDocument();
      expect(screen.getByText("Grupo A")).toBeInTheDocument();

      expect(screen.getAllByTestId("filter-tag")).toHaveLength(4);
    });

    it("exibe a borda separadora quando há filtros ativos", () => {
      const { container } = renderFilters({ selectedRegionais: ["r1"] });
      expect(
        container.querySelector(".border-t.border-white\\/5"),
      ).toBeInTheDocument();
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 15. hasActiveFilters — edge cases
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("hasActiveFilters — edge cases", () => {
    it("mostra tags quando apenas parceiras estão selecionadas", () => {
      renderFilters({ selectedParceiras: ["p1"] });
      expect(screen.getAllByTestId("filter-tag")).toHaveLength(1);
    });

    it("mostra tags quando apenas tipos de obra estão selecionados", () => {
      renderFilters({ selectedTiposObra: ["t1"] });
      expect(screen.getAllByTestId("filter-tag")).toHaveLength(1);
    });

    it("mostra tags quando apenas grupo está selecionado", () => {
      renderFilters({ selectedGroup: ["g2"] });
      expect(screen.getAllByTestId("filter-tag")).toHaveLength(1);
    });

    it("não mostra tags quando todos os arrays estão vazios", () => {
      renderFilters({
        selectedRegionais: [],
        selectedParceiras: [],
        selectedTiposObra: [],
        selectedGroup: [],
      });
      expect(screen.queryAllByTestId("filter-tag")).toHaveLength(0);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 16. isPending — ambos os botões
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe("isPending — estado de carregamento", () => {
    it("ambos os botões ficam desabilitados e exibem 'Carregando...'", () => {
      renderFilters({ isPending: true });
      const buttons = screen.getAllByText("Carregando...");
      expect(buttons).toHaveLength(2);
      buttons.forEach((btn) => expect(btn).toBeDisabled());
    });

    it("ambos os botões ficam habilitados quando isPending=false", () => {
      renderFilters({ isPending: false });
      expect(screen.getByText("Aplicar")).not.toBeDisabled();
      expect(screen.getByText("Limpar")).not.toBeDisabled();
    });

    it("não chama onApply se botão está desabilitado e é clicado", () => {
      renderFilters({ isPending: true });
      const btn = screen.getAllByText("Carregando...")[0];
      fireEvent.click(btn);
      expect(defaultProps.onApply).not.toHaveBeenCalled();
    });

    it("não chama clearFilters se botão está desabilitado e é clicado", () => {
      renderFilters({ isPending: true });
      const btn = screen.getAllByText("Carregando...")[1];
      fireEvent.click(btn);
      expect(defaultProps.clearFilters).not.toHaveBeenCalled();
    });
  });
});
