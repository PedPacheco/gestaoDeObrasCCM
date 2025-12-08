import * as moment from 'moment';
import { GetValueWeeklyScheduleDTO } from 'src/interface/dtos/scheduleDTO';

import { Inject, Injectable } from '@nestjs/common';
import {
  GET_SCHEDULE_RESTRICTIONS_REPOSITORY,
  IGetScheduleRestrictionsRepository,
} from 'src/domain/repositories/schedule/IGetScheduleRestrictionsRepository';

@Injectable()
export class GetScheduleRestrictionsService {
  constructor(
    @Inject(GET_SCHEDULE_RESTRICTIONS_REPOSITORY)
    private getSchedulerestrictionsRepository: IGetScheduleRestrictionsRepository,
  ) {}

  async getRestrictions(filters: GetValueWeeklyScheduleDTO) {
    const response =
      await this.getSchedulerestrictionsRepository.getRestrictions(filters);

    const result = response
      .flatMap((work) =>
        work.programacoes.map((programacao) => ({
          id: work.id,
          id_prog: programacao.id,
          ovnota: work.ovnota,
          mun: work.municipios.mun,
          tipo: work.tipos.tipo_obra,
          parceira: work.turmas.turma,
          executado: work.executado,
          data_prog: programacao.data_prog,
          prog: programacao.prog,
          exec: programacao.exec,
          observacao_restricao: programacao.observacao_restricao,
          id_restricao_prog1: programacao.id_restricao_prog1,
          restricao_prog1: programacao.programacoes_restricao_prog1.restricao,
          responsabilidade1: programacao.responsabilidade1,
          nome_responsavel: programacao.nome_responsavel,
          area_responsavel1: programacao.area_responsavel1,
          status_restricao1: programacao.status_restricao1,
          data_resolucao1: programacao.data_resolucao1,
          id_restricao_prog2: programacao.id_restricao_prog2,
          restricao_prog2: programacao.programacoes_restricao_prog2.restricao,
          responsabilidade2: programacao.responsabilidade2,
          nome_responsavel2: programacao.nome_responsavel2,
          area_responsavel2: programacao.area_responsavel2,
          status_restricao2: programacao.status_restricao2,
          data_resolucao2: programacao.data_resolucao2,
        })),
      )
      .sort((a, b) => moment(a.data_prog).diff(moment(b.data_prog)));

    return result;
  }
}
