import { Inject, Injectable } from '@nestjs/common';
import {
  ERRORS_REPORT_REPOSITORY,
  IErrorsReportRepository,
} from 'src/domain/repositories/IErrorsReportRepository';

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
}
