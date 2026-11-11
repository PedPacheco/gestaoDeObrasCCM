import { Injectable } from '@nestjs/common';

export interface PointByPointServiceItem {
  idProg: number;
  tipo: string;
  qtdeProgramada: number;
  qtdeRealizada: number;
  preco: number;
}

export interface PointByPointCost {
  planejado: number;
  executado: number;
}

@Injectable()
export class PointByPointCostService {
  public calculate(services: PointByPointServiceItem[]): PointByPointCost {
    return services.reduce<PointByPointCost>(
      (acc, service) => {
        if (service.tipo === 'M') return acc;

        acc.planejado += (service.qtdeProgramada ?? 0) * service.preco;
        acc.executado += (service.qtdeRealizada ?? 0) * service.preco;

        return acc;
      },
      { planejado: 0, executado: 0 },
    );
  }

  public groupByScheduleId(
    services: PointByPointServiceItem[],
  ): Map<number, PointByPointServiceItem[]> {
    const map = new Map<number, PointByPointServiceItem[]>();

    for (const item of services) {
      const list = map.get(item.idProg);

      if (list) list.push(item);
      else map.set(item.idProg, [item]);
    }

    return map;
  }
}
