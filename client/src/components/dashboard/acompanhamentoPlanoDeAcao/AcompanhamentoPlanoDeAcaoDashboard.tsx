"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { AuditData, AuditDataFromAPI, AuditStatus, camelToSnake, mapApiToAuditData } from "@/types/auditoria/auditoriaTypes";
import {
  fetchGapAnalysisAudits,
  createGapAnalysisAudit,
  updateGapAnalysisAudit,
  deleteGapAnalysisAudit,
} from "@/actions/gapAnalysisAudit";

const PARTNERS = [
  "MANSERV",
  "START",
  "LIG",
  "COMPEL",
  "ENGELMIG",
  "COSAMPA",
];

const PARTNER_LOGOS: Record<string, string> = {
  MANSERV: "/manserv-logo.png",
  START: "/start-logo.png",
  LIG: "/lig-logo.png",
  COMPEL: "/compel-logo.png",
  ENGELMIG: "/engelmig-logo.png",
  COSAMPA: "/cosampa-logo.png",
  OCA: "/oca-logo.png",
  BARAMAIA: "/baramaia-logo.png",
};

function getPartnerLogo(parceira: string): string | null {
  const key = Object.keys(PARTNER_LOGOS).find((k) =>
    parceira.toUpperCase().includes(k)
  );
  return key ? PARTNER_LOGOS[key] : null;
}

const SECTOR_COLORS: Record<string, string> = {
  Segurança: "bg-red-500",
  "GO Contrato": "bg-blue-500",
  "Engenheiro CCM": "bg-purple-500",
  Parceira: "bg-amber-500",
  "GO Contrato + GO Segurança": "bg-teal-500",
  "Dono de Área": "bg-green-500",
};

function calcComputed(item: AuditData): { evolucao: string; itensPendentesNoPrazo: string } {
  const total     = parseInt(item.quantidadeDesviosPlanejados) || 0;
  const execNP    = parseInt(item.quantidadeDesviosExecutados) || 0;
  const execFP    = parseInt(item.executadosForaPrazo || "0") || 0;
  const pendFP    = parseInt(item.itensPendentesForaDoPrazo || "0") || 0;
  const evolucao  = total > 0 ? Math.round(((execNP + execFP) / total) * 100).toString() : "";
  const pendNP    = Math.max(0, total - execNP - execFP - pendFP).toString();
  return { evolucao, itensPendentesNoPrazo: pendNP };
}

export default function AcompanhamentoPlanoDeAcaoDashboard() {
  const [data, setData] = useState<AuditData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterParceira, setFilterParceira] = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [showPartnerSelector, setShowPartnerSelector] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    const result = await fetchGapAnalysisAudits();
    if (result.success && result.data) {
      setData(result.data.map((item: AuditDataFromAPI) => mapApiToAuditData(item)));
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
      })
    );

    const snakeField = camelToSnake(field);
    updateGapAnalysisAudit(id, { [snakeField]: value });
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta auditoria?")) {
      const result = await deleteGapAnalysisAudit(id);
      if (result.success) {
        setData((prev: AuditData[]) => prev.filter((item: AuditData) => item.id !== id));
      }
    }
  };

  const handleAddRow = async (selectedPartner: string) => {
    const result = await createGapAnalysisAudit({ parceira: selectedPartner });
    if (result.success && result.data) {
      const newEntry = mapApiToAuditData(result.data as AuditDataFromAPI);

      setData((prev: AuditData[]) => {
        const lastIdx = [...prev]
          .map((item: AuditData, i: number) => ({ item, i }))
          .filter(({ item }: { item: AuditData }) => item.parceira === selectedPartner)
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

  const filteredData = data.filter((item: AuditData) => {
    if (filterParceira && item.parceira !== filterParceira) return false;
    if (filterStatus   && item.status   !== filterStatus)   return false;
    return true;
  });

  const hasActiveFilters = filterParceira !== "" || filterStatus !== "";

  const sortedIndicatorData = [...filteredData].sort((a, b) => {
    const cmp = a.parceira.localeCompare(b.parceira, "pt-BR");
    if (cmp !== 0) return cmp;
    return a.numAuditoria.localeCompare(b.numAuditoria, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

  const grouped = sortedIndicatorData.reduce<{ parceira: string; rows: AuditData[] }[]>(
    (acc, row) => {
      const last = acc[acc.length - 1];
      if (last && last.parceira === row.parceira) {
        last.rows.push(row);
      } else {
        acc.push({ parceira: row.parceira, rows: [row] });
      }
      return acc;
    },
    []
  );

  const groupedFiltered = [...filteredData]
    .sort((a, b) => {
      const c = a.parceira.localeCompare(b.parceira, "pt-BR");
      if (c !== 0) return c;
      return a.numAuditoria.localeCompare(b.numAuditoria, undefined, { numeric: true, sensitivity: "base" });
    })
    .reduce<{ parceira: string; rows: AuditData[] }[]>((acc, row) => {
      const last = acc[acc.length - 1];
      if (last && last.parceira === row.parceira) last.rows.push(row);
      else acc.push({ parceira: row.parceira, rows: [row] });
      return acc;
    }, []);

  const summaryStats = {
    total:            data.length,
    sumItens:         data.reduce((s: number, r: AuditData) => s + (parseInt(r.quantidadeDesviosPlanejados)    || 0), 0),
    sumExec:          data.reduce((s: number, r: AuditData) => s + (parseInt(r.quantidadeDesviosExecutados)    || 0), 0),
    sumNoPrazo:       data.reduce((s: number, r: AuditData) => s + (parseInt(r.itensPendentesNoPrazo    || "0") || 0), 0),
    sumForaPrazo:     data.reduce((s: number, r: AuditData) => s + (parseInt(r.itensPendentesForaDoPrazo || "0") || 0), 0),
    countEmAndamento: data.filter((r: AuditData) => r.status === "Em andamento").length,
    countPendente:    data.filter((r: AuditData) => r.status === "Pendente").length,
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Carregando auditorias...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* ── Barra de filtros — sticky, full-width ────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-white/10 px-6 py-3 flex flex-wrap items-center gap-4" style={{ background: "#0a1628" }}>
        <h2 className="text-lg font-bold text-white mr-4 shrink-0">Acompanhamento Plano de Ação</h2>

        {/* Parceira */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Parceira</label>
          <select
            value={filterParceira}
            onChange={(e) => setFilterParceira(e.target.value)}
            className="px-3 py-2 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            style={{ background: "#1e2f42", colorScheme: "dark", minWidth: "170px" }}
          >
            <option value="">Todas as parceiras</option>
            {[...PARTNERS].sort().map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            style={{ background: "#1e2f42", colorScheme: "dark", minWidth: "170px" }}
          >
            <option value="">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Em andamento">Em andamento</option>
            <option value="Concluído">Concluído</option>
          </select>
        </div>

        {/* Limpar */}
        {hasActiveFilters && (
          <button
            onClick={() => { setFilterParceira(""); setFilterStatus(""); }}
            className="px-4 py-2 text-xs font-bold text-slate-400 border border-white/10 rounded-lg hover:border-white/20 hover:text-white transition-colors self-end"
            style={{ background: "#1e2f42" }}
          >
            Limpar filtros
          </button>
        )}

        {/* Tags de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap self-end">
            {filterParceira && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold text-blue-300 border border-blue-500/30" style={{ background: "#0f1d2e" }}>
                {filterParceira}
                <button onClick={() => setFilterParceira("")} className="text-blue-400 hover:text-white leading-none">×</button>
              </span>
            )}
            {filterStatus && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border" style={{
                background: "#0f1d2e",
                color: filterStatus === "Concluído" ? "#34d399" : filterStatus === "Em andamento" ? "#fbbf24" : "#f87171",
                borderColor: filterStatus === "Concluído" ? "rgba(52,211,153,0.3)" : filterStatus === "Em andamento" ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)",
              }}>
                {filterStatus}
                <button onClick={() => setFilterStatus("")} className="hover:text-white leading-none">×</button>
              </span>
            )}
          </div>
        )}

        {/* Contador */}
        <span className="text-xs text-slate-500 italic self-end">
          {filteredData.length} {filteredData.length === 1 ? "registro" : "registros"}
          {hasActiveFilters && ` de ${data.length}`}
        </span>

        {/* Botão Nova Auditoria */}
        <button
          onClick={() => setShowPartnerSelector(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors shrink-0 self-end"
        >
          <PlusIcon className="w-4 h-4" />
          Nova Auditoria
        </button>
      </div>

      <div className="px-6 flex flex-col gap-2">

      {/* ── Partner Selector Modal ───────────────────────────────────── */}
      {showPartnerSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1e2f42] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-blue-900 px-6 py-4 flex items-center justify-between">
              <h3 className="text-white font-bold">Nova Auditoria</h3>
              <button
                onClick={() => setShowPartnerSelector(false)}
                className="text-white/60 hover:text-white transition-colors text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-400 mb-4">
                Selecione a parceira. A linha será inserida após o último
                registro da empresa escolhida.
              </p>
              <div className="flex flex-col gap-2">
                {PARTNERS.map((partner) => (
                  <button
                    key={partner}
                    onClick={() => handleAddRow(partner)}
                    className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-white/10 hover:border-blue-500/40 hover:bg-blue-900/30 text-left transition-all group"
                  >
                    <span className="font-semibold text-zinc-200 group-hover:text-white">
                      {partner}
                    </span>
                    <PlusIcon className="w-4 h-4 text-zinc-500 group-hover:text-blue-400" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowPartnerSelector(false)}
                className="mt-5 w-full py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          TABELA 1 — Indicadores / Plano de Ação  (tema EDP escuro)
      ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="rounded-2xl border border-white/8 shadow-2xl overflow-hidden" style={{ background: "#0f1d2e" }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                {/* Título */}
                <tr style={{ background: "#071220" }} className="border-b border-white/10">
                  <th colSpan={12} className="px-4 py-3.5 text-sm font-black text-white uppercase tracking-[0.2em] text-center">
                    PLANO DE AÇÃO - AUDITORIA DE SEGURANÇA - GAP ANALYSIS
                  </th>
                </tr>
                {/* Grupos */}
                <tr style={{ background: "#071220" }} className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  <th colSpan={2} rowSpan={2} className="px-4 py-2 border-r border-white/8 min-w-[340px] text-left align-middle text-slate-300">
                    Contratada
                  </th>
                  <th rowSpan={2} className="px-4 py-2 border-r border-white/8 min-w-[110px] text-center align-middle">Data do GAP</th>
                  <th rowSpan={2} className="px-4 py-2 border-r border-white/8 min-w-[100px] text-center align-middle">Score Final</th>
                  <th className="px-4 py-2 border-r border-white/8 text-center border-b border-white/8 text-emerald-400">Planejado</th>
                  <th colSpan={3} className="px-4 py-2 border-r border-white/8 text-center border-b border-white/8 text-emerald-400">Executado</th>
                  <th colSpan={2} className="px-4 py-2 border-r border-white/8 text-center border-b border-white/8 text-blue-400">Pendente</th>
                  <th rowSpan={2} className="px-4 py-2 border-r border-white/8 min-w-[130px] text-center align-middle">Status</th>
                  <th rowSpan={2} className="px-4 py-2 min-w-[280px] text-left align-middle">Observações</th>
                </tr>
                {/* Sub-colunas */}
                <tr style={{ background: "#071220" }} className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-3 py-2 border-r border-white/8 min-w-[90px] text-center text-emerald-400/80">Qtd. Ações</th>
                  <th className="px-3 py-2 border-r border-white/8 min-w-[90px] text-center text-emerald-400/80">No Prazo</th>
                  <th className="px-3 py-2 border-r border-white/8 min-w-[90px] text-center text-emerald-400/80">Fora Prazo</th>
                  <th className="px-3 py-2 border-r border-white/8 min-w-[150px] text-center text-emerald-400/80">Evolução</th>
                  <th className="px-3 py-2 border-r border-white/8 min-w-[100px] text-center text-blue-400/80">No Prazo</th>
                  <th className="px-3 py-2 border-r border-white/8 min-w-[110px] text-center text-blue-400/80">Fora do Prazo</th>
                </tr>
              </thead>

              <tbody style={{ background: "#0f1d2e" }}>
                {grouped.map((group, gIdx) =>
                  group.rows.map((row, rIdx) => {
                    const total  = parseInt(row.quantidadeDesviosPlanejados) || 0;
                    const execNP = parseInt(row.quantidadeDesviosExecutados) || 0;
                    const execFP = parseInt(row.executadosForaPrazo || "0") || 0;
                    const pct    = total > 0 ? Math.round(((execNP + execFP) / total) * 100) : null;
                    const barColor =
                      pct === null ? "" :
                      pct >= 90   ? "bg-emerald-500" :
                      pct >= 60   ? "bg-amber-400" :
                                    "bg-red-500";

                    const isFirst        = rIdx === 0;
                    const isGroupBorder  = isFirst && gIdx > 0;
                    const groupBorderCls = isGroupBorder
                      ? "border-t-[3px] border-white"
                      : "border-t border-white/6";

                    return (
                      <tr
                        key={`ind-${row.id}`}
                        className="transition-colors group"
                        style={{ background: "#0f1d2e" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#162535")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#0f1d2e")}
                      >
                        {/* Card da empresa — rowSpan por grupo */}
                        {isFirst && (
                          <td
                            rowSpan={group.rows.length}
                            className="border-t-2 border-white/20 border-l-4 border-l-emerald-500 align-middle p-3"
                            style={{ minWidth: "160px", maxWidth: "160px", width: "160px", background: "#071220", borderRight: "2px solid rgba(255,255,255,0.2)" }}
                          >
                            <div className="flex flex-col items-center gap-1.5 text-center">
                              {getPartnerLogo(group.parceira) ? (
                                <Image
                                  src={getPartnerLogo(group.parceira)!}
                                  alt={group.parceira}
                                  width={48}
                                  height={48}
                                  className="w-12 h-12 rounded-xl object-contain bg-white p-1"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                                  <span className="text-emerald-400 text-xs font-black">{group.parceira.charAt(0)}</span>
                                </div>
                              )}
                              <span className="text-xs font-black text-emerald-400 uppercase leading-tight break-words w-full">
                                {group.parceira}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                {group.rows.length}{" "}
                                {group.rows.length === 1 ? "auditoria" : "auditorias"}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Nº Auditoria */}
                        <td className={`px-4 py-2 border-r border-white/8 text-sm font-medium text-slate-300 ${groupBorderCls}`}>
                          {row.numAuditoria || <span className="text-white/20">—</span>}
                        </td>

                        {/* Data do GAP */}
                        <td className={`px-4 py-2 border-r border-white/8 cursor-default ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          <span className={`block text-sm text-center ${row.dataGap ? "text-slate-300" : "text-white/20"}`}>
                            {row.dataGap || "MM/AAAA"}
                          </span>
                        </td>

                        {/* Score Final */}
                        <td className={`px-4 py-2 border-r border-white/8 cursor-default ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          <span className={`block text-sm text-center ${row.scoreFinal ? "text-slate-300" : "text-white/20"}`}>
                            {row.scoreFinal ? `${row.scoreFinal} %` : "0,00 %"}
                          </span>
                        </td>

                        {/* Qtd. Ações (editável) */}
                        <td className={`p-0 border-r border-white/8 ${groupBorderCls}`}>
                          <input
                            type="text"
                            value={row.quantidadeDesviosPlanejados || ""}
                            onChange={(e) => handleUpdate(row.id, "quantidadeDesviosPlanejados", e.target.value)}
                            className="w-full h-11 px-2 text-sm border-none outline-none text-center font-semibold text-emerald-400 placeholder:text-white/20"
                            style={{ background: "transparent" }}
                          />
                        </td>

                        {/* Exec No Prazo (editável) */}
                        <td className={`p-0 border-r border-white/8 ${groupBorderCls}`}>
                          <input
                            type="text"
                            value={row.quantidadeDesviosExecutados || ""}
                            onChange={(e) => handleUpdate(row.id, "quantidadeDesviosExecutados", e.target.value)}
                            className="w-full h-11 px-2 text-sm border-none outline-none text-center text-slate-300 placeholder:text-white/20"
                            style={{ background: "transparent" }}
                          />
                        </td>

                        {/* Exec Fora Prazo (editável) */}
                        <td className={`p-0 border-r border-white/8 ${groupBorderCls}`}>
                          <input
                            type="text"
                            value={row.executadosForaPrazo || ""}
                            onChange={(e) => handleUpdate(row.id, "executadosForaPrazo", e.target.value)}
                            className="w-full h-11 px-2 text-sm border-none outline-none text-center text-slate-300 placeholder:text-white/20"
                            style={{ background: "transparent" }}
                          />
                        </td>

                        {/* Evolução (travado) = (ExecNP + ExecFP) / Total */}
                        <td className={`px-3 py-2 border-r border-white/8 ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          {(() => {
                            const evol = parseInt(row.evolucao || "0") || 0;
                            const bc = evol >= 90 ? "bg-emerald-500" : evol >= 60 ? "bg-amber-400" : "bg-red-500";
                            return evol > 0 || (total > 0 && (execNP + execFP) > 0) ? (
                              <div className="flex items-center gap-2 min-w-[110px]">
                                <span className="text-sm font-bold text-white w-9 text-right shrink-0">{evol}%</span>
                                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                                  <div className={`h-full ${bc} rounded-full transition-all`} style={{ width: `${Math.min(evol, 100)}%` }} />
                                </div>
                              </div>
                            ) : total > 0 ? (
                              <div className="flex items-center gap-2 min-w-[110px]">
                                <span className="text-sm font-bold text-white w-9 text-right shrink-0">0%</span>
                                <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }} />
                              </div>
                            ) : (
                              <span className="block text-center text-white/20 text-sm">—</span>
                            );
                          })()}
                        </td>

                        {/* Pend No Prazo (travado) */}
                        <td className={`p-0 border-r border-white/8 ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          <input
                            readOnly
                            value={row.itensPendentesNoPrazo || "0"}
                            className="w-full h-11 px-2 text-sm border-none outline-none text-center font-bold text-blue-400 cursor-default"
                            style={{ background: "transparent" }}
                          />
                        </td>

                        {/* Pend Fora do Prazo (editável) */}
                        <td className={`p-0 border-r border-white/8 ${groupBorderCls}`}>
                          <input
                            type="text"
                            value={row.itensPendentesForaDoPrazo || ""}
                            onChange={(e) => handleUpdate(row.id, "itensPendentesForaDoPrazo", e.target.value)}
                            className="w-full h-11 px-2 text-sm border-none outline-none text-center text-slate-300 placeholder:text-white/20"
                            style={{ background: "transparent" }}
                          />
                        </td>

                        {/* Status */}
                        <td className={`px-4 py-2 border-r border-white/8 text-sm font-semibold text-center cursor-default ${statusColorDark(row.status)} ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          {row.status || <span className="text-white/20">—</span>}
                        </td>

                        {/* Observação */}
                        <td className={`p-0 border-r border-white/8 ${groupBorderCls}`}>
                          <input
                            type="text"
                            value={row.observacao || ""}
                            placeholder="Observações..."
                            onChange={(e) => handleUpdate(row.id, "observacao", e.target.value)}
                            className="w-full h-11 px-4 text-sm border-none outline-none text-slate-300 placeholder:text-white/20"
                            style={{ background: "transparent" }}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between" style={{ background: "#071220" }}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Responsáveis:
              </span>
              {Object.entries(SECTOR_COLORS).map(([sector, color]) => (
                <div key={sector} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-xs text-slate-500">{sector}</span>
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-500 italic">
              {filteredData.length} registros
            </span>
          </div>
        </div>
      </section>

      {/* ── Resumo Geral + Legenda ─────────────────────────────────── */}
      <section>
        <div className="rounded-2xl border border-white/8 shadow-2xl overflow-hidden" style={{ background: "#0f1d2e" }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "#071220" }} className="border-b border-white/10">
                  <th colSpan={12} className="px-4 py-3.5 text-xs font-black text-white uppercase tracking-[0.2em] text-center">
                    RESUMO GERAL
                  </th>
                </tr>
              </thead>

              {/* Resumo Geral */}
              <tfoot>
                <tr className="border-t-2 border-emerald-500/40" style={{ background: "#071220" }}>
                  <td colSpan={2} className="px-4 py-3 border-r border-white text-xs font-black uppercase tracking-widest whitespace-nowrap text-emerald-400">
                    Resumo Geral
                  </td>
                  <td className="px-4 py-3 text-center border-r border-white">
                    <div className="text-lg font-black leading-none text-white">{summaryStats.total}</div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">Auditorias</div>
                  </td>
                  <td className="px-4 py-3 text-center text-white/20 text-sm border-r border-white">—</td>
                  <td className="px-4 py-3 text-center border-r border-white">
                    <div className="text-lg font-black leading-none text-white">{summaryStats.sumItens}</div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">Total de Itens</div>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-white">
                    <div className="text-lg font-black leading-none text-white">{summaryStats.sumExec}</div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">Itens Executados</div>
                  </td>
                  <td className="px-4 py-3 border-r border-white">
                    {(() => {
                      const p  = summaryStats.sumItens > 0 ? Math.round(summaryStats.sumExec / summaryStats.sumItens * 100) : 0;
                      const bc = p >= 90 ? "bg-emerald-500" : p >= 60 ? "bg-amber-400" : "bg-red-500";
                      return (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black leading-none text-emerald-400">{p}%</span>
                            <div className="flex-1 h-2.5 rounded-full overflow-hidden min-w-[60px]" style={{ background: "rgba(255,255,255,0.08)" }}>
                              <div className={`h-full ${bc} rounded-full`} style={{ width: `${p}%` }} />
                            </div>
                          </div>
                          <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-1">% Execução Geral</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-white">
                    <div className="text-lg font-black leading-none text-blue-400">{summaryStats.sumNoPrazo}</div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">Pendentes No Prazo</div>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-white">
                    <div className="text-lg font-black leading-none text-white">{summaryStats.sumForaPrazo}</div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">Pendentes Fora do Prazo</div>
                  </td>
                  <td className="px-4 py-3 text-center border-r border-white">
                    <div className="text-sm font-black text-amber-400 leading-none">{summaryStats.countEmAndamento}</div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">Em andamento</div>
                    <div className="text-sm font-black text-slate-400 leading-none mt-1.5">{summaryStats.countPendente}</div>
                    <div className="text-[11px] uppercase tracking-widest text-slate-500 mt-0.5">Pendente</div>
                  </td>
                  <td className="px-4 py-3 text-white/20 text-sm text-center">—</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legenda de Status */}
          <div className="px-5 py-4 border-t border-white/8" style={{ background: "#071220" }}>
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">
                Legenda de Status
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">✓</span>
                </div>
                <div>
                  <div className="text-xs font-black text-emerald-400 uppercase">Concluído</div>
                  <div className="text-[11px] text-slate-500">Item totalmente executado</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">◑</span>
                </div>
                <div>
                  <div className="text-xs font-black text-amber-400 uppercase">Em Andamento</div>
                  <div className="text-[11px] text-slate-500">Itens parcialmente executados</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">!</span>
                </div>
                <div>
                  <div className="text-xs font-black text-red-400 uppercase">Atrasado</div>
                  <div className="text-[11px] text-slate-500">Itens fora do prazo</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">+</span>
                </div>
                <div>
                  <div className="text-xs font-black text-slate-400 uppercase">Pendente</div>
                  <div className="text-[11px] text-slate-500">Aguardando execução</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">i</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Percentuais calculados com base no total de itens por auditoria
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TABELA 2 — Cards colapsáveis por empresa
      ══════════════════════════════════════════════════════════════ */}
      <section className="flex flex-col gap-1">
        {groupedFiltered.map((group) => {
          const isOpen = expandedCards[group.parceira] !== false;
          const totalPlan = group.rows.reduce((s: number, r: AuditData) => s + (parseInt(r.quantidadeDesviosPlanejados) || 0), 0);
          const totalExecNP = group.rows.reduce((s: number, r: AuditData) => s + (parseInt(r.quantidadeDesviosExecutados) || 0), 0);
          const totalExecFP = group.rows.reduce((s: number, r: AuditData) => s + (parseInt(r.executadosForaPrazo || "0") || 0), 0);
          const totalExec = totalExecNP + totalExecFP;
          const pctGeral = totalPlan > 0 ? Math.round((totalExec / totalPlan) * 100) : 0;

          return (
            <div key={group.parceira} className="rounded-2xl border border-white/8 shadow-xl overflow-hidden" style={{ background: "#0f1d2e" }}>
              {/* ── Card header (sempre visível) ─── */}
              <button
                type="button"
                onClick={() => setExpandedCards((prev: Record<string, boolean>) => ({ ...prev, [group.parceira]: !prev[group.parceira] }))}
                className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer"
                style={{ background: "#071220" }}
              >
                <svg className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>

                {getPartnerLogo(group.parceira) ? (
                  <Image src={getPartnerLogo(group.parceira)!} alt={group.parceira} width={36} height={36} className="w-9 h-9 rounded-lg object-contain bg-white p-0.5 shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <span className="text-emerald-400 text-xs font-black">{group.parceira.charAt(0)}</span>
                  </div>
                )}

                <span className="text-sm font-black text-white uppercase tracking-wide">{group.parceira}</span>

                <div className="flex items-center gap-6 ml-auto">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-wider">Qtd. Ações</span>
                    <span className="text-white font-black text-sm">{totalPlan || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 uppercase font-bold tracking-wider">Executado</span>
                    <span className="text-emerald-400 font-black text-sm">{totalExec || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-[120px]">
                    <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className={`h-full rounded-full transition-all ${pctGeral >= 90 ? "bg-emerald-500" : pctGeral >= 60 ? "bg-amber-400" : "bg-red-500"}`} style={{ width: `${pctGeral}%` }} />
                    </div>
                    <span className="text-sm font-black text-white w-10 text-right">{pctGeral}%</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">{group.rows.length} {group.rows.length === 1 ? "auditoria" : "auditorias"}</span>
                </div>
              </button>

              {/* ── Card body (expandido) ─── */}
              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="border-collapse min-w-[2200px] w-full">
                    <thead style={{ background: "#071220" }}>
                      <tr className="border-b border-white/10 border-t border-white/10">
                        <th className="w-10 border-r border-white/8" style={{ background: "#071220" }} />
                        <th colSpan={5} className="px-3 py-2 text-xs uppercase font-black text-slate-400 border-r border-white/8 text-center tracking-widest">Fiscalização — GAP</th>
                        <th className="px-3 py-2 text-xs uppercase font-black text-slate-400 border-r border-white/8 text-center tracking-widest">Notas</th>
                        <th colSpan={10} className="px-3 py-2 text-xs uppercase font-black text-emerald-400 border-r border-white/8 text-center tracking-widest">Acompanhamento das Etapas</th>
                        <th rowSpan={2} className="w-[6px] p-0" style={{ background: "rgba(255,255,255,0.15)" }} />
                        <th rowSpan={2} className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 text-center min-w-[130px] align-middle">Desvios Planejados</th>
                        <th rowSpan={2} className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 text-center min-w-[140px] align-middle">Status</th>
                        <th rowSpan={2} className="px-3 py-2 text-sm font-bold text-slate-300 text-center min-w-[200px] align-middle">Observação</th>
                      </tr>
                      <tr className="border-b border-white/10" style={{ background: "#071220" }}>
                        <th className="w-10 border-r border-white/8 px-2 py-2" style={{ background: "#071220" }}>
                          <TrashIcon className="w-3.5 h-3.5 text-white/20 mx-auto" />
                        </th>
                        <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[110px]">Nº Auditoria</th>
                        <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[130px]">Data Início</th>
                        <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[130px]">Data Fim</th>
                        <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[95px]">GAP Anterior</th>
                        <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[95px]">GAP Atual</th>
                        <th className="px-3 py-2 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[110px]">Evolução</th>
                        <ColHeader title="Apresentação e validação do relatório interna" sector="Segurança" />
                        <ColHeader title="Reunião de Apresentação do Relatório PSE" sector="GO Contrato" />
                        <ColHeader title="Envio da notificação para gestão de fornecedores" sector="Engenheiro CCM" />
                        <ColHeader title="Retorno da Parceira com o Plano de ação" sector="Parceira" />
                        <ColHeader title="Validação Plano de ação pela EDP" sector="GO Contrato + GO Segurança" />
                        <ColHeader title="Plano Validado?" sector="GO Contrato + GO Segurança" />
                        <ColHeader title="Devolutiva do novo Plano de ação" sector="Parceira" />
                        <ColHeader title="Validação do novo Plano de Ação" sector="GO Contrato + GO Segurança" />
                        <ColHeader title="Lançamento dos desvios no SGS" sector="Segurança" />
                        <ColHeader title="Início acompanhamento das ações" sector="Dono de Área" />
                      </tr>
                    </thead>
                    <tbody>
                      {group.rows.map((row, rIdx) => (
                        <tr
                          key={row.id}
                          className="transition-colors"
                          style={{ background: "#0f1d2e", borderTop: rIdx > 0 ? "1px solid rgba(255,255,255,0.06)" : undefined }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#162535")}
                          onMouseLeave={e => (e.currentTarget.style.background = "#0f1d2e")}
                        >
                          <td className="w-10 border-r border-white/8 p-0 text-center" style={{ background: "#0f1d2e" }}>
                            <button onClick={() => handleDelete(row.id)} className="w-full h-11 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                          <Cell rowId={row.id} field="numAuditoria"          value={row.numAuditoria}          type="text" onChange={handleUpdate} />
                          <Cell rowId={row.id} field="dataInicio"            value={row.dataInicio}            type="date" onChange={handleUpdate} />
                          <Cell rowId={row.id} field="dataFim"               value={row.dataFim}               type="date" onChange={handleUpdate} />
                          <PercentCell rowId={row.id} field="gapAnterior"    value={row.gapAnterior}           onChange={handleUpdate} />
                          <PercentCell rowId={row.id} field="gapAtual"       value={row.gapAtual}              onChange={handleUpdate} />
                          <EvolutionCell gapAnterior={row.gapAnterior} gapAtual={row.gapAtual} />
                          <Cell rowId={row.id} field="apresentacaoInterna"   value={row.apresentacaoInterna}   type="date" onChange={handleUpdate} />
                          <Cell rowId={row.id} field="reuniaoApresentacao"   value={row.reuniaoApresentacao}   type="date" onChange={handleUpdate} />
                          <Cell rowId={row.id} field="notificacaoGestao"     value={row.notificacaoGestao}     type="date" onChange={handleUpdate} />
                          <Cell rowId={row.id} field="retornoParceira"       value={row.retornoParceira}       type="date" onChange={handleUpdate} />
                          <Cell rowId={row.id} field="validacaoPlanoEDP"     value={row.validacaoPlanoEDP}     type="date" onChange={handleUpdate} />
                          <td className="p-0 border-r border-white/8">
                            <select value={row.planoValidado} onChange={(e) => handleUpdate(row.id, "planoValidado", e.target.value)} className="w-full h-11 px-3 text-sm outline-none border-none cursor-pointer text-slate-300" style={{ background: "transparent", colorScheme: "dark" }}>
                              <option value="">—</option>
                              <option value="Sim">Sim</option>
                              <option value="Não">Não</option>
                            </select>
                          </td>
                          <Cell rowId={row.id} field="devolutivaNovoPlano"   value={row.devolutivaNovoPlano}   type="date" onChange={handleUpdate} />
                          <Cell rowId={row.id} field="validacaoNovoPlano"    value={row.validacaoNovoPlano}    type="date" onChange={handleUpdate} />
                          <Cell rowId={row.id} field="lancamentoDesviosSGS"  value={row.lancamentoDesviosSGS}  type="date" onChange={handleUpdate} />
                          <Cell rowId={row.id} field="inicioAcompanhamento"  value={row.inicioAcompanhamento}  type="date" onChange={handleUpdate} />
                          <td className="w-[6px] p-0" style={{ background: "rgba(255,255,255,0.15)" }} />
                          <Cell rowId={row.id} field="quantidadeDesviosPlanejados" value={row.quantidadeDesviosPlanejados} type="text" onChange={handleUpdate} align="center" />
                          <td className="p-0 border-r border-white/8">
                            <select
                              value={row.status || ""}
                              onChange={(e) => handleUpdate(row.id, "status", e.target.value)}
                              className={`w-full h-11 px-3 text-sm font-semibold outline-none border-none cursor-pointer ${statusColorDark(row.status as AuditStatus | "")}`}
                              style={{ background: "#1e2f42", colorScheme: "dark" }}
                            >
                              <option value="" style={{ background: "#1e2f42", color: "#94a3b8" }}>Selecione</option>
                              <option value="Pendente" style={{ background: "#1e2f42", color: "#f87171" }}>Pendente</option>
                              <option value="Em andamento" style={{ background: "#1e2f42", color: "#fbbf24" }}>Em andamento</option>
                              <option value="Concluído" style={{ background: "#1e2f42", color: "#34d399" }}>Concluído</option>
                            </select>
                          </td>
                          <td className="p-0">
                            <input
                              type="text"
                              value={row.observacao || ""}
                              placeholder="Observações..."
                              onChange={(e) => handleUpdate(row.id, "observacao", e.target.value)}
                              className="w-full h-11 px-4 text-sm border-none outline-none text-slate-300 placeholder:text-white/20"
                              style={{ background: "transparent" }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </section>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusColorDark(status: AuditStatus | ""): string {
  if (status === "Concluído")    return "text-emerald-400";
  if (status === "Em andamento") return "text-amber-400";
  if (status === "Pendente")     return "text-red-400";
  return "text-white/20";
}

const STATUS_OPTIONS: { value: AuditStatus | ""; label: string; color: string; bg: string }[] = [
  { value: "",              label: "Selecione",      color: "text-white/40",    bg: "" },
  { value: "Pendente",      label: "Pendente",       color: "text-red-400",     bg: "bg-red-500/15" },
  { value: "Em andamento",  label: "Em andamento",   color: "text-amber-400",   bg: "bg-amber-500/15" },
  { value: "Concluído",     label: "Concluído",      color: "text-emerald-400", bg: "bg-emerald-500/15" },
];

function StatusSelect({ value, onChange }: { value: AuditStatus | ""; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = STATUS_OPTIONS.find((o) => o.value === value) || STATUS_OPTIONS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full h-11 px-3 text-sm font-semibold text-left flex items-center justify-between ${current.color}`}
        style={{ background: "transparent" }}
      >
        {current.label}
        <svg className="w-3.5 h-3.5 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-0.5 w-full min-w-[150px] rounded-lg border border-white/10 shadow-xl overflow-hidden" style={{ background: "#1e2f42" }}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full px-3 py-2.5 text-sm font-semibold text-left flex items-center gap-2 hover:bg-white/10 transition-colors ${opt.color}`}
              >
                {opt.value && (
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${opt.value === "Pendente" ? "bg-red-500" : opt.value === "Em andamento" ? "bg-amber-400" : "bg-emerald-500"}`} />
                )}
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ColHeader({ title, sector }: { title: string; sector: string }) {
  const dot = SECTOR_COLORS[sector] ?? "bg-slate-400";
  return (
    <th
      className="px-3 py-3 text-sm font-bold text-slate-300 border-r border-white/8 min-w-[175px]"
      style={{ background: "#071220" }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-2 leading-tight">{title}</span>
        <span className="flex items-center gap-1 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className="text-[11px] text-slate-500 uppercase font-black tracking-tight">
            {sector}
          </span>
        </span>
      </div>
    </th>
  );
}

interface CellProps {
  rowId: number;
  field: keyof AuditData;
  value?: string;
  type?: string;
  onChange: (id: number, field: keyof AuditData, value: string) => void;
  suffix?: string;
  placeholder?: string;
  align?: "left" | "center";
}

function Cell({ rowId, field, value, type = "text", onChange, suffix, placeholder, align = "left" }: CellProps) {
  if (type === "date") {
    return <DatePickerCell rowId={rowId} field={field} value={value} onChange={onChange} />;
  }
  return (
    <td className="p-0 border-r border-white/8 transition-colors">
      <div className="relative flex items-center">
        <input
          type={type}
          value={value || ""}
          placeholder={placeholder}
          onChange={(e) => onChange(rowId, field, e.target.value)}
          className={`w-full h-11 px-3 text-sm border-none outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-300 placeholder:text-white/20 ${suffix ? "pr-7" : ""} ${align === "center" ? "text-center" : ""}`}
          style={{ background: "transparent", colorScheme: "dark" }}
        />
        {suffix && (
          <span className="absolute right-2 text-slate-500 text-xs font-bold pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </td>
  );
}

const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function DatePickerCell({ rowId, field, value, onChange }: { rowId: number; field: keyof AuditData; value?: string; onChange: (id: number, field: keyof AuditData, value: string) => void }) {
  const [open, setOpen] = useState(false);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const today = new Date();
  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [viewYear, setViewYear] = useState(parsed ? parsed.getFullYear() : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed ? parsed.getMonth() : today.getMonth());
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const displayValue = parsed
    ? `${String(parsed.getDate()).padStart(2, "0")}/${String(parsed.getMonth() + 1).padStart(2, "0")}/${parsed.getFullYear()}`
    : "";

  const handleOpen = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.top - 4, left: rect.left });
    }
    setOpen(!open);
  };

  const handleSelect = (day: number) => {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(rowId, field, iso);
    setOpen(false);
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewMonth(prev => {
      if (prev === 0) { setViewYear(y => y - 1); return 11; }
      return prev - 1;
    });
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewMonth(prev => {
      if (prev === 11) { setViewYear(y => y + 1); return 0; }
      return prev + 1;
    });
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSelected = (day: number) =>
    parsed && parsed.getFullYear() === viewYear && parsed.getMonth() === viewMonth && parsed.getDate() === day;

  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  return (
    <td className="p-0 border-r border-white/8 transition-colors">
      <button
        ref={btnRef}
        type="button"
        onClick={handleOpen}
        className="w-full h-11 px-3 text-sm text-left text-slate-300 flex items-center justify-between cursor-pointer"
        style={{ background: "transparent" }}
      >
        <span className={displayValue ? "text-slate-300" : "text-white/20"}>{displayValue || "dd/mm/aaaa"}</span>
        <svg className="w-3.5 h-3.5 text-white/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[998]" onClick={() => setOpen(false)}>
          <div className="fixed z-[999] rounded-lg border border-white/10 shadow-2xl p-3 w-[260px]" onClick={(e) => e.stopPropagation()} style={{ background: "#1e2f42", bottom: window.innerHeight - popupPos.top, left: popupPos.left }}>
            {/* Header: mês/ano + setas */}
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="text-sm font-bold text-white">{MONTH_NAMES[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="text-center text-[11px] font-bold text-slate-500 py-1">{d}</div>
              ))}
            </div>

            {/* Dias do mês */}
            <div className="grid grid-cols-7">
              {cells.map((day, i) => (
                <div key={i} className="flex items-center justify-center">
                  {day ? (
                    <button
                      type="button"
                      onClick={() => handleSelect(day)}
                      className={`w-8 h-8 rounded-full text-xs font-semibold transition-colors
                        ${isSelected(day) ? "bg-emerald-500 text-white" : isToday(day) ? "border border-emerald-500 text-emerald-400 hover:bg-emerald-500/20" : "text-slate-300 hover:bg-white/10"}`}
                    >
                      {day}
                    </button>
                  ) : (
                    <div className="w-8 h-8" />
                  )}
                </div>
              ))}
            </div>

            {/* Limpar + Hoje */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
              <button type="button" onClick={() => { onChange(rowId, field, ""); setOpen(false); }} className="text-xs text-slate-400 hover:text-white transition-colors">Limpar</button>
              <button type="button" onClick={() => { handleSelect(today.getDate()); setViewMonth(today.getMonth()); setViewYear(today.getFullYear()); }} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition-colors">Hoje</button>
            </div>
          </div>
        </div>
      )}
    </td>
  );
}

function PercentCell({ rowId, field, value, onChange }: { rowId: number; field: keyof AuditData; value: string; onChange: (id: number, field: keyof AuditData, value: string) => void }) {
  const handleChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9,]/g, "");
    const parts = cleaned.split(",");
    let integer = parts[0] || "";
    let decimal = parts.length > 1 ? parts[1].slice(0, 2) : undefined;

    if (integer.length > 3) integer = integer.slice(0, 3);

    let candidate = decimal !== undefined ? `${integer},${decimal}` : integer;

    const numeric = parseFloat(candidate.replace(",", "."));
    if (!isNaN(numeric) && numeric > 100) {
      candidate = "100,00";
    }

    onChange(rowId, field, candidate);
  };

  return (
    <td className="p-0 border-r border-white/8 transition-colors">
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="decimal"
          value={value || ""}
          placeholder="0,00"
          onChange={(e) => handleChange(e.target.value)}
          className="w-full h-11 px-3 pr-7 text-sm border-none outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-300 placeholder:text-white/20"
          style={{ background: "transparent", colorScheme: "dark" }}
        />
        <span className="absolute right-2 text-slate-500 text-xs font-bold pointer-events-none">%</span>
      </div>
    </td>
  );
}

function EvolutionCell({ gapAnterior, gapAtual }: { gapAnterior: string; gapAtual: string }) {
  const prev = parseFloat((gapAnterior || "").replace(",", "."));
  const curr = parseFloat((gapAtual || "").replace(",", "."));
  if (!gapAnterior || !gapAtual || isNaN(prev) || isNaN(curr)) {
    return (
      <td className="p-0 border-r border-white/8">
        <div className="flex items-center justify-center h-11 text-white/20 text-sm">—</div>
      </td>
    );
  }
  const diff = curr - prev;
  const absDiff = Math.abs(diff).toFixed(1);
  const isNeutral = diff === 0;
  const arrow = isNeutral ? "—" : diff > 0 ? "▲" : "▼";
  const color = isNeutral ? "text-slate-400" : diff > 0 ? "text-emerald-400" : "text-red-400";
  return (
    <td className="p-0 border-r border-white/8">
      <div className={`flex items-center justify-center gap-1 px-3 h-11 text-sm font-bold ${color}`}>
        <span>{arrow}</span>
        {!isNeutral && <span>{absDiff} p.p.</span>}
      </div>
    </td>
  );
}
