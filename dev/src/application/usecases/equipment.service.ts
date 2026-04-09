import { Inject, Injectable } from '@nestjs/common';
import {
  EQUIPMENT_REPOSITORY,
  IEquipmentRepository,
} from 'src/domain/repositories/IEquipmentRepository';
import { GetEquipmentDTO } from 'src/interface/dtos/equipmentsDTO';

@Injectable()
export class EquipmentService {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY)
    private repo: IEquipmentRepository,
  ) {}

  private buildWhere(query: GetEquipmentDTO[]) {
    const ovnotas = query
      .flatMap((q) => q.ovnota?.split(',') ?? [])
      .filter(Boolean);

    const ordemDiagramas = query
      .flatMap((q) => q.ordemDiagrama?.split(',') ?? [])
      .filter(Boolean);

    const where: any = {
      referencia: { not: null },
    };

    if (ovnotas.length) {
      where.ovnota = { in: ovnotas };
    }

    if (ordemDiagramas.length) {
      where.OR = [
        { diagrama: { in: ordemDiagramas } },
        { ordem_dci: { in: ordemDiagramas } },
        { ordem_dcd: { in: ordemDiagramas } },
        { ordem_dca: { in: ordemDiagramas } },
        { ordem_dcim: { in: ordemDiagramas } },
      ];
    }

    return where;
  }

  async getEquipment(query: GetEquipmentDTO[]) {
    const where = this.buildWhere(query);

    const [works, total] = await Promise.all([
      this.repo.findWorks(where),
      this.repo.countWorks(where),
    ]);

    if (!works.length) return { data: [], total };

    // 🔹 agregação
    const referencias = [
      ...new Set(works.map((o) => o.referencia).filter(Boolean)),
    ];

    const equipments = await this.repo.findEquipmentByCode(referencias);

    const coordMap = new Map(equipments.map((e) => [e.codigo_instalacao, e]));

    // 🔹 transformação final (DTO)
    const data = works
      .map((work) => {
        const equip = coordMap.get(work.referencia!);
        if (!equip) return null;

        return {
          id: work.id,
          ovnota: work.ovnota,
          ordemDiagrama:
            work.diagrama ??
            work.ordem_dci ??
            work.ordem_dca ??
            work.ordem_dcd ??
            work.ordem_dcim,
          referencia: work.referencia,
          tipo_obra: work.tipos?.tipo_obra,
          status: work.status?.status,
          municipio: work.municipios?.municipio,
          circuito: work.circuitos?.circuito,
          bairro: equip.bairro,
          latitude: equip.latitude,
          longitude: equip.longitude,
        };
      })
      .filter(Boolean);

    return { data, total };
  }

  async getWithoutLocation(params: GetEquipmentDTO[]) {
    const where = this.buildWhere(params);

    const works = await this.repo.findWithoutLocationRaw(where);

    // 🔹 transformação no service
    return works.map((o) => ({
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
