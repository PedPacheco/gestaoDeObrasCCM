import { IEntryRepository } from 'src/domain/repositories/IEntryRepository';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';
import {
  EntryDayResponse,
  entryResponse,
} from 'src/interface/types/entryInterface';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EntryRespository implements IEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getEntryOfWorksByDay(
    filters: GetEntryOfWorksByDayDTO,
    dateRange: Record<string, Date>,
  ): Promise<EntryDayResponse[]> {
    const { idGrupo, idMunicipio, idParceira, idRegional, idTipo } = filters;

    return await this.prisma.obras.findMany({
      where: {
        entrada: dateRange,
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
        tipos: {
          id_grupo: idGrupo && idGrupo.length > 0 ? { in: idGrupo } : undefined,
        },
        id_tipo: idTipo && idTipo.length > 0 ? { in: idTipo } : undefined,
        id_turma:
          idParceira && idParceira.length > 0 ? { in: idParceira } : undefined,
      },
      select: {
        id: true,
        ovnota: true,
        pep: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dcd: true,
        ordem_dca: true,
        ordem_dcim: true,
        entrada: true,
        prazo: true,
        qtde_planejada: true,
        mo_planejada: true,
        observ_obra: true,
        tipos: {
          select: { tipo_obra: true },
        },
        turmas: {
          select: { turma: true },
        },
        municipios: {
          select: { mun: true },
        },
      },
      orderBy: { entrada: 'asc' },
    });
  }

  async getValuesFromEntry(
    filters: GetEntryOfWorksDTO,
  ): Promise<entryResponse[]> {
    const {
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idTipo,
      ano,
      idCircuito,
    } = filters;

    return await this.prisma.obras.findMany({
      where: {
        id_status: { not: 3 },
        entrada: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`),
        },
        id_gpm:
          idMunicipio && idMunicipio.length > 0
            ? { in: idMunicipio }
            : undefined,
        id_tipo: idTipo && idTipo.length > 0 ? { in: idTipo } : undefined,
        id_circuito:
          idCircuito && idCircuito.length > 0 ? { in: idCircuito } : undefined,
        id_turma:
          idParceira && idParceira.length > 0 ? { in: idParceira } : undefined,
        municipios: {
          id_regional:
            idRegional && idRegional.length > 0
              ? { in: idRegional }
              : undefined,
        },
        tipos: {
          id_grupo: idGrupo && idGrupo.length > 0 ? { in: idGrupo } : undefined,
        },
      },
      select: {
        ovnota: true,
        mo_pend: true,
        mo_planejada: true,
        entrada: true,
        tipos: {
          select: {
            tipo_obra: true,
            grupos: {
              select: {
                grupo: true,
              },
            },
          },
        },
      },
      orderBy: { tipos: { grupos: { grupo: 'asc' } } },
    });
  }
}
