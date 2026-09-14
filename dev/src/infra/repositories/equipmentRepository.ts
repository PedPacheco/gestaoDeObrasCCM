import { IEquipmentRepository } from 'src/domain/contracts/IEquipmentRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  FindEquipmentByCodeResponse,
  FindWithoutLocationRawResponse,
} from 'src/domain/types';

@Injectable()
export class EquipmentRepository implements IEquipmentRepository {
  constructor(private prisma: PrismaService) {}

  async findWorks(where: any) {
    return this.prisma.obras.findMany({
      where,
      select: {
        id: true,
        ovnota: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dca: true,
        ordem_dcd: true,
        ordem_dcim: true,
        referencia: true,
        id_circuito: true,
        id_status: true,
        municipios: { select: { municipio: true, mun: true } },
        tipos: { select: { tipo_obra: true } },
        status: { select: { status: true } },
        circuitos: { select: { circuito: true } },
      },
    });
  }

  async countWorks(where: any): Promise<number> {
    return this.prisma.obras.count({ where });
  }

  async findEquipmentByCode(
    codigos: string[],
  ): Promise<FindEquipmentByCodeResponse[]> {
    return this.prisma.equipamentos.findMany({
      where: { codigo_instalacao: { in: codigos } },
      select: {
        codigo_instalacao: true,
        latitude: true,
        longitude: true,
        bairro: true,
      },
    });
  }

  async findWithoutLocationRaw(
    where: any,
  ): Promise<FindWithoutLocationRawResponse[]> {
    return this.prisma.obras.findMany({
      where,
      select: {
        ovnota: true,
        referencia: true,
        executado: true,
        status: { select: { status: true } },
        tipos: { select: { tipo_obra: true } },
        turmas: { select: { turma: true } },
        empreendimento: { select: { empreendimento: true } },
        circuitos: {
          select: {
            circuito: true,
            conjuntos: { select: { conjunto: true } },
          },
        },
      },
    });
  }
}
