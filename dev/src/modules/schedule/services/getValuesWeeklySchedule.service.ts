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
      idMunicipio,
      idRegional,
      idTipo,
    } = filters;

    const works = await this.prisma.obras.findMany({
      where: {
        programacoes: {
          some: {
            exec: executado ? { not: 0 } : null,
            data_prog: {
              gte: moment(dataInicial, 'DD/MM/YYYY').toDate(),
              lte: moment(dataFinal, 'DD/MM/YYYY').toDate(),
            },
          },
        },
        id_status: { not: 3 },
        municipios: {
          id_regional:
            idRegional && idRegional.length > 0
              ? { in: idRegional }
              : undefined,
        },
        id_gpm:
          idMunicipio && idMunicipio.length > 0
            ? { in: idMunicipio }
            : undefined,
        id_turma:
          idParceira && idParceira.length > 0 ? { in: idParceira } : undefined,
        id_tipo: idTipo && idTipo.length > 0 ? { in: idTipo } : undefined,
        tipos: {
          id_grupo: idGrupo && idGrupo.length > 0 ? { in: idGrupo } : undefined,
        },
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

    return works.map((work) => ({
      id: work.id,
      ovnota: work.ovnota,
      tipo_abrev: work.tipos.tipo_abrev,
      programacoes: work.programacoes,
      parceira: work.turmas.turma,
    }));
  }
}
