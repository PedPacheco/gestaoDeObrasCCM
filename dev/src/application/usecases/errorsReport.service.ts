import {
  ERRORS_REPORT_REPOSITORY,
  IErrorsReportRepository,
} from 'src/domain/contracts/IErrorsReportRepository';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ErrorsReportService {
  constructor(
    @Inject(ERRORS_REPORT_REPOSITORY)
    private readonly errorsReportRepository: IErrorsReportRepository,
  ) {}

  async findUndefinedItems(idRegional?: number) {
    const data =
      await this.errorsReportRepository.findUndefinedItems(idRegional);

    const formattedData = data.map(
      ({ municipios, turmas, tipos, circuitos, data_conclusao, ...rest }) => ({
        municipio: municipios.municipio,
        circuito: circuitos.circuito,
        parceira: turmas.turma,
        tipo: tipos.tipo_obra,
        dataConclusao: data_conclusao,
        ...rest,
      }),
    );

    return formattedData;
  }

  async findScheduleError(idRegional?: number) {
    const data =
      await this.errorsReportRepository.findScheduleError(idRegional);

    return data
      .map((obra) => {
        const somaProg = obra.programacoes.reduce(
          (total, p) => total + (p.prog ?? 0),
          0,
        );

        const total = (obra.executado ?? 0) + somaProg;

        return {
          id: obra.id,
          ovnota: obra.ovnota,
          parceira: obra.turmas?.turma,
          executado: obra.executado,
          prog: somaProg,
          total,
        };
      })
      .filter((obra) => obra.total !== 100);
  }

  async findZeroCapex(idRegional?: number) {
    const data = await this.errorsReportRepository.findZeroCapex(idRegional);

    return data.map((work) => ({
      id: work.id,
      ovnota: work.ovnota,
      ordemDiagrama: work.diagrama
        ? work.diagrama
        : work.ordem_dci
          ? work.ordem_dci
          : work.ordem_dcim,
      entrada: work.entrada,
      municipio: work.municipios.mun,
      tipo: work.tipos.tipo_obra,
      moPlanejada: work.mo_planejada,
      qtdePlanejada: work.qtde_planejada,
    }));
  }

  async findExecutionDifferential(idRegional?: number) {
    const data =
      await this.errorsReportRepository.findExecutionDifferential(idRegional);

    return data
      .map((work) => {
        const somaExec = work.programacoes.reduce(
          (acc, work) => acc + (work.exec ?? 0),
          0,
        );

        return {
          id: work.id,
          ovnota: work.ovnota,
          executado: work.executado ?? 0,
          somaExec,
        };
      })
      .filter((work) => work.executado !== work.somaExec);
  }

  async findDivergentConclusion(idRegional?: number) {
    const data =
      await this.errorsReportRepository.findDivergentConclusion(idRegional);

    return data
      .filter((work) => work.programacoes.length > 0)
      .map((work) => ({
        id: work.id,
        ovnota: work.ovnota,
        dataConclusao: work.data_conclusao,
        dataProgramada: work.programacoes[0].data_prog,
      }))
      .filter(
        (work) =>
          work.dataConclusao.getTime() !== work.dataProgramada.getTime(),
      );
  }

  async findWorksWithoutYearPlan(idRegional?: number) {
    const data =
      await this.errorsReportRepository.findWorksWithoutYearPlan(idRegional);

    return data
      .map(({ ano_plan, id, ovnota, ordem_dci }) => ({
        id,
        ovnota,
        ordemDci: ordem_dci,
        anoPlano: ano_plan,
      }))
      .filter((work) => {
        const actualYear = new Date().getFullYear();

        return work.anoPlano === null || work.anoPlano !== actualYear;
      });
  }

  async findRepeatedWorks(idRegional?: number) {
    const data =
      await this.errorsReportRepository.findRepeatedWorks(idRegional);

    const map = new Map<string, any[]>();

    for (const work of data) {
      const key = [
        // work.ovnota,
        work.diagrama,
        work.ordem_dci,
        work.ordem_dca,
        work.ordem_dcd,
        work.ordem_dcim,
      ].join('|');

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(work);
    }

    const duplicated = Array.from(map.values())
      .filter((group) => group.length > 1)
      .flat();

    return duplicated.map((work) => ({
      id: work.id,
      ovnota: work.ovnota,
      diagrama: work.diagrama,
      ordemDci: work.ordem_dci,
      ordemDca: work.ordem_dca,
      ordemDcd: work.ordem_dcd,
      ordemDcim: work.ordem_dcim,
    }));
  }
}
