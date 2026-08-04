import { ButtonComponent } from "@/components/common/Button";
import { MultipleSelectComponent } from "@/components/common/MultipleSelect";
import { PlusIcon } from "@heroicons/react/20/solid";

interface GapAnalysisFiltersProps {
  filterParceira: string[];
  setFilterParceira: (item: string[]) => void;
  filterStatus: string[];
  setFilterStatus: (item: string[]) => void;
  setShowPartnerSelector: (item: boolean) => void;
  partners: { id: number; turma: string }[];
  clearFilters: () => void;
}

export function GapAnalysisFilters({
  filterParceira,
  filterStatus,
  partners,
  setFilterParceira,
  setFilterStatus,
  setShowPartnerSelector,
  clearFilters,
}: GapAnalysisFiltersProps) {
  const hasActiveFilters = filterParceira.length > 0 || filterStatus.length > 0;

  return (
    <div
      className="sticky top-0 z-40 border-b border-white/10 px-6 py-3"
      style={{ background: "#0a1628" }}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Título */}
        <h2 className="text-sm font-bold text-white shrink-0">
          Acompanhamento Plano de Ação
        </h2>

        {/* Filtros */}
        <div className="flex items-center gap-2">
          <div className="w-80">
            <MultipleSelectComponent
              label="Parceira"
              menuItems={partners}
              selectedItem={filterParceira}
              setSelectedItem={setFilterParceira}
              valueKey="id"
              displayKey="turma"
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          <div className="w-80">
            <MultipleSelectComponent
              label="Status"
              menuItems={[
                "Todos os status",
                "Pendente",
                "Em andamento",
                "Concluído",
              ]}
              selectedItem={filterStatus}
              setSelectedItem={setFilterStatus}
              backgroundColor="#0f1e2e"
              textColor="#a1a1aa"
            />
          </div>

          {hasActiveFilters && (
            <>
              <div className="h-5 w-px bg-white/10" />
              <button
                onClick={() => clearFilters()}
                className="px-2 py-1 text-[11px] font-medium text-slate-400 border border-white/10 rounded 
                           hover:border-white/20 hover:text-white transition-colors whitespace-nowrap"
                style={{ background: "#1e2f42" }}
              >
                ✕ Limpar
              </button>
            </>
          )}
        </div>

        {/* Botão */}
        <ButtonComponent
          onClick={() => setShowPartnerSelector(true)}
          text="Nova Auditoria"
          startIcon={<PlusIcon className="w-3.5 h-3.5" />}
        />
      </div>
    </div>
  );
}
