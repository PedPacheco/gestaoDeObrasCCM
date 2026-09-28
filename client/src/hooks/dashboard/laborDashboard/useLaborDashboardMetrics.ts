import { DailySummary, GroupSummary } from "@/types/dashboard/labor/labor";
import dayjs, { Dayjs } from "dayjs";
import { useMemo } from "react";

interface Props {
  dailyData: DailySummary;
  groupData: GroupSummary;
  dailyGoal: number;
  startDate: Dayjs; // período aplicado
  endDate: Dayjs; // período aplicado
}

export function isWeekend(dateStr: string) {
  const [d, m, y] = dateStr.split("/");
  const dow = new Date(+y, +m - 1, +d).getDay();
  return dow === 0 || dow === 6;
}

function countBusinessDays(start: Dayjs, end: Dayjs): number {
  let count = 0;
  let current = start.startOf("day");

  while (!current.isAfter(end, "day")) {
    const weekday = current.day();
    if (weekday !== 0 && weekday !== 6) count++;
    current = current.add(1, "day");
  }

  return count;
}

export function useLaborMetrics({
  dailyData,
  groupData,
  dailyGoal,
  endDate,
  startDate,
}: Props) {
  const startKey = startDate.format("YYYY-MM-DD");
  const endKey = endDate.format("YYYY-MM-DD");

  return useMemo(() => {
    const totalGoal = dailyGoal * 22;

    // Linha 2: total do mês distribuído nos dias úteis do período filtrado
    const businessDays = countBusinessDays(dayjs(startKey), dayjs(endKey));

    const periodGoalPerDay =
      businessDays > 0 ? dailyData.totals.totalMoProg / businessDays : 0;

    const display = {
      programacoes: dailyData.totals.totalSchedules,
      programado: dailyData.totals.totalMoProg,
      executado: dailyData.totals.totalMoExec,
      obras: dailyData.totals.totalWorks,
      carteira: groupData.totals.totalWallet,
      equipesRfp: dailyData.totals.totalQtdeRfpTeams,
      equipesCapacidadeExecucao: dailyData.totals.totalExecutionCapacityTeams,
      valorContrato: dailyData.contractValueByMonth.monthlyValue,
      valorContrato108: dailyData.contractValueByMonth.monthlyValue,
      programadoRda: groupData.totals.totalProgRda,
      executadoRda: groupData.totals.totalExecRda,
      carteiraRda: groupData.totals.totalWalletRda,
      programadoBt0: groupData.totals.totalProgBt0,
      executadoBt0: groupData.totals.totalExecBt0,
      carteiraBt0: groupData.totals.totalWalletBt0,
      programadoRecom: groupData.totals.totalProgRecom,
      executadoRecom: groupData.totals.totalExecRecom,
      carteiraRecom: groupData.totals.totalWalletRecom,
      programadoMarket: groupData.totals.totalProgMarket,
      executadoMarket: groupData.totals.totalExecMarket,
      carteiraMarket: groupData.totals.totalWalletMarket,
    };

    const executionRate =
      display.programado > 0
        ? (display.executado / display.programado) * 100
        : 0;

    const pctGoal100 = (display.programado / totalGoal) * 100;

    const pctGoal108 = (display.programado / (totalGoal * 1.085)) * 100;

    const barByDay = dailyData.summary.map((item) => ({
      dia: item.dataProg.substring(0, 5),
      Programado: Math.round(item.totalMoProg),
      Executado: Math.round(item.totalMoExec),
      Meta: Math.round(dailyGoal),
      "Meta Período": periodGoalPerDay,
      "% Meta":
        dailyGoal > 0 ? +((item.totalMoProg / dailyGoal) * 100).toFixed(1) : 0,
      weekend: isWeekend(item.dataProg),
    }));

    const topPartnerData = Object.values(
      groupData.summary.reduce<
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
      display,
      totalGoal,
      periodGoalPerDay,
      executionRate,
      pctGoal100,
      pctGoal108,
      barByDay,
      topPartnerData,
    };
  }, [dailyData, groupData, dailyGoal]);
}
