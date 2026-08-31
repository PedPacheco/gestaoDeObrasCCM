import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/repositories/IFeasibilityRepository';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

export type StatusFeasibility = 'FORA DO PRAZO' | 'DENTRO DO PRAZO';

@Injectable()
export class FeasibilityService {
  constructor(
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
  ) {}

  async feasibilityExists(id: number) {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }

    return await this.feasibilityRepository.exists(id);
  }

  async getRejections(workId: number) {
    const response = await this.feasibilityRepository.getRejections(workId);

    return response.map((item) => ({
      descricao: item.descricao,
      motivo: item.motivo,
      usuario: item.novo_tabela_usuarios.nome,
      criado_em: item.criado_em,
    }));
  }

  async exportFeasibility(
    startDate: string,
    endDate: string,
    idPartner?: number[],
  ) {
    const data = await this.feasibilityRepository.exportFeasibility(
      startDate,
      endDate,
      idPartner,
    );

    return data.flatMap((obra) =>
      obra.servicos.map((service) => {
        const preco =
          service.servicos_contratos?.preco ??
          service.materiais?.preco.toNumber() ??
          0;

        const qtdeTotal =
          (service.qtde_plan ?? 0) + (service.qtde_adicional ?? 0);

        return {
          ovnota: obra.ovnota,
          ordemDiagrama:
            obra.diagrama ??
            obra.ordem_dci ??
            obra.ordem_dca ??
            obra.ordem_dcd ??
            obra.ordem_dcim,
          data_envio: obra.relatorio_viabilidade.data_envio,
          operacao: service.operacao,
          ponto: service.ponto,
          numeroOperacao: service.numero_operacao,
          descricaoOperacao: service.descricao_operacao,
          material:
            service.servicos_contratos?.material ?? service.materiais?.codigo,
          textoBreve:
            service.servicos_contratos?.texto_breve ??
            service.materiais?.descricao,
          qtdePlanejada: service.qtde_plan,
          viabilizado: service.viabilizado,
          tipo: service.materiais?.codigo ? 'M' : 'S',
          valorUnit: preco,
          valorTotal: preco * qtdeTotal,
          diferença: service.qtde_plan - service.viabilizado,
          alterado: service.viabilizado !== service.qtde_plan ? 'Sim' : 'Não',
        };
      }),
    );
  }
}
