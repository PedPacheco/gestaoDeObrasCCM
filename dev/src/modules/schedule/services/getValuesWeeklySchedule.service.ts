import { Injectable } from '@nestjs/common';
import { GetValueWeeklyScheduleDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';
import * as moment from 'moment';

@Injectable()
export class GetValuesWeeklyScheduleService {
  constructor(private prisma: PrismaService) {}

  async getValues(filters: GetValueWeeklyScheduleDTO) {
    const {
      dataFinal,
      dataInicial,
      executado,
      idGrupo,
      idParceira,
      idRegional,
      idTipo,
    } = filters;

    return await this.prisma.obras.findMany({
      where: {
        programacoes: {
          some: {
            data_prog: {
              gte: moment(dataInicial, 'DD/MM/YYYY').toDate(),
              lte: moment(dataFinal, 'DD/MM/YYYY').toDate(),
            },
          },
        },
        municipios: { id_regional: idRegional || undefined },
        id_turma: idParceira || undefined,
        id_tipo: idTipo || undefined,
        tipos: { id_grupo: idGrupo || undefined },
        executado: executado ? null : { not: null },
      },
      select: {
        id: true,
        ovnota: true,
        tipos: {
          select: { tipo_abrev: true },
        },
        programacoes: {
          where: {
            data_prog: {
              gte: moment(dataInicial, 'DD/MM/YYYY').toDate(),
              lte: moment(dataFinal, 'DD/MM/YYYY').toDate(),
            },
          },
          select: { data_prog: true, hora_ini: true, hora_ter: true },
        },
        turmas: {
          select: { turma: true },
        },
      },
    });
  }
}
