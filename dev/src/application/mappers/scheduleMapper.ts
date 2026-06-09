// schedule.mapper.ts
import { Schedule } from 'src/domain/entities/schedule.entity';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';

export class ScheduleMapper {
  static toDomain(work: any): Schedule {
    return Schedule.create({
      id: work.id,
      idWork: work.id_obra,
      dataProg: new Date(work.data_prog),
      startTime: parseTimeToDate(work.hora_ini.toString()),
      finishTime: parseTimeToDate(work.hora_ter.toString()),
      prog: work.prog,
      exec: work.exec,
      observation: work.observacao_programacao,
      serviceType: work.tipo_servico,
      equipment: work.equip_desligado,
      chi: work.chi,
      numDp: work.num_dp,
      temporaryKey: work.chave_provisoria,
      lmTeam: work.equipe_linha_morta,
      lvTeam: work.equipe_linha_viva,
      regulTeam: work.equipe_regularizacao,
      idTechnical: work.id_tecnico,
      idExecutionRestriction: work.id_restricao_execucao,
      responsibility: work.nome_responsavel_execucao,
      observationExecution: work.observacao_execucao,
      idProgRestriction1: work.id_restricao_prog1,
      responsibilityProg: work.responsabilidade1,
      responsibleName: work.nome_responsavel,
      responsibleArea: work.area_responsavel1,
      restrictionStatus: work.status_restricao1,
      resolutionDate: work.data_resolucao1,
      idProgRestriction2: work.id_restricao_prog2,
      responsibilityProg2: work.responsabilidade2,
      responsibleName2: work.nome_responsavel2,
      responsibleArea2: work.area_responsavel2,
      restrictionStatus2: work.status_restricao2,
      resolutionDate2: work.data_resolucao2,
      observationRestriction: work.observacao_restricao,
      idScheduleStatus: work.id_status_programacao,
      idUser: work.id_usuario,
    });
  }
}
