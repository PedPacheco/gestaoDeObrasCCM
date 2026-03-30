"use client";

import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import { Cookies } from "react-cookie";

import { fetchData } from "@/actions/fetchData.action";
import { FormatCurrency, formatPercentage } from "@/utils/formatValue";
import { TableCellsIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  Chip,
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  Tooltip,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";

import { ParamsInterface } from "../GoalsTable";
import MetasTable from "./MetasTable";
import StatCard from "./StatCard";

// ── Slide-up transition ──────────────────────────────────────────────────────
const SlideUp = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface MetasProgramacoesModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  params: ParamsInterface | null;
  label: string;
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MetasProgramacoesModal({
  open,
  setOpen,
  params,
  label,
}: MetasProgramacoesModalProps) {
  const cookies = new Cookies();
  const token = cookies.get("token");

  const [data, setData] = useState<{ works: any[]; totals: any }>({
    works: [],
    totals: {
      total_obras: 0,
      total_mo_planejada: 0,
      total_mo_exec: 0,
      total_qtde_planejada: 0,
    },
  });

  useEffect(() => {
    if (!open || !params) return;

    const fetchGoalsSchedule = async () => {
      try {
        const { mes, ano, regional, parceira, ...rest } = params;

        const dataInicial = dayjs()
          .year(ano)
          .month(mes - 1)
          .startOf("month")
          .format("DD/MM/YYYY");

        const dataFinal = dayjs()
          .year(ano)
          .month(mes - 1)
          .endOf("month")
          .format("DD/MM/YYYY");

        const formattedParams = {
          ...rest,
          dataInicial,
          dataFinal,
          pendente: false,
        };

        const response = await fetchData(
          `${process.env.NEXT_PUBLIC_API_URL}/programacao/mensal`,
          formattedParams as any,
          token,
        );

        setData(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      }
    };

    fetchGoalsSchedule();
  }, [open, params, token]);

  return (
    <>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        TransitionComponent={SlideUp}
        maxWidth={false}
        PaperProps={{
          className:
            "w-full !rounded-xl !shadow-2xl !m-4 !max-h-[90vh] overflow-hidden",
          sx: { display: "flex", flexDirection: "column" },
        }}
        BackdropProps={{
          sx: {
            backdropFilter: "blur(3px)",
            backgroundColor: "rgba(26,31,46,0.5)",
          },
        }}
      >
        <DialogContent className="!p-0 flex flex-col overflow-hidden mb-6">
          {/* ── HEADER ── */}
          <div className="relative bg-[#1a1f2e] px-6 py-[17px] flex items-center justify-between flex-shrink-0">
            <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#2ecc71]" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-500/15 border border-green-500/25">
                <TableCellsIcon fontSize={18} color="#2ecc71" />
              </div>
              <div>
                <h2 className="font-['Syne',sans-serif] text-lg font-bold text-white uppercase tracking-[0.05em]">
                  Metas Programações
                </h2>
                <p className="text-base text-white/40 mt-0.5  tracking-wide">
                  {`${params?.regional} · ${params?.parceira} · ${params?.ano}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Chip
                label={label}
                sx={{
                  bgcolor: "rgba(46,204,113,0.16)",
                  color: "#2ecc71",
                  border: "1px solid rgba(46,204,113,0.28)",
                  fontSize: "22",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  height: 24,
                }}
              />
              <Chip
                label={`${data.totals.total_obras} REGISTROS`}
                sx={{
                  bgcolor: "rgba(255,255,255,0.07)",
                  color: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: "32",
                  fontWeight: 600,
                  height: 32,
                }}
              />
              <Tooltip title="Fechar" arrow placement="left">
                <IconButton
                  onClick={() => setOpen(false)}
                  size="small"
                  sx={{
                    ml: 0.5,
                    width: 31,
                    height: 31,
                    bgcolor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "7px",
                    color: "rgba(255,255,255,0.45)",
                    "&:hover": {
                      bgcolor: "rgba(231,76,60,0.15)",
                      borderColor: "rgba(231,76,60,0.3)",
                      color: "#e74c3c",
                    },
                  }}
                >
                  <XMarkIcon fontSize={14} />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {/* ── STATS BAR ── */}
          <div className="flex bg-gray-50 border-b border-gray-200 flex-shrink-0">
            <StatCard
              label="MO Programado"
              value={FormatCurrency(data.totals.total_mo_planejada)}
              valueClass="text-green-700"
            />
            <StatCard
              label="MO Executado"
              value={FormatCurrency(data.totals.total_mo_exec)}
              valueClass="text-green-700"
            />
            <StatCard
              label="Plan (km)"
              value={data.totals.total_qtde_planejada
                .toFixed(2)
                .replace(".", ",")}
              valueClass="text-blue-600"
            />
            <StatCard
              label="Exec. Geral"
              value={formatPercentage(data.totals.total_exec)}
              valueClass="text-green-700"
            />
          </div>

          {/* ── TABLE (scrollable) ── */}
          <MetasTable rows={data.works} />
        </DialogContent>
      </Dialog>
    </>
  );
}
