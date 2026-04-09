import { IEquipmentRepository } from 'src/domain/repositories/IEquipmentRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EquipmentRepository implements IEquipmentRepository {
  constructor(private prisma: PrismaService) {}

  async findWorks(where: any) {
    return this.prisma.obras.findMany({
      where,
      select: {
        id: true,
        ovnota: true,
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

  async findEquipmentByCode(codigos: string[]) {
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

  async findWithoutLocationRaw(ovnotas: string[]) {
    return this.prisma.obras.findMany({
      where: { ovnota: { in: ovnotas } },
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
