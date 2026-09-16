"use client";

import { useMemo, useState, useTransition } from "react";

import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

import ErrorModal from "@/components/common/ErrorModal";
import { NucleoSmcRow } from "@/types/controleSmc";
import { emptyNucleoSmcRow } from "@/utils/controleSmc/columns";
import { exportControleSmcWorkbook } from "@/utils/controleSmc/exportControleSmcWorkbook";
import {
  buildControleSmcMetrics,
  isChiCritico,
  isRestricaoAtiva,
} from "@/utils/controleSmc/metrics";
import { parseControleSmcWorkbook } from "@/utils/controleSmc/parseControleSmcWorkbook";

import { ControleSmcOverview } from "./ControleSmcOverview";
import { ControleSmcRowDrawer } from "./ControleSmcRowDrawer";
import { ControleSmcTable } from "./ControleSmcTable";
import { ControleSmcUpload } from "./ControleSmcUpload";

const SURFACE_PAGE = "#0a1628";
const SURFACE_HEAD = "#071220";
const SURFACE_INPUT = "#1e2f42";

type QuickFilter = "todos" | "restricoes" | "chiCritico";

const SELECT_FIELDS: (keyof NucleoSmcRow)[] = [
  "regional",
  "municipio",
  "tipoRede",
  "tecnologia",
  "statusNucleo",
  "parceiraSigo",
  "parceiraResponsavel",
  "meioAmbienteStatus",
  "poderPublicoStatus",
  "chiStatus",
  "conjunto",
  "oportunidadeChi",
  "prioridadeFinalizacao",
];

function distinctValues(
  rows: NucleoSmcRow[],
  field: keyof NucleoSmcRow,
): string[] {
  const set = new Set<string>();
  rows.forEach((row) => {
    const value = row[field];
    if (typeof value === "string" && value.trim()) set.add(value.trim());
  });
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export default function MainControleSmc() {
  const [rows, setRows] = useState<NucleoSmcRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);

  const [search, setSearch] = useState("");
  const [filterRegional, setFilterRegional] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterParceira, setFilterParceira] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("todos");

  const [sortField, setSortField] = useState<keyof NucleoSmcRow>("nucleo");
  const [sortAsc, setSortAsc] = useState(true);

  const [drawer, setDrawer] = useState<{
    row: NucleoSmcRow;
    isNew: boolean;
  } | null>(null);

  const triggerNotification = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFile = (file: File) => {
    startTransition(async () => {
      try {
        const parsed = await parseControleSmcWorkbook(file);
        setRows(parsed.rows);
        triggerNotification(
          `${parsed.rows.length} núcleos importados da aba "${parsed.sheetName}".`,
          "success",
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : `Falha ao ler ${file.name}.`,
        );
      }
    });
  };

  const handleExport = () => {
    if (!sortedRows.length) return;
    exportControleSmcWorkbook(sortedRows);
    triggerNotification("Planilha exportada com sucesso.", "success");
  };

  const handleClearAll = () => {
    if (!rows.length) return;
    if (
      window.confirm("Deseja limpar todos os núcleos importados desta tela?")
    ) {
      setRows([]);
      triggerNotification("Dados removidos desta tela.", "info");
    }
  };

  const handleOpenNew = () => {
    setDrawer({
      row: { ...emptyNucleoSmcRow(), id: `novo__${Date.now()}` },
      isNew: true,
    });
  };

  const handleEditRow = (row: NucleoSmcRow) => {
    setDrawer({ row, isNew: false });
  };

  const handleSaveRow = (values: NucleoSmcRow) => {
    setRows((current) => {
      const exists = current.some((row) => row.id === values.id);
      if (exists)
        return current.map((row) => (row.id === values.id ? values : row));
      return [values, ...current];
    });
    triggerNotification(
      `Núcleo ${values.nucleo} salvo com sucesso.`,
      "success",
    );
    setDrawer(null);
  };

  const handleDeleteRow = (row: NucleoSmcRow) => {
    if (!window.confirm(`Excluir o núcleo "${row.nucleo}" desta tela?`)) return;
    setRows((current) => current.filter((item) => item.id !== row.id));
    triggerNotification(`Núcleo ${row.nucleo} excluído.`, "info");
    if (drawer?.row.id === row.id) setDrawer(null);
  };

  const optionsByField = useMemo(() => {
    const map: Partial<Record<keyof NucleoSmcRow, string[]>> = {};
    SELECT_FIELDS.forEach((field) => {
      map[field] = distinctValues(rows, field);
    });
    return map;
  }, [rows]);

  const regionalOptions = optionsByField.regional ?? [];
  const statusOptions = optionsByField.statusNucleo ?? [];
  const parceiraOptions = optionsByField.parceiraResponsavel ?? [];

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        [
          row.nucleo,
          row.municipio,
          row.regional,
          row.parceiraResponsavel,
          row.conjunto,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term);

      const matchesRegional =
        !filterRegional || row.regional === filterRegional;
      const matchesStatus = !filterStatus || row.statusNucleo === filterStatus;
      const matchesParceira =
        !filterParceira || row.parceiraResponsavel === filterParceira;

      let matchesQuick = true;
      if (quickFilter === "restricoes") {
        matchesQuick =
          isRestricaoAtiva(row.meioAmbienteStatus) ||
          isRestricaoAtiva(row.poderPublicoStatus);
      } else if (quickFilter === "chiCritico") {
        matchesQuick = isChiCritico(row.chiStatus);
      }

      return (
        matchesSearch &&
        matchesRegional &&
        matchesStatus &&
        matchesParceira &&
        matchesQuick
      );
    });
  }, [rows, search, filterRegional, filterStatus, filterParceira, quickFilter]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];

      if (typeof valueA === "number" || typeof valueB === "number") {
        const numA =
          valueA === null || valueA === undefined
            ? -Infinity
            : (valueA as number);
        const numB =
          valueB === null || valueB === undefined
            ? -Infinity
            : (valueB as number);
        return sortAsc ? numA - numB : numB - numA;
      }

      const strA = String(valueA ?? "").toLowerCase();
      const strB = String(valueB ?? "").toLowerCase();
      if (strA < strB) return sortAsc ? -1 : 1;
      if (strA > strB) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredRows, sortField, sortAsc]);

  const toggleSort = (field: keyof NucleoSmcRow) => {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const metrics = useMemo(() => buildControleSmcMetrics(rows), [rows]);

  const selectCls =
    "w-full py-2 px-3 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer";

  return (
    <div
      className="min-h-full text-slate-200 font-sans flex flex-col selection:bg-blue-500/30"
      style={{ background: SURFACE_PAGE }}
    >
      <div className="w-full p-4 flex flex-col gap-5">
        {/* HEADER */}
        <header className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl border border-white/5 shadow-xl">
          <div className="px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white p-2 rounded-xl font-bold flex items-center justify-center shadow-md">
                {/* <HardHat className="w-6 h-6" /> */}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold tracking-wider text-xl text-blue-400">
                    SIGO
                  </span>
                  <span className="text-slate-500 font-light text-sm">|</span>
                  <span className="text-slate-300 text-sm font-semibold tracking-wide">
                    SISTEMA DE GESTÃO DE OBRAS
                  </span>
                </div>
                <h1 className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-0.5">
                  Controle SMC - COMPET · Núcleos SMS
                </h1>
              </div>
            </div>

            {rows.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenNew}
                  className="text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  style={{ background: SURFACE_INPUT }}
                >
                  {/* <Plus className="w-4 h-4" /> */}
                  Novo núcleo
                </button>
                <button
                  onClick={handleExport}
                  className="text-slate-300 hover:text-white border border-white/10 hover:border-white/20 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  style={{ background: SURFACE_INPUT }}
                  title="Exportar núcleos filtrados como .xlsx"
                >
                  {/* <Download className="w-4 h-4" /> */}
                  Exportar Excel
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-slate-400 hover:text-white border border-white/10 hover:border-white/20 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                  style={{ background: SURFACE_INPUT }}
                >
                  {/* <Trash2 className="w-3.5 h-3.5" /> */}
                  Limpar
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
            {/* {notification.type === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
            {notification.type === "info" && <Clock className="w-5 h-5 text-blue-400 shrink-0" />}
            {notification.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />} */}
            <p className="font-semibold">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-slate-500 hover:text-white"
            >
              {/* <X className="w-4 h-4" /> */}
            </button>
          </div>
        )}

        <ControleSmcUpload
          onFile={handleFile}
          isPending={isPending}
          compact={rows.length > 0}
        />

        {rows.length === 0 ? null : (
          <>
            <ControleSmcOverview metrics={metrics} />

            {/* FILTER BAR */}
            <div
              className="rounded-xl border border-white/8 px-5 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4"
              style={{ background: SURFACE_HEAD }}
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="relative">
                  {/* <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /> */}
                  <input
                    type="text"
                    placeholder="Buscar por Núcleo, Município, Conjunto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs text-slate-200 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 placeholder:text-slate-500"
                    style={{ background: SURFACE_INPUT }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-2 text-slate-500 hover:text-white"
                    >
                      {/* <X className="w-4 h-4" /> */}
                    </button>
                  )}
                </div>

                <select
                  value={filterRegional}
                  onChange={(e) => setFilterRegional(e.target.value)}
                  className={selectCls}
                  style={{ background: SURFACE_INPUT, colorScheme: "dark" }}
                >
                  <option value="">Todas Regionais</option>
                  {regionalOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={selectCls}
                  style={{ background: SURFACE_INPUT, colorScheme: "dark" }}
                >
                  <option value="">Todos Statuses</option>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={filterParceira}
                  onChange={(e) => setFilterParceira(e.target.value)}
                  className={selectCls}
                  style={{ background: SURFACE_INPUT, colorScheme: "dark" }}
                >
                  <option value="">Todas Parceiras</option>
                  {parceiraOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="flex items-center p-1 rounded-lg border border-white/10 w-fit"
                style={{ background: SURFACE_INPUT }}
              >
                {(["todos", "restricoes", "chiCritico"] as QuickFilter[]).map(
                  (filter) => (
                    <button
                      key={filter}
                      onClick={() => setQuickFilter(filter)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        quickFilter === filter
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {filter === "todos"
                        ? "Todos"
                        : filter === "restricoes"
                          ? "Com restrição"
                          : "CHI crítico"}
                    </button>
                  ),
                )}
              </div>
            </div>

            <ControleSmcTable
              rows={sortedRows}
              sortField={sortField}
              sortAsc={sortAsc}
              onToggleSort={toggleSort}
              onEditRow={handleEditRow}
              onDeleteRow={handleDeleteRow}
            />
          </>
        )}
      </div>

      {drawer && (
        <ControleSmcRowDrawer
          row={drawer.row}
          isNew={drawer.isNew}
          optionsByField={optionsByField}
          onClose={() => setDrawer(null)}
          onSave={handleSaveRow}
          onDelete={() => handleDeleteRow(drawer.row)}
        />
      )}

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
