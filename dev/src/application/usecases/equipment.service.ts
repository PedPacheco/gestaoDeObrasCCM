import { Inject, Injectable } from '@nestjs/common';
import {
  EQUIPMENT_REPOSITORY,
  IEquipmentRepository,
} from 'src/domain/repositories/IEquipmentRepository';

@Injectable()
export class EquipmentService {
  constructor(
    @Inject(EQUIPMENT_REPOSITORY)
    private repo: IEquipmentRepository,
  ) {}

  async getEquipment(query: any) {
    const params = {
      ovnotas: query.ovnotas?.split(',') ?? undefined,
    };

    const where: any = { referencia: { not: null } };

    if (params.ovnotas?.length) {
      where.ovnota = { in: params.ovnotas };
    }

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

  async getWithoutLocation(ovnotasParam: string) {
    const ovnotas = ovnotasParam
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ovnotas.length) return [];

    const works = await this.repo.findWithoutLocationRaw(ovnotas);

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
