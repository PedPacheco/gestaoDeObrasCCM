import { Injectable } from '@nestjs/common';
import { IErrorsReportRepository } from 'src/domain/repositories/IErrorsReportRepository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ErrorsReportRepository implements IErrorsReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUndefinedItems(idRegional: number): Promise<any> {
    return await this.prisma.obras.findMany({
      select: {
        id: true,
        ovnota: true,
        data_conclusao: true,
        municipios: { select: { municipio: true, id_regional: true } },
        tipos: { select: { tipo_obra: true } },
        turmas: { select: { turma: true } },
        circuitos: { select: { circuito: true } },
      },
      where: {
        data_conclusao: null,
        ...(idRegional ? { municipios: { id_regional: idRegional } } : {}),
        OR: [
          { id_gpm: 1 },
          { prazo: 0 },
          { id_tipo: 1 },
          { id_turma: 1 },
          { id_circuito: 1 },
        ],
      },
    });
  }
}
