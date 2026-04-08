import { Injectable } from '@nestjs/common';

import { EquipamentosFilter, IEquipamentosRepository } from 'src/domain/repositories/IEquipamentosRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class EquipamentosRepository implements IEquipamentosRepository {
  constructor(private prisma: PrismaService) {}

  private buildObrasWhere(params: EquipamentosFilter) {
    const where: any = { referencia: { not: null } };

    if (params.ovnotas && params.ovnotas.length > 0) {
      where.ovnota = { in: params.ovnotas };
      return where;
    }

    if (params.idRegional) {
      where.municipios = { id_regional: params.idRegional };
    }

    if (params.idMunicipio !== undefined) {
      where.id_gpm = Array.isArray(params.idMunicipio)
        ? { in: params.idMunicipio }
        : params.idMunicipio;
    }

    if (params.idStatus !== undefined) {
      where.id_status = Array.isArray(params.idStatus)
        ? { in: params.idStatus }
        : params.idStatus;
    }

    if (params.idTipo !== undefined) {
      where.id_tipo = Array.isArray(params.idTipo)
        ? { in: params.idTipo }
        : params.idTipo;
    }

    if (params.idTurma !== undefined) {
      where.id_turma = Array.isArray(params.idTurma)
        ? { in: params.idTurma }
        : params.idTurma;
    }

    if (params.idGrupo !== undefined) {
      where.tipos = {
        ...(where.tipos ?? {}),
        id_grupo: Array.isArray(params.idGrupo)
          ? { in: params.idGrupo }
          : params.idGrupo,
      };
    }

    const execFilter: any = {};
    if (params.executado && !params.pendente) {
      execFilter.exec = { not: null };
    } else if (params.pendente && !params.executado) {
      execFilter.exec = null;
    }

    if (params.startDate || params.endDate) {
      where.programacoes = {
        some: {
          data_prog: {
            ...(params.startDate ? { gte: params.startDate } : {}),
            ...(params.endDate ? { lte: params.endDate } : {}),
          },
          ...execFilter,
        },
      };
    } else if (params.hasProgramacao) {
      where.programacoes = { some: { ...execFilter } };
    }

    return where;
  }

  async findAll(params: EquipamentosFilter): Promise<any[]> {
    const where = this.buildObrasWhere(params);

    const obras = await this.prisma.obras.findMany({
      where,
      ...(params.limit ? { take: params.limit } : {}),
      skip: params.offset ?? 0,
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

    if (obras.length === 0) return [];

    const referencias = [
      ...new Set(obras.map((o) => o.referencia).filter(Boolean)),
    ] as string[];

    const equipamentos = await this.prisma.equipamentos.findMany({
      where: { codigo_instalacao: { in: referencias } },
      select: { codigo_instalacao: true, latitude: true, longitude: true, bairro: true },
    });

    const coordMap = new Map(equipamentos.map((e) => [e.codigo_instalacao, e]));

    return obras
      .map((obra) => {
        const equip = coordMap.get(obra.referencia!);
        if (!equip) return null;

        return {
          id: obra.id,
          ovnota: obra.ovnota,
          referencia: obra.referencia,
          tipo_obra: obra.tipos?.tipo_obra,
          status: obra.status?.status,
          municipio: obra.municipios?.municipio,
          circuito: obra.circuitos?.circuito,
          bairro: equip.bairro,
          latitude: equip.latitude,
          longitude: equip.longitude,
        };
      })
      .filter(Boolean);
  }

  async count(params: Omit<EquipamentosFilter, 'limit' | 'offset'>): Promise<number> {
    return this.prisma.obras.count({ where: this.buildObrasWhere(params) });
  }

  async findWithoutLocation(ovnotas: string[]): Promise<any[]> {
    const obras = await this.prisma.obras.findMany({
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

    return obras.map((o) => ({
      ovnota: o.ovnota,
      referencia: o.referencia ?? '',
      status: o.status?.status ?? '',
      conjunto: o.circuitos?.conjuntos?.conjunto ?? '',
      circuito: o.circuitos?.circuito ?? '',
      empreiteira: o.turmas?.turma ?? '',
      tipo_obra: o.tipos?.tipo_obra ?? '',
      executado: o.executado ?? '',
      empreendimento: o.empreendimento?.empreendimento ?? '',
    }));
  }
}
