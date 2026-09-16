"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import dayjs, { Dayjs } from "dayjs";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquareWarning,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import ErrorModal from "@/components/common/ErrorModal";
import { DateFilter } from "@/components/common/DateFilter";
import { ReclamacaoRow } from "@/types/reclamacoesOuvidoria";
import { buildReclamacoesMetrics, isPendente } from "@/utils/reclamacoesOuvidoria/metrics";
import { parseReclamacoesWorkbook } from "@/utils/reclamacoesOuvidoria/parseReclamacoesWorkbook";

import { ReclamacoesOverview } from "./ReclamacoesOverview";
import { ReclamacoesUpload } from "./ReclamacoesUpload";

const SURFACE_PAGE = "#0a1628";
const SURFACE_HEAD = "#071220";
const SURFACE_INPUT = "#1e2f42";
const STORAGE_KEY = "reclamacoes_ouvidoria_data_v1";

type QuickFilter = "todos" | "foraPrazo" | "procedentes" | "pendentes";

function distinctValues(rows: ReclamacaoRow[], field: keyof ReclamacaoRow): string[] {
  const set = new Set<string>();
  rows.forEach((row) => {
    const value = row[field];
    if (typeof value === "string" && value.trim()) set.add(value.trim());
  });
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export default function MainReclamacoes() {
  const [rows, setRows] = useState<ReclamacaoRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" | "error" } | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [filterRegional, setFilterRegional] = useState("");
  const [filterEmpreiteira, setFilterEmpreiteira] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("todos");

  const triggerNotification = (message: string, type: "success" | "info" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setRows(JSON.parse(saved));
    } catch {
      // ignora cache corrompido
    }
  }, []);

  const handleFile = (file: File) => {
    startTransition(async () => {
      try {
        const parsed = await parseReclamacoesWorkbook(file);
        setRows(parsed.rows);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed.rows));
        triggerNotification(`${parsed.rows.length} reclamações importadas da aba "${parsed.sheetName}".`, "success");
      } catch (err) {
        setError(err instanceof Error ? err.message : `Falha ao ler ${file.name}.`);
      }
    });
  };

  const handleClearAll = () => {
    if (!rows.length) return;
    if (window.confirm("Deseja limpar os dados importados desta tela?")) {
      setRows([]);
      localStorage.removeItem(STORAGE_KEY);
      triggerNotification("Dados removidos desta tela.", "info");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilterRegional("");
    setFilterEmpreiteira("");
    setFilterTipo("");
    setStartDate(null);
    setEndDate(null);
    setQuickFilter("todos");
  };

  const regionalOptions = useMemo(() => distinctValues(rows, "regional"), [rows]);
  const empreiteiraOptions = useMemo(() => distinctValues(rows, "empreiteira"), [rows]);
  const tipoOptions = useMemo(() => distinctValues(rows, "tipoReclamacao"), [rows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        [row.nota, row.municipio, row.empreiteira, row.causaRaiz, row.observacao]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesRegional = !filterRegional || row.regional === filterRegional;
      const matchesEmpreiteira = !filterEmpreiteira || row.empreiteira === filterEmpreiteira;
      const matchesTipo = !filterTipo || row.tipoReclamacao === filterTipo;

      const abertura = row.dataAbertura ? dayjs(row.dataAbertura) : null;
      const matchesStart = !startDate || (abertura && !abertura.isBefore(startDate, "day"));
      const matchesEnd = !endDate || (abertura && !abertura.isAfter(endDate, "day"));

      let matchesQuick = true;
      if (quickFilter === "foraPrazo") {
        matchesQuick = row.statusPrazo === "Fora do Prazo";
      } else if (quickFilter === "procedentes") {
        matchesQuick = row.resultadoBucket === "procedente";
      } else if (quickFilter === "pendentes") {
        matchesQuick = isPendente(row.status);
      }

      return (
        matchesSearch &&
        matchesRegional &&
        matchesEmpreiteira &&
        matchesTipo &&
        matchesStart &&
        matchesEnd &&
        matchesQuick
      );
    });
  }, [rows, search, filterRegional, filterEmpreiteira, filterTipo, startDate, endDate, quickFilter]);

  const metrics = useMemo(() => buildReclamacoesMetrics(filteredRows), [filteredRows]);

  const selectCls =
    "w-full py-2 px-3 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer";

  return (
    <div className="min-h-full text-slate-200 font-sans flex flex-col selection:bg-blue-500/30" style={{ background: SURFACE_PAGE }}>
      <div className="w-full p-4 flex flex-col gap-5">
        {/* HEADER */}
        <header className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl">
          <div className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl font-bold flex items-center justify-center shadow-md">
                <MessageSquareWarning className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider text-xl text-blue-400">SIGO</span>
                  <span className="text-slate-500 font-light text-sm">|</span>
                  <span className="text-slate-300 text-sm font-semibold tracking-wide">SISTEMA DE GESTÃO DE OBRAS</span>
                </div>
                <h1 className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                  Reclamações e Ouvidoria · CIP
                </h1>
              </div>
            </div>

            {rows.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleClearAll}
                  className="text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  style={{ background: SURFACE_INPUT }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar dados
                </button>
              </div>
            )}
          </div>
        </header>

        {notification && (
          <div
            className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm max-w-md ${
              notification.type === "success"
                ? "border-emerald-500/30 text-emerald-300"
                : notification.type === "info"
                  ? "border-blue-500/30 text-blue-300"
                  : "border-rose-500/30 text-rose-300"
            }`}
            style={{ background: "#0f1d2e" }}
          >
            {notification.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {notification.type === "info" && <Clock className="w-5 h-5 text-blue-400 shrink-0" />}
            {notification.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            <p className="font-semibold">{notification.message}</p>
            <button onClick={() => setNotification(null)} className="ml-auto text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <ReclamacoesUpload onFile={handleFile} isPending={isPending} compact={rows.length > 0} />

        {rows.length === 0 ? null : (
          <>
            {/* FILTER BAR */}
            <div
              className="rounded-xl border border-white/8 px-5 py-4 flex flex-col gap-4"
              style={{ background: SURFACE_HEAD }}
            >
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 items-start">
                  <div className="relative sm:col-span-2 xl:col-span-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar por Nota, Município, Causa..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-500"
                      style={{ background: SURFACE_INPUT }}
                    />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-2.5 top-2 text-slate-500 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 items-center">
                    <DateFilter
                      startDate={startDate}
                      endDate={endDate}
                      setStartDate={setStartDate}
                      setEndDate={setEndDate}
                      backgroundColor={SURFACE_INPUT}
                      textColor="#a1a1aa"
                      svgColor="#94a3b8"
                      spacing="!mb-0"
                    />
                  </div>

                  <select
                    value={filterRegional}
                    onChange={(e) => setFilterRegional(e.target.value)}
                    className={selectCls}
                    style={{ background: SURFACE_INPUT, colorScheme: "dark" }}
                  >
                    <option value="">Todas Regionais</option>
                    {regionalOptions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>

                  <select
                    value={filterEmpreiteira}
                    onChange={(e) => setFilterEmpreiteira(e.target.value)}
                    className={selectCls}
                    style={{ background: SURFACE_INPUT, colorScheme: "dark" }}
                  >
                    <option value="">Todas Empreiteiras</option>
                    {empreiteiraOptions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>

                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className={selectCls}
                    style={{ background: SURFACE_INPUT, colorScheme: "dark" }}
                  >
                    <option value="">Todos Tipos</option>
                    {tipoOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center p-1 rounded-lg border border-white/10 w-fit" style={{ background: SURFACE_INPUT }}>
                    {(["todos", "foraPrazo", "procedentes", "pendentes"] as QuickFilter[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setQuickFilter(filter)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                          quickFilter === filter ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {filter === "todos"
                          ? "Todos"
                          : filter === "foraPrazo"
                            ? "Fora do prazo"
                            : filter === "procedentes"
                              ? "Procedentes"
                              : "Pendentes"}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleClearFilters}
                    className="text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                    style={{ background: SURFACE_INPUT }}
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
            </div>

            <ReclamacoesOverview metrics={metrics} rows={filteredRows} />
          </>
        )}
      </div>

      {error && (
        <ErrorModal
          open
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </div>
  );
}
