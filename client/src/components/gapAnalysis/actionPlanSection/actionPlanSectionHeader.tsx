import { ACTION_PLAN_SECTION_HEADER_GROUPS } from "@/constants/gapAnalysis/gapAnalysis";
import { TableCell, TableHead, TableRow } from "@mui/material";

export function ActionPlanSectionHeader() {
  return (
    <TableHead>
      {/* Título */}
      <TableRow
        style={{ background: "#071220" }}
        className="border-b border-white/10"
      >
        <TableCell
          colSpan={12}
          align="center"
          className=" !border-b !border-white/10 !bg-[#071220] !py-4 !text-center !text-sm !font-black !uppercase !tracking-[0.2em] !text-white"
        >
          PLANO DE AÇÃO - AUDITORIA DE SEGURANÇA - GAP ANALYSIS
        </TableCell>
      </TableRow>
      {/* Grupos */}
      <TableRow className="bg-[#071220]">
        <TableCell
          rowSpan={2}
          colSpan={2}
          className="!bg-[#071220] !text-slate-200 !font-black !uppercase !tracking-wider !border-r !border-white/10 !align-middle"
        >
          Contratada
        </TableCell>

        <TableCell
          rowSpan={2}
          className=" !bg-[#071220] !text-slate-200 !font-black !uppercase !border-r !border-white/10 !align-middle !text-center"
        >
          Data do GAP
        </TableCell>

        <TableCell
          rowSpan={2}
          className=" !bg-[#071220] !text-slate-200 !font-black !uppercase !border-r !border-white/10 !align-middle !text-center"
        >
          Score Final
        </TableCell>

        {ACTION_PLAN_SECTION_HEADER_GROUPS.map(
          ({ label, colSpan, className }) => (
            <TableCell
              key={label}
              colSpan={colSpan}
              className={` !text-center !font-bold !py-3 ${className}`}
            >
              <div className="flex items-center justify-center gap-2">
                {label}
              </div>
            </TableCell>
          ),
        )}

        <TableCell
          rowSpan={2}
          className=" !bg-[#071220] !text-slate-200 !font-black !uppercase !border-r !border-white/10 !align-middle !text-center"
        >
          Status
        </TableCell>

        <TableCell
          rowSpan={2}
          className=" !bg-[#071220] !text-slate-200 !font-black !uppercase !align-middle"
        >
          Observações
        </TableCell>
      </TableRow>

      <TableRow className="bg-[#071220]">
        {ACTION_PLAN_SECTION_HEADER_GROUPS.flatMap((group) =>
          group.children.map((child) => (
            <TableCell
              key={`${group.label}-${child.label}`}
              className={` !text-center !text-[11px] !font-medium !uppercase !tracking-wider !py-2 ${child.className}`}
            >
              {child.label}
            </TableCell>
          )),
        )}
      </TableRow>
    </TableHead>
  );
}
