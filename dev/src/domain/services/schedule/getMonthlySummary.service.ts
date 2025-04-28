import * as moment from 'moment';
import {
  GET_MONTHLY_SUMMARY_REPOSITORY,
  IGetMonthlySummaryRepository,
} from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetMonthlySummaryService {
  constructor(
    @Inject(GET_MONTHLY_SUMMARY_REPOSITORY)
    private getMonthlySummaryRepository: IGetMonthlySummaryRepository,
  ) {}

  async getSummary(filters: GetMonthlySummaryDTO) {
    const data = await this.getMonthlySummaryRepository.getSummary(filters);

    const response = data.reduce((acc, current) => {
      const dataProg = moment.utc(current.data_prog).format('DD/MM/YYYY');

      let existingDate = acc.find((item) => item.dataProg === dataProg);

      if (!existingDate) {
        existingDate = {
          dataProg,
          totalQtde: 0,
          totalMoProg: 0,
          totalMoExec: 0,
          totalMoPrev: 0,
        };

        acc.push(existingDate);
      }

      const baseMo = current.obras.mo_final ?? current.obras.mo_planejada;
      const moProg = baseMo * (current.prog / 100);
      const moExec = baseMo * (current.exec / 100);
      const moPrev = baseMo * ((current.exec ?? current.prog) / 100);

      existingDate.totalQtde++;
      existingDate.totalMoProg += moProg;
      existingDate.totalMoExec += moExec;
      existingDate.totalMoPrev += moPrev;

      return acc;
    }, []);

    return response;
  }

  async getSecondSummary(filters: GetMonthlySummaryDTO) {
    const data =
      await this.getMonthlySummaryRepository.getSecondSummary(filters);

    const response = data.reduce((acc, current) => {
      const turma = current.turmas.turma;
      const grupo = current.tipos.grupos.grupo;

      let existingKey = acc.find(
        (item) => item.grupo === grupo && item.turma === turma,
      );

      if (!existingKey) {
        existingKey = {
          grupo,
          turma,
          totalMoProg: 0,
          totalMoExec: 0,
          totalMoPrev: 0,
        };

        acc.push(existingKey);
      }

      const baseMo = current.mo_final ?? current.mo_planejada;

      current.programacoes.forEach((item) => {
        const moProg = baseMo * (item.prog / 100);
        const moExec = baseMo * (item.exec / 100);
        const moPrev = baseMo * ((item.exec ?? item.prog) / 100);

        existingKey.totalMoProg += moProg;
        existingKey.totalMoExec += moExec;
        existingKey.totalMoPrev += moPrev;
      });

      return acc;
    }, []);

    return response;
  }
}
