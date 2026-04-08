import { Inject, Injectable } from '@nestjs/common';

import { EQUIPAMENTOS_REPOSITORY, IEquipamentosRepository } from 'src/domain/repositories/IEquipamentosRepository';

@Injectable()
export class EquipamentosService {
  constructor(
    @Inject(EQUIPAMENTOS_REPOSITORY)
    private repo: IEquipamentosRepository,
  ) {}

  async getEquipamentos(query: {
    idRegional?: string;
    idMunicipio?: string;
    idCircuito?: string;
    idStatus?: string;
    idTipo?: string;
    idTurma?: string;
    idGrupo?: string;
    startDate?: string;
    endDate?: string;
    hasProgramacao?: string;
    executado?: string;
    pendente?: string;
    ovnotas?: string;
    tipoDispositivo?: string;
    limit?: string;
    offset?: string;
  }) {
    const parseIds = (val?: string) => {
      if (!val) return undefined;
      const parts = val.split(',').map(Number).filter((n) => !isNaN(n));
      return parts.length === 1 ? parts[0] : parts;
    };

    const parseDate = (val?: string) => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };

    const idMunicipio = parseIds(query.idMunicipio);
    const idStatus = parseIds(query.idStatus);
    const idTipo = parseIds(query.idTipo);
    const idTurma = parseIds(query.idTurma);
    const idGrupo = parseIds(query.idGrupo);
    const startDate = parseDate(query.startDate);
    const endDate = parseDate(query.endDate);
    const ovnotas = query.ovnotas
      ? query.ovnotas.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const params = {
      idRegional: query.idRegional ? Number(query.idRegional) : undefined,
      idMunicipio: idMunicipio as number | number[] | undefined,
      idCircuito: query.idCircuito ? Number(query.idCircuito) : undefined,
      idStatus: idStatus as number | number[] | undefined,
      idTipo: idTipo as number | number[] | undefined,
      idTurma: idTurma as number | number[] | undefined,
      idGrupo: idGrupo as number | number[] | undefined,
      startDate,
      endDate,
      hasProgramacao: query.hasProgramacao === 'true',
      executado: query.executado === 'true',
      pendente: query.pendente === 'true',
      ovnotas,
      tipoDispositivo: query.tipoDispositivo,
      limit: query.limit ? Number(query.limit) : undefined,
      offset: query.offset ? Number(query.offset) : 0,
    };

    const [data, total] = await Promise.all([
      this.repo.findAll(params),
      this.repo.count(params),
    ]);

    return { data, total };
  }

  async getSemLocalizacao(ovnotasParam: string): Promise<any[]> {
    const ovnotas = ovnotasParam.split(',').map((s) => s.trim()).filter(Boolean);
    if (ovnotas.length === 0) return [];
    return this.repo.findSemLocalizacao(ovnotas);
  }
}
