"use client";

import { useEffect, useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";

import { NucleoSmcRow, ControleSmcColumn } from "@/types/controleSmc";
import { CONTROLE_SMC_COLUMNS, GROUP_STYLES } from "@/utils/controleSmc/columns";
import { NUM } from "@/utils/formatValue";

const SURFACE_HEAD = "#071220";
const SURFACE_CARD = "#0f1d2e";

const PAGE_SIZE = 50;

function percentColor(value: number) {
  if (value >= 90) return "text-emerald-400";
  if (value >= 70) return "text-amber-400";
  return "text-rose-400";
}

function formatCellValue(row: NucleoSmcRow, column: ControleSmcColumn): React.ReactNode {
  const value = row[column.key];

  if (column.type === "number") {
    return typeof value === "number" ? NUM(value) : <span className="text-white/25">—</span>;
  }

  if (column.type === "percent") {
    if (typeof value !== "number") return <span className="text-white/25">—</span>;
    return <span className={`font-mono font-bold ${percentColor(value)}`}>{NUM(value)}%</span>;
  }

  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return <span className="text-white/25">—</span>;
  return text;
}

interface ControleSmcTableProps {
  rows: NucleoSmcRow[];
  sortField: keyof NucleoSmcRow;
  sortAsc: boolean;
  onToggleSort: (field: keyof NucleoSmcRow) => void;
  onEditRow: (row: NucleoSmcRow) => void;
  onDeleteRow: (row: NucleoSmcRow) => void;
}

export function ControleSmcTable({
  rows,
  sortField,
  sortAsc,
  onToggleSort,
  onEditRow,
  onDeleteRow,
}: ControleSmcTableProps) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [rows]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div
      className="rounded-2xl border border-white/8 shadow-2xl overflow-hidden flex flex-col"
      style={{ background: SURFACE_CARD }}
    >
      <div className="overflow-x-auto relative max-w-full">
        <table className="w-full text-left border-collapse text-xs min-w-[4200px]">
          <thead className="sticky top-0 z-20">
            <tr
              className="border-b border-white/10 font-bold uppercase tracking-wide text-[11px] select-none"
              style={{ background: SURFACE_HEAD }}
            >
              <th className="w-16 border-r border-white/8 px-2 py-3 text-center text-white/30" style={{ background: SURFACE_HEAD }}>
                Ações
              </th>

              {CONTROLE_SMC_COLUMNS.map((column) => {
                const style = GROUP_STYLES[column.group];
                return (
                  <th
                    key={column.key}
                    onClick={() => onToggleSort(column.key)}
                    className={`px-3 py-3 hover:bg-white/5 cursor-pointer border-r border-white/8 ${style.bg} ${style.text} ${column.align === "right" ? "text-right" : ""}`}
                    style={{ width: column.width, minWidth: column.width }}
                  >
                    <div className={`flex items-center gap-1 ${column.align === "right" ? "justify-end" : ""}`}>
                      {column.header}
                      {sortField === column.key ? (
                        <ArrowUpDown className="w-3.5 h-3.5" />
                      ) : null}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group"
              >
                <td className="border-r border-white/8 px-2 py-1.5 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onEditRow(row)}
                      title="Editar núcleo"
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-blue-400 hover:bg-white/5 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteRow(row)}
                      title="Excluir núcleo"
                      className="w-6 h-6 flex items-center justify-center rounded text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>

                {CONTROLE_SMC_COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-1.5 border-r border-white/8 text-slate-200 truncate ${column.align === "right" ? "text-right" : ""}`}
                    style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
                    title={typeof row[column.key] === "string" ? (row[column.key] as string) : undefined}
                  >
                    {formatCellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))}

            {pageRows.length === 0 && (
              <tr>
                <td colSpan={CONTROLE_SMC_COLUMNS.length + 1} className="px-3 py-10 text-center text-slate-500">
                  Nenhum núcleo para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <div
          className="flex items-center justify-between px-4 py-2.5 border-t border-white/8 text-xs text-slate-400"
          style={{ background: SURFACE_HEAD }}
        >
          <span>
            {rows.length} núcleo{rows.length === 1 ? "" : "s"} · página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-white/10 disabled:opacity-30 hover:bg-white/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
