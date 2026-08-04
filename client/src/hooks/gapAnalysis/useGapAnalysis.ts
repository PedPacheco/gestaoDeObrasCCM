import {
  createGapAnalysisAudit,
  deleteGapAnalysisAudit,
  fetchGapAnalysisAudits,
  updateGapAnalysisAudit,
} from "@/actions/gapAnalysisAudit";
import {
  AuditData,
  camelToSnake,
  mapApiToAuditData,
} from "@/types/auditoria/auditoriaTypes";
import { calcComputed } from "@/utils/gapAnalysis";
import { useCallback, useEffect, useState } from "react";

export function useGapAnalysis() {
  const [data, setData] = useState<AuditData[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPartnerSelector, setShowPartnerSelector] = useState(false);

  const loadData = useCallback(async () => {
    const result = await fetchGapAnalysisAudits();

    if (result.success && result.data) {
      setData(result.data.map(mapApiToAuditData));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleUpdate = (id: number, field: keyof AuditData, value: string) => {
    setData((prev: AuditData[]) =>
      prev.map((item: AuditData) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        if (field === "dataFim") {
          if (value) {
            const [year, month] = value.split("-");
            updated.dataGap = `${month}/${year}`;
          } else {
            updated.dataGap = "";
          }
        }

        if (field === "gapAtual") {
          updated.scoreFinal = value;
        }

        if (
          field === "quantidadeDesviosPlanejados" ||
          field === "quantidadeDesviosExecutados" ||
          field === "executadosForaPrazo" ||
          field === "itensPendentesForaDoPrazo"
        ) {
          const computed = calcComputed(updated);
          updated.evolucao = computed.evolucao;
          updated.itensPendentesNoPrazo = computed.itensPendentesNoPrazo;
        }

        return updated;
      }),
    );

    const snakeField = camelToSnake(field);
    updateGapAnalysisAudit(id, { [snakeField]: value });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta auditoria?")) {
      const result = await deleteGapAnalysisAudit(id);
      if (result.success) {
        setData((prev: AuditData[]) =>
          prev.filter((item: AuditData) => item.id !== id),
        );
      }
    }
  };
  const handleAddRow = async (selectedPartner: number) => {
    const result = await createGapAnalysisAudit({
      id_parceira: selectedPartner,
    });

    if (result.success && result.data) {
      const newEntry = mapApiToAuditData(result.data);

      setData((prev: AuditData[]) => {
        const lastIdx = [...prev]
          .map((item: AuditData, i: number) => ({ item, i }))
          .filter(
            ({ item }: { item: AuditData }) =>
              item.id_parceira === selectedPartner,
          )
          .at(-1)?.i;

        if (lastIdx !== undefined) {
          const next = [...prev];
          next.splice(lastIdx + 1, 0, newEntry);
          return next;
        }
        return [...prev, newEntry];
      });
    }
    setShowPartnerSelector(false);
  };

  return {
    loading,

    data,

    showPartnerSelector,
    setShowPartnerSelector,

    handleDelete,
    handleUpdate,
    handleAddRow,
  };
}
