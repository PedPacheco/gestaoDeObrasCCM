import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { GetMonthlySummaryDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class GetMonthlySummaryService {
  constructor(private prisma: PrismaService) {}

  async getSummary(filters: GetMonthlySummaryDTO) {
    const { date, idRegional, idParceira, idTipo, idGrupo } = filters;

    const month: number = Number(date?.split('/')[0]);
    const year: number = Number(date?.split('/')[1]);

    const monthInitial = moment
      .utc([year, month - 1])
      .startOf('month')
      .toDate();
    const monthFinal = moment
      .utc([year, month - 1])
      .add(1, 'month')
      .startOf('month')
      .toDate();

    const data = await this.prisma.programacoes.findMany({
      where: {
        data_prog: {
          gte: monthInitial,
          lt: monthFinal,
        },
        obras: {
          tipos: { id_grupo: idGrupo || undefined },
          municipios: { id_regional: idRegional || undefined },
          id_turma: idParceira || undefined,
          id_tipo: idTipo || undefined,
        },
      },
      select: {
        data_prog: true,
        prog: true,
        exec: true,
        obras: {
          select: { mo_final: true, mo_planejada: true },
        },
      },
      orderBy: { data_prog: 'asc' },
    });

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
    const { date, idGrupo, idParceira, idRegional, idTipo } = filters;

    const month: number = Number(date?.split('/')[0]);
    const year: number = Number(date?.split('/')[1]);

    const monthInitial = moment
      .utc([year, month - 1])
      .startOf('month')
      .toDate();
    const monthFinal = moment
      .utc([year, month - 1])
      .add(1, 'month')
      .startOf('month')
      .toDate();

    const data = await this.prisma.obras.findMany({
      where: {
        programacoes: {
          some: { data_prog: { gte: monthInitial, lt: monthFinal } },
        },
        tipos: { id_grupo: idGrupo || undefined },
        municipios: { id_regional: idRegional || undefined },
        id_turma: idParceira || undefined,
        id_tipo: idTipo || undefined,
      },
      select: {
        ovnota: true,
        mo_final: true,
        mo_planejada: true,
        turmas: { select: { turma: true } },
        tipos: { select: { grupos: { select: { grupo: true } } } },
        programacoes: {
          where: {
            data_prog: {
              gte: monthInitial,
              lt: monthFinal,
            },
          },
          select: { data_prog: true, prog: true, exec: true },
        },
      },
    });

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
