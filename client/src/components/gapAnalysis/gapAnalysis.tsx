"use client";

import { useGapAnalysis } from "@/hooks/gapAnalysis/useGapAnalysis";
import { useGapAnalysisFilters } from "@/hooks/gapAnalysis/useGapAnalysisFilters";
import { ActionPlanSection } from "./actionPlanSection/actionPlanSection";
import { GapAnalysisFilters } from "./gapAnalysisFilters";
import { GeneralSummaryGapAnalysis } from "./generalSummaryGapAnalysis";
import { PartnerAuditCard } from "./partnerAuditCard/partnerAuditCard";
import { PartnerSelectorModal } from "./partnerSelectorModal";

interface GapAnalysisProps {
  partners: { id: number; turma: string }[];
}

export default function GapAnalysis({ partners }: GapAnalysisProps) {
  const {
    handleAddRow,
    handleDelete,
    handleUpdate,
    loading,
    data,
    setShowPartnerSelector,
    showPartnerSelector,
  } = useGapAnalysis();

  const {
    filterParceira,
    filterStatus,
    filteredData,
    setFilterParceira,
    setFilterStatus,
    grouped,
    groupedFiltered,
    summaryStats,
    clearFilters,
  } = useGapAnalysisFilters(data);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">
            Carregando auditorias...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <GapAnalysisFilters
        filterParceira={filterParceira}
        filterStatus={filterStatus}
        partners={partners}
        setFilterParceira={setFilterParceira}
        setFilterStatus={setFilterStatus}
        setShowPartnerSelector={setShowPartnerSelector}
        clearFilters={clearFilters}
      />

      <div className="px-6 flex flex-col gap-2">
        <PartnerSelectorModal
          open={showPartnerSelector}
          onClose={() => setShowPartnerSelector(false)}
          partners={partners}
          onSelectPartner={(partnerId) => {
            handleAddRow(partnerId);
            setShowPartnerSelector(false);
          }}
        />

        <ActionPlanSection
          filteredData={filteredData}
          grouped={grouped}
          handleUpdate={handleUpdate}
        />

        <GeneralSummaryGapAnalysis summaryStatus={summaryStats} />

        <PartnerAuditCard
          groupedFiltered={groupedFiltered}
          handleDelete={handleDelete}
          handleUpdate={handleUpdate}
        />
      </div>
    </div>
  );
}
