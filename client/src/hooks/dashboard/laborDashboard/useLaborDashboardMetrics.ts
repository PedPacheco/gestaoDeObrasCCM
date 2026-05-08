import {
  DailySummary,
  GroupSummary,
} from "@/components/dashboard/laborDashboard/LaborDashboard";
import { useMemo } from "react";

interface Props {
  dailyData: DailySummary[];
  groupData: GroupSummary[];
  metaDiaria: number;
  isFiltered: boolean;
}

export function isWeekend(dateStr: string) {
  const [d, m, y] = dateStr.split("/");
  const dow = new Date(+y, +m - 1, +d).getDay();
  return dow === 0 || dow === 6;
}

export function useLaborMetrics({
  dailyData,
  groupData,
  metaDiaria,
  isFiltered,
}: Props) {
  return useMemo(() => {
    const totals = {
      obras: dailyData.reduce((acc, item) => acc + item.totalQtde, 0),
      equipes: dailyData.reduce((acc, item) => acc + (item.teamsTotal ?? 0), 0),
      equipesHoje:
        dailyData.length > 0
          ? (dailyData[dailyData.length - 1]?.teamsTotal ?? 0)
          : 0,
      planejado: dailyData.reduce((acc, item) => acc + item.totalMoPlan, 0),
      programado: dailyData.reduce((acc, item) => acc + item.totalMoProg, 0),
      executado: dailyData.reduce((acc, item) => acc + item.totalMoExec, 0),
    };

    const metaTotal = metaDiaria * dailyData.length;

    const display = isFiltered
      ? {
          obras: groupData.reduce(
            (acc, item) => acc + (item.qtdeWorks ?? 0),
            0,
          ),
          planejado: groupData.reduce((acc, item) => acc + item.totalMoPlan, 0),
          programado: groupData.reduce(
            (acc, item) => acc + item.totalMoProg,
            0,
          ),
          executado: groupData.reduce((acc, item) => acc + item.totalMoExec, 0),
          previsto: groupData.reduce((acc, item) => acc + item.totalMoPrev, 0),
        }
      : {
          planejado: totals.planejado,
          obras: totals.obras,
          programado: totals.programado,
          executado: totals.executado,
        };

    const taxaExecucao =
      display.programado > 0
        ? (display.executado / display.programado) * 100
        : 0;

    const pctMeta100 = (display.programado / metaTotal) * 100;

    const pctMeta108 = (display.programado / (metaTotal * 1.08)) * 100;

    const barByDay = dailyData.map((item) => ({
      dia: item.dataProg.substring(0, 5),
      Programado: Math.round(item.totalMoProg),
      Executado: Math.round(item.totalMoExec),
      Meta: Math.round(metaDiaria),
      "% Meta":
        metaDiaria > 0
          ? +((item.totalMoProg / metaDiaria) * 100).toFixed(1)
          : 0,
      weekend: isWeekend(item.dataProg),
    }));

    const topParceiraData = Object.values(
      groupData.reduce<
        Record<
          string,
          {
            turma: string;
            totalMoProg: number;
            totalMoExec: number;
          }
        >
      >((acc, item) => {
        const key = item.turma;

        if (!acc[key]) {
          acc[key] = {
            turma: item.turma,
            totalMoProg: 0,
            totalMoExec: 0,
          };
        }

        acc[key].totalMoProg += item.totalMoProg;
        acc[key].totalMoExec += item.totalMoExec;

        return acc;
      }, {}),
    )
      .sort((a, b) => b.totalMoProg - a.totalMoProg)
      .slice(0, 10)
      .map((item) => ({
        name: item.turma,
        turma: item.turma,
        Programado: Math.round(item.totalMoProg),
        Executado: Math.round(item.totalMoExec),
        pct:
          item.totalMoProg > 0
            ? Number(((item.totalMoExec / item.totalMoProg) * 100).toFixed(1))
            : 0,
      }));

    return {
      totals,
      display,
      metaTotal,
      taxaExecucao,
      pctMeta100,
      pctMeta108,
      barByDay,
      topParceiraData,
    };
  }, [dailyData, groupData, metaDiaria, isFiltered]);
}
