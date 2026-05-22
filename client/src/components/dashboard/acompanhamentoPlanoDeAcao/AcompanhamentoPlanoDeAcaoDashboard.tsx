"use client";

import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/20/solid";
import { AuditData, AuditStatus } from "@/types/auditoria/auditoriaTypes";

const STORAGE_KEY = "sigo_audits_plano_acao";

const PARTNERS = [
  "MANSERV",
  "START",
  "LIG",
  "COMPEL",
  "ENGELMIG",
  "COSAMPA",
];

const SECTOR_COLORS: Record<string, string> = {
  Segurança: "bg-red-500",
  "GO Contrato": "bg-blue-500",
  "Engenheiro CCM": "bg-purple-500",
  Parceira: "bg-amber-500",
  "GO Contrato + GO Segurança": "bg-teal-500",
  "Dono de Área": "bg-green-500",
};

const INITIAL_DATA: AuditData[] = [
  { id: "1",  parceira: "COMPEL (Litoral)",         numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "2",  parceira: "COMPEL (Litoral)",         numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "3",  parceira: "COSAMPA",                  numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "4",  parceira: "COSAMPA",                  numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "5",  parceira: "ENGELMIG",                 numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "6",  parceira: "ENGELMIG",                 numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "7",  parceira: "LIG",                      numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "8",  parceira: "LIG",                      numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "9",  parceira: "MANSERV",                  numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "10", parceira: "MANSERV",                  numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "11", parceira: "MANSERV",                  numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "12", parceira: "MANSERV",                  numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "13", parceira: "START (Vale/Alto Tietê)",  numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
  { id: "14", parceira: "START (Vale/Alto Tietê)",  numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "", gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "", notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "", planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "", lancamentoDesviosSGS: "", inicioAcompanhamento: "", quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "", dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "", itensPendentesForaDoPrazo: "", observacao: "", status: "" },
];

function loadData(): AuditData[] {
  if (typeof window === "undefined") return INITIAL_DATA;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  } catch {
    return INITIAL_DATA;
  }
}

function calcNoPrazo(item: AuditData): string {
  const total = parseInt(item.quantidadeDesviosPlanejados) || 0;
  const exec  = parseInt(item.quantidadeDesviosExecutados) || 0;
  const fora  = parseInt(item.itensPendentesForaDoPrazo || "0") || 0;
  return Math.max(0, total - exec - fora).toString();
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AcompanhamentoPlanoDeAcaoDashboard() {
  const [data, setData] = useState<AuditData[]>(loadData);
  const [filterParceira, setFilterParceira] = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [showPartnerSelector, setShowPartnerSelector] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const handleUpdate = (id: string, field: keyof AuditData, value: string) => {
    setData((prev) =>
      prev.map((item) => {
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
          field === "itensPendentesForaDoPrazo"
        ) {
          updated.itensPendentesNoPrazo = calcNoPrazo(updated);
        }

        return updated;
      })
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta auditoria?")) {
      setData((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleAddRow = (selectedPartner: string) => {
    const newEntry: AuditData = {
      id: Date.now().toString(),
      parceira: selectedPartner,
      numAuditoria: "", dataInicio: "", dataFim: "", gapAnterior: "",
      gapAtual: "", apresentacaoInterna: "", reuniaoApresentacao: "",
      notificacaoGestao: "", retornoParceira: "", validacaoPlanoEDP: "",
      planoValidado: "", devolutivaNovoPlano: "", validacaoNovoPlano: "",
      lancamentoDesviosSGS: "", inicioAcompanhamento: "",
      quantidadeDesviosPlanejados: "", quantidadeDesviosExecutados: "",
      dataGap: "", scoreFinal: "", itensPendentesNoPrazo: "",
      itensPendentesForaDoPrazo: "", observacao: "", status: "",
    };

    const lastIdx = [...data]
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => item.parceira === selectedPartner)
      .at(-1)?.i;

    if (lastIdx !== undefined) {
      const next = [...data];
      next.splice(lastIdx + 1, 0, newEntry);
      setData(next);
    } else {
      setData([...data, newEntry]);
    }
    setShowPartnerSelector(false);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const filteredData = data.filter((item) => {
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

  // Agrupar por parceira (linhas já ordenadas, então consecutivas = mesmo grupo)
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
    sumItens:         data.reduce((s, r) => s + (parseInt(r.quantidadeDesviosPlanejados)    || 0), 0),
    sumExec:          data.reduce((s, r) => s + (parseInt(r.quantidadeDesviosExecutados)    || 0), 0),
    sumNoPrazo:       data.reduce((s, r) => s + (parseInt(r.itensPendentesNoPrazo    || "0") || 0), 0),
    sumForaPrazo:     data.reduce((s, r) => s + (parseInt(r.itensPendentesForaDoPrazo || "0") || 0), 0),
    countEmAndamento: data.filter(r => r.status === "Em andamento").length,
    countPendente:    data.filter(r => r.status === "Pendente").length,
  };

  return (
    <div className="p-6 flex flex-col gap-8 w-full">
      {/* ── Título + botão ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Acompanhamento Plano de Ação</h2>
        <button
          onClick={() => setShowPartnerSelector(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500 transition-colors shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          Nova Auditoria
        </button>
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/8 px-5 py-4 flex flex-wrap items-end gap-4" style={{ background: "#0a1628" }}>
        {/* Parceira */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Parceira
          </label>
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
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Status
          </label>
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
            className="px-4 py-2 text-xs font-bold text-slate-400 border border-white/10 rounded-lg hover:border-white/20 hover:text-white transition-colors"
            style={{ background: "#1e2f42" }}
          >
            Limpar filtros
          </button>
        )}

        {/* Tags de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap ml-2">
            {filterParceira && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-blue-300 border border-blue-500/30" style={{ background: "#0f1d2e" }}>
                {filterParceira}
                <button onClick={() => setFilterParceira("")} className="text-blue-400 hover:text-white leading-none">×</button>
              </span>
            )}
            {filterStatus && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border" style={{
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
        <span className="ml-auto text-xs text-slate-500 italic self-center">
          {filteredData.length} {filteredData.length === 1 ? "registro" : "registros"}
          {hasActiveFilters && ` de ${data.length}`}
        </span>
      </div>

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
          TABELA 1 — Preenchimento de Dados de Execução
      ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="rounded-2xl border border-white/8 shadow-2xl overflow-hidden" style={{ background: "#0f1d2e" }}>
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="border-collapse min-w-[2700px] w-full">
              <thead className="sticky top-0 z-20" style={{ background: "#071220" }}>
                {/* Row 1 — Group labels */}
                <tr className="border-b border-white/10">
                  <th className="w-10 border-r border-white/8 sticky left-0 z-30" style={{ background: "#071220" }} />
                  <th colSpan={2} className="px-3 py-2 text-[10px] uppercase font-black text-slate-300 text-center tracking-widest sticky left-10 z-30" style={{ background: "#071220", borderRight: "2px solid rgba(255,255,255,0.2)" }}>
                    Contratada
                  </th>
                  <th colSpan={5} className="px-3 py-2 text-[10px] uppercase font-black text-slate-400 border-r border-white/8 text-center tracking-widest">
                    Fiscalização — GAP
                  </th>
                  <th className="px-3 py-2 text-[10px] uppercase font-black text-slate-400 border-r border-white/8 text-center tracking-widest">
                    Notas
                  </th>
                  <th colSpan={8} className="px-3 py-2 text-[10px] uppercase font-black text-emerald-400 border-r border-white/8 text-center tracking-widest">
                    Acompanhamento das Etapas
                  </th>
                  <th colSpan={3} className="px-3 py-2 text-[10px] uppercase font-black text-blue-400 border-r border-white/8 text-center tracking-widest">
                    Plano de Ação
                  </th>
                  <th className="px-3 py-2 text-[10px] uppercase font-black text-slate-400 text-center tracking-widest">
                    Observação
                  </th>
                </tr>
                {/* Row 2 — Column names */}
                <tr className="border-b border-white/10 text-left" style={{ background: "#071220" }}>
                  <th className="w-10 border-r border-white/8 px-2 py-3 sticky left-0 z-30" style={{ background: "#071220" }}>
                    <TrashIcon className="w-3.5 h-3.5 text-white/20 mx-auto" />
                  </th>
                  <th className="px-3 py-3 text-xs font-bold text-emerald-400 min-w-[160px] sticky left-10 z-30" style={{ background: "#071220", width: "160px", borderRight: "2px solid rgba(255,255,255,0.2)" }}>Parceira</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-300 border-r border-white/8 min-w-[110px]">Nº Auditoria</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-300 border-r border-white/8 min-w-[130px]">Data Início</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-300 border-r border-white/8 min-w-[130px]">Data Fim</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-300 border-r border-white/8 min-w-[95px]">GAP Anterior</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-300 border-r border-white/8 min-w-[95px]">GAP Atual</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-300 border-r border-white/8 min-w-[110px]">Evolução</th>
                  <ColHeader title="Lançamento dos desvios no SGS" sector="Segurança" />
                  <ColHeader title="Apresentação e validação do relatório interna" sector="Segurança" />
                  <ColHeader title="Reunião de Apresentação do Relatório PSE" sector="GO Contrato" />
                  <ColHeader title="Envio da notificação para gestão de fornecedores" sector="Engenheiro CCM" />
                  <ColHeader title="Retorno da Parceira com o Plano de ação" sector="Parceira" />
                  <ColHeader title="Validação Plano de ação pela EDP" sector="GO Contrato + GO Segurança" />
                  <ColHeader title="Plano Validado?" sector="GO Contrato + GO Segurança" />
                  <ColHeader title="Devolutiva do novo Plano de ação" sector="Parceira" />
                  <ColHeader title="Validação do novo Plano de Ação" sector="GO Contrato + GO Segurança" />
                  <ColHeader title="Início acompanhamento das ações" sector="Dono de Área" />
                  <th className="px-3 py-3 text-xs font-bold text-slate-300 border-r border-white/8 min-w-[140px]">Desvios Planejados</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-300 border-r border-white/8 min-w-[130px]">Status</th>
                  <th className="px-3 py-3 text-xs font-bold text-slate-300 min-w-[200px]">Observação</th>
                </tr>
              </thead>
              <tbody style={{ background: "#0f1d2e" }}>
                {groupedFiltered.flatMap((group, gIdx) =>
                  group.rows.map((row, rIdx) => {
                    const isFirst       = rIdx === 0;
                    const isGroupBorder = isFirst && gIdx > 0;
                    return (
                      <tr
                        key={row.id}
                        className="transition-colors"
                        style={{
                          background: "#0f1d2e",
                          borderTop: isGroupBorder
                            ? "2px solid rgba(255,255,255,0.18)"
                            : "1px solid rgba(255,255,255,0.06)",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#162535")}
                        onMouseLeave={e => (e.currentTarget.style.background = "#0f1d2e")}
                      >
                        {/* Delete — sticky */}
                        <td className="w-10 border-r border-white/8 p-0 text-center sticky left-0 z-10" style={{ background: "#0f1d2e" }}>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="w-full h-11 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                        {/* Company card — rowSpan, sticky, emerald style */}
                        {isFirst && (
                          <td
                            rowSpan={group.rows.length}
                            className="border-l-4 border-l-emerald-500 align-middle p-3 sticky left-10 z-10"
                            style={{
                              minWidth: "160px", maxWidth: "160px", width: "160px",
                              background: "#071220",
                              borderRight: "2px solid rgba(255,255,255,0.2)",
                              borderTop: gIdx > 0 ? "2px solid rgba(255,255,255,0.18)" : undefined,
                            }}
                          >
                            <div className="flex flex-col items-center gap-1.5 text-center">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" />
                                </svg>
                              </div>
                              <span className="text-[11px] font-black text-emerald-400 uppercase leading-tight break-words w-full">
                                {group.parceira}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                {group.rows.length} {group.rows.length === 1 ? "auditoria" : "auditorias"}
                              </span>
                            </div>
                          </td>
                        )}
                        <Cell rowId={row.id} field="numAuditoria"                value={row.numAuditoria}                type="text" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="dataInicio"                  value={row.dataInicio}                  type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="dataFim"                     value={row.dataFim}                     type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="gapAnterior"                 value={row.gapAnterior}                 type="text" onChange={handleUpdate} suffix="%" placeholder="0,00" />
                        <Cell rowId={row.id} field="gapAtual"                    value={row.gapAtual}                    type="text" onChange={handleUpdate} suffix="%" placeholder="0,00" />
                        <EvolutionCell gapAnterior={row.gapAnterior} gapAtual={row.gapAtual} />
                        <Cell rowId={row.id} field="lancamentoDesviosSGS"        value={row.lancamentoDesviosSGS}        type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="apresentacaoInterna"         value={row.apresentacaoInterna}         type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="reuniaoApresentacao"         value={row.reuniaoApresentacao}         type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="notificacaoGestao"           value={row.notificacaoGestao}           type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="retornoParceira"             value={row.retornoParceira}             type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="validacaoPlanoEDP"           value={row.validacaoPlanoEDP}           type="date" onChange={handleUpdate} />
                        <td className="p-0 border-r border-white/8">
                          <select
                            value={row.planoValidado}
                            onChange={(e) => handleUpdate(row.id, "planoValidado", e.target.value)}
                            className="w-full h-11 px-3 text-xs outline-none border-none cursor-pointer text-slate-300"
                            style={{ background: "transparent", colorScheme: "dark" }}
                          >
                            <option value="">—</option>
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        </td>
                        <Cell rowId={row.id} field="devolutivaNovoPlano"         value={row.devolutivaNovoPlano}         type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="validacaoNovoPlano"          value={row.validacaoNovoPlano}          type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="inicioAcompanhamento"        value={row.inicioAcompanhamento}        type="date" onChange={handleUpdate} />
                        <Cell rowId={row.id} field="quantidadeDesviosPlanejados" value={row.quantidadeDesviosPlanejados} type="text" onChange={handleUpdate} align="center" />
                        <td className="p-0 border-r border-white/8">
                          <select
                            value={row.status}
                            onChange={(e) => handleUpdate(row.id, "status", e.target.value as AuditStatus)}
                            className={`w-full h-11 px-3 text-xs outline-none border-none cursor-pointer font-semibold ${statusColorDark(row.status)}`}
                            style={{ background: "transparent", colorScheme: "dark" }}
                          >
                            <option value="">Selecione</option>
                            <option value="Pendente">Pendente</option>
                            <option value="Em andamento">Em andamento</option>
                            <option value="Concluído">Concluído</option>
                          </select>
                        </td>
                        <Cell rowId={row.id} field="observacao"                  value={row.observacao}                  type="text" onChange={handleUpdate} placeholder="Observação..." />
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between" style={{ background: "#071220" }}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Responsáveis:
              </span>
              {Object.entries(SECTOR_COLORS).map(([sector, color]) => (
                <div key={sector} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-[10px] text-slate-500">{sector}</span>
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-500 italic">
              {filteredData.length} registros
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          TABELA 2 — Indicadores / Plano de Ação  (tema EDP escuro)
      ══════════════════════════════════════════════════════════════ */}
      <section>
        <div className="rounded-2xl border border-white/8 shadow-2xl overflow-hidden" style={{ background: "#0f1d2e" }}>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                {/* Título */}
                <tr style={{ background: "#071220" }} className="border-b border-white/10">
                  <th colSpan={11} className="px-4 py-3.5 text-xs font-black text-white uppercase tracking-[0.2em] text-center">
                    PLANO DE AÇÃO - AUDITORIA DE SEGURANÇA - GAP ANALYSIS
                  </th>
                </tr>
                {/* Grupos */}
                <tr style={{ background: "#071220" }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th colSpan={2} rowSpan={2} className="px-4 py-2 border-r border-white/8 min-w-[340px] text-left align-middle text-slate-300">
                    Contratada
                  </th>
                  <th rowSpan={2} className="px-4 py-2 border-r border-white/8 min-w-[110px] text-center align-middle">Data do GAP</th>
                  <th rowSpan={2} className="px-4 py-2 border-r border-white/8 min-w-[100px] text-center align-middle">Score Final</th>
                  <th colSpan={3} className="px-4 py-2 border-r border-white/8 text-center border-b border-white/8 text-emerald-400">Total de Itens</th>
                  <th colSpan={2} className="px-4 py-2 border-r border-white/8 text-center border-b border-white/8 text-blue-400">Itens Pendentes</th>
                  <th rowSpan={2} className="px-4 py-2 border-r border-white/8 min-w-[130px] text-center align-middle">Status</th>
                  <th rowSpan={2} className="px-4 py-2 min-w-[280px] text-left align-middle">Observações</th>
                </tr>
                {/* Sub-colunas */}
                <tr style={{ background: "#071220" }} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-3 py-2 border-r border-white/8 min-w-[80px] text-center text-emerald-400/80">Total</th>
                  <th className="px-3 py-2 border-r border-white/8 min-w-[90px] text-center text-emerald-400/80">Executado</th>
                  <th className="px-3 py-2 border-r border-white/8 min-w-[170px] text-center text-emerald-400/80">%</th>
                  <th className="px-3 py-2 border-r border-white/8 min-w-[100px] text-center text-blue-400/80">No Prazo</th>
                  <th className="px-3 py-2 border-r border-white/8 min-w-[110px] text-center text-blue-400/80">Fora do Prazo</th>
                </tr>
              </thead>

              <tbody style={{ background: "#0f1d2e" }}>
                {grouped.map((group, gIdx) =>
                  group.rows.map((row, rIdx) => {
                    const total = parseInt(row.quantidadeDesviosPlanejados) || 0;
                    const exec  = parseInt(row.quantidadeDesviosExecutados)  || 0;
                    const pct   = total > 0 ? Math.round((exec / total) * 100) : null;
                    const barColor =
                      pct === null ? "" :
                      pct >= 90   ? "bg-emerald-500" :
                      pct >= 60   ? "bg-amber-400" :
                                    "bg-red-500";

                    const isFirst        = rIdx === 0;
                    const isGroupBorder  = isFirst && gIdx > 0;
                    const groupBorderCls = isGroupBorder
                      ? "border-t-2 border-white/20"
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
                              {/* Placeholder para logo */}
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 00-1-1h-2a1 1 0 00-1 1v5m4 0H9" />
                                </svg>
                              </div>
                              <span className="text-[11px] font-black text-emerald-400 uppercase leading-tight break-words w-full">
                                {group.parceira}
                              </span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                {group.rows.length}{" "}
                                {group.rows.length === 1 ? "auditoria" : "auditorias"}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Nº Auditoria */}
                        <td className={`px-4 py-2 border-r border-white/8 text-[11px] font-medium text-slate-300 ${groupBorderCls}`}>
                          {row.numAuditoria || <span className="text-white/20">—</span>}
                        </td>

                        {/* Data do GAP */}
                        <td className={`px-4 py-2 border-r border-white/8 cursor-default ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          <span className={`block text-xs text-center ${row.dataGap ? "text-slate-300" : "text-white/20"}`}>
                            {row.dataGap || "MM/AAAA"}
                          </span>
                        </td>

                        {/* Score Final */}
                        <td className={`px-4 py-2 border-r border-white/8 cursor-default ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          <span className={`block text-xs text-center ${row.scoreFinal ? "text-slate-300" : "text-white/20"}`}>
                            {row.scoreFinal ? `${row.scoreFinal} %` : "0,00 %"}
                          </span>
                        </td>

                        {/* Total */}
                        <td className={`px-4 py-2 border-r border-white/8 cursor-default ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          <span className={`block text-xs text-center font-semibold ${row.quantidadeDesviosPlanejados ? "text-slate-200" : "text-white/20"}`}>
                            {row.quantidadeDesviosPlanejados || "—"}
                          </span>
                        </td>

                        {/* Executado */}
                        <td className={`px-4 py-2 border-r border-white/8 cursor-default ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          <span className={`block text-xs text-center font-semibold ${row.quantidadeDesviosExecutados ? "text-slate-200" : "text-white/20"}`}>
                            {row.quantidadeDesviosExecutados || "—"}
                          </span>
                        </td>

                        {/* % com barra */}
                        <td className={`px-3 py-2 border-r border-white/8 ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          {pct !== null ? (
                            <div className="flex items-center gap-2 min-w-[130px]">
                              <span className="text-xs font-bold text-white w-9 text-right shrink-0">{pct}%</span>
                              <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
                                <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          ) : (
                            <span className="block text-center text-white/20 text-xs">—</span>
                          )}
                        </td>

                        {/* No Prazo (calculado) */}
                        <td className={`p-0 border-r border-white/8 ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          <input
                            readOnly
                            value={row.itensPendentesNoPrazo || "0"}
                            title="Calculado: Total − Executados − Fora do Prazo"
                            className="w-full h-11 px-2 text-xs border-none outline-none text-center font-bold text-blue-400 cursor-default"
                            style={{ background: "transparent" }}
                          />
                        </td>

                        {/* Fora do Prazo (editável) */}
                        <td className={`p-0 border-r border-white/8 ${groupBorderCls}`}>
                          <input
                            type="text"
                            value={row.itensPendentesForaDoPrazo || ""}
                            onChange={(e) => handleUpdate(row.id, "itensPendentesForaDoPrazo", e.target.value)}
                            className="w-full h-11 px-2 text-xs border-none outline-none text-center text-slate-300 placeholder:text-white/20"
                            style={{ background: "transparent" }}
                          />
                        </td>

                        {/* Status */}
                        <td className={`px-4 py-2 border-r border-white/8 text-xs font-semibold text-center cursor-default ${statusColorDark(row.status)} ${groupBorderCls}`} style={{ background: "#0a1628" }}>
                          {row.status || <span className="text-white/20">—</span>}
                        </td>

                        {/* Observação */}
                        <td className={`p-0 border-r border-white/8 ${groupBorderCls}`}>
                          <input
                            type="text"
                            value={row.observacao || ""}
                            placeholder="Observações..."
                            onChange={(e) => handleUpdate(row.id, "observacao", e.target.value)}
                            className="w-full h-11 px-4 text-xs border-none outline-none text-slate-300 placeholder:text-white/20"
                            style={{ background: "transparent" }}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Resumo Geral */}
              <tfoot>
                <tr className="border-t-2 border-emerald-500/40" style={{ background: "#071220" }}>
                  <td colSpan={2} className="px-4 py-3 text-xs font-black uppercase tracking-widest whitespace-nowrap text-emerald-400">
                    Resumo Geral
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-lg font-black leading-none text-white">{summaryStats.total}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Auditorias</div>
                  </td>
                  <td className="px-4 py-3 text-center text-white/20 text-sm">—</td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-lg font-black leading-none text-white">{summaryStats.sumItens}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Total de Itens</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-lg font-black leading-none text-white">{summaryStats.sumExec}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Itens Executados</div>
                  </td>
                  <td className="px-4 py-3">
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
                          <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-1">% Execução Geral</div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-lg font-black leading-none text-blue-400">{summaryStats.sumNoPrazo}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Pendentes No Prazo</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-lg font-black leading-none text-white">{summaryStats.sumForaPrazo}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Pendentes Fora do Prazo</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-sm font-black text-amber-400 leading-none">{summaryStats.countEmAndamento}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Em andamento</div>
                    <div className="text-sm font-black text-slate-400 leading-none mt-1.5">{summaryStats.countPendente}</div>
                    <div className="text-[9px] uppercase tracking-widest text-slate-500 mt-0.5">Pendente</div>
                  </td>
                  <td className="px-4 py-3 text-white/20 text-sm text-center">—</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legenda de Status */}
          <div className="px-5 py-4 border-t border-white/8" style={{ background: "#071220" }}>
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                Legenda de Status
              </span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">✓</span>
                </div>
                <div>
                  <div className="text-[10px] font-black text-emerald-400 uppercase">Concluído</div>
                  <div className="text-[9px] text-slate-500">Item totalmente executado</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">◑</span>
                </div>
                <div>
                  <div className="text-[10px] font-black text-amber-400 uppercase">Em Andamento</div>
                  <div className="text-[9px] text-slate-500">Itens parcialmente executados</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">!</span>
                </div>
                <div>
                  <div className="text-[10px] font-black text-red-400 uppercase">Atrasado</div>
                  <div className="text-[9px] text-slate-500">Itens fora do prazo</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-slate-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">+</span>
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase">Pendente</div>
                  <div className="text-[9px] text-slate-500">Aguardando execução</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <span className="text-white text-[8px] font-black">i</span>
                </div>
                <span className="text-[9px] text-slate-500">
                  Percentuais calculados com base no total de itens por auditoria
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Save Button ─────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className={`px-6 py-3 rounded-xl font-bold shadow-md transition-all ${
            saveSuccess
              ? "bg-green-600 text-white"
              : "bg-blue-600 text-white hover:bg-blue-500"
          }`}
        >
          {saveSuccess ? "✓ Salvo!" : "Salvar Alterações"}
        </button>
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

function ColHeader({ title, sector }: { title: string; sector: string }) {
  const dot = SECTOR_COLORS[sector] ?? "bg-slate-400";
  return (
    <th
      className="px-3 py-3 text-xs font-bold text-slate-300 border-r border-white/8 min-w-[175px]"
      style={{ background: "#071220" }}
    >
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-2 leading-tight">{title}</span>
        <span className="flex items-center gap-1 mt-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
          <span className="text-[9px] text-slate-500 uppercase font-black tracking-tight">
            {sector}
          </span>
        </span>
      </div>
    </th>
  );
}

interface CellProps {
  rowId: string;
  field: keyof AuditData;
  value?: string;
  type?: string;
  onChange: (id: string, field: keyof AuditData, value: string) => void;
  suffix?: string;
  placeholder?: string;
  align?: "left" | "center";
}

function Cell({ rowId, field, value, type = "text", onChange, suffix, placeholder, align = "left" }: CellProps) {
  return (
    <td className="p-0 border-r border-white/8 transition-colors">
      <div className="relative flex items-center">
        <input
          type={type}
          value={value || ""}
          placeholder={placeholder}
          onChange={(e) => onChange(rowId, field, e.target.value)}
          className={`w-full h-11 px-3 text-xs border-none outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-300 placeholder:text-white/20 ${suffix ? "pr-7" : ""} ${align === "center" ? "text-center" : ""}`}
          style={{ background: "transparent", colorScheme: "dark" }}
        />
        {suffix && (
          <span className="absolute right-2 text-slate-500 text-[10px] font-bold pointer-events-none">
            {suffix}
          </span>
        )}
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
        <div className="flex items-center justify-center h-11 text-white/20 text-xs">—</div>
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
      <div className={`flex items-center justify-center gap-1 px-3 h-11 text-xs font-bold ${color}`}>
        <span>{arrow}</span>
        {!isNeutral && <span>{absDiff} p.p.</span>}
      </div>
    </td>
  );
}
