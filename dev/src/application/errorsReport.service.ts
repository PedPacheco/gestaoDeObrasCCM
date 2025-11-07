import {
  ERRORS_REPORT_REPOSITORY,
  IErrorsReportRepository,
} from 'src/domain/repositories/IErrorsReportRepository';

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
      ({ municipios, turmas, tipos, circuitos, ...rest }) => ({
        municipio: municipios.municipio,
        circuito: circuitos.circuito,
        parceira: turmas.turma,
        tipo: tipos.tipo_obra,
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
}
