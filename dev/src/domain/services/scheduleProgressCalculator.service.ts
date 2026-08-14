import { Injectable } from '@nestjs/common';

export interface ScheduleTotalsById {
  prog: number;
  exec: number | null;
}

export interface ScheduleProgress extends ScheduleTotalsById {
  idProgramacao: number;
}

@Injectable()
export class ScheduleProgressCalculatorService {
  private isService(item: any): boolean {
    return item.servicos?.materiais === null;
  }

  private calculatePercentage(value: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    const percentage = (value / total) * 100;

    return Number(percentage.toFixed(4));
  }

  /**
   * Agrupa o histórico por id_programacao e retorna prog/exec (%) para
   * TODAS as programações presentes no histórico, contra o totalPlanned
   * atual (já incluindo eventuais acréscimos). Programações futuras
   * (sem execução) naturalmente recebem exec = 0, já que seus itens
   * têm `real` nulo. Não arredonda/capa em 100 — mesmo comportamento
   * que o cálculo original de uma única programação já tinha.
   */
  calculateAllSchedulesProgress(
    history: any[],
    totalPlanned: number,
  ): ScheduleProgress[] {
    const totalsByScheduleId = new Map<
      number,
      {
        prog: number;
        exec: number;
        hasExecution: boolean;
      }
    >();

    for (const item of history) {
      if (!this.isService(item) || item.real === 0) continue;

      const current = totalsByScheduleId.get(item.id_programacao) ?? {
        prog: 0,
        exec: 0,
        hasExecution: false,
      };

      totalsByScheduleId.set(item.id_programacao, {
        prog: current.prog + item.prog,
        exec: current.exec + (item.real ?? 0),
        hasExecution: current.hasExecution || item.real !== null,
      });
    }

    return Array.from(totalsByScheduleId.entries()).map(
      ([idProgramacao, totals]) => ({
        idProgramacao,
        prog: this.calculatePercentage(totals.prog, totalPlanned),
        exec: totals.hasExecution
          ? this.calculatePercentage(totals.exec, totalPlanned)
          : null,
      }),
    );
  }

  /**
   * Prog/exec (%) de uma única programação específica — equivalente a
   * filtrar o resultado de calculateAllSchedulesProgress por scheduleId.
   * Usado no fluxo de finalização, que só precisa da programação atual.
   */
  calculateScheduleProgress(
    history: any[],
    totalPlanned: number,
    scheduleId: number,
  ): ScheduleTotalsById {
    const found = this.calculateAllSchedulesProgress(
      history,
      totalPlanned,
    ).find((item) => item.idProgramacao === scheduleId);

    return { prog: found?.prog ?? 0, exec: found?.exec ?? 0 };
  }

  /**
   * Agrega prog/exec (%) de todas as programações EXCETO a informada,
   * capado em 100. Usado para validar a execução da programação atual
   * contra o que já foi executado nas demais (mesmo comportamento do
   * antigo calculateExecutedFromQuantities do FinalizeServicesService).
   */
  calculateAggregateProgress(
    history: any[],
    totalPlanned: number,
    excludeScheduleId: number,
  ): ScheduleTotalsById {
    const totals = history
      .filter(
        (item) =>
          item.id_programacao !== excludeScheduleId &&
          item.real !== 0 &&
          this.isService(item),
      )
      .reduce(
        (acc, item) => ({
          exec: acc.exec + (item.real ?? 0),
          prog: acc.prog + item.prog,
        }),
        { exec: 0, prog: 0 },
      );

    return {
      exec: Math.min(this.calculatePercentage(totals.exec, totalPlanned), 100),
      prog: Math.min(this.calculatePercentage(totals.prog, totalPlanned), 100),
    };
  }
}
