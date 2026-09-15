import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GET_WORKS_DETAILS_REPOSITORY,
  IGetWorksDetailsRepository,
} from 'src/domain/repositories/works/IGetWorksDetailsRepository';
import { TeamCounterService } from 'src/domain/services/teamCounter.service';
import { QueriesServicesService } from '../services/queriesServices.service';

@Injectable()
export class GetWorkDetailsService {
  constructor(
    @Inject(GET_WORKS_DETAILS_REPOSITORY)
    private readonly getWorksDetailsRepository: IGetWorksDetailsRepository,
    private readonly workServicesQueryService: QueriesServicesService,
  ) {}

  async get(id: number) {
    const [work, services] = await Promise.all([
      await this.getWorksDetailsRepository.get(id),
      await this.workServicesQueryService.getAllItems(id),
    ]);

    if (!work) {
      throw new NotFoundException('Obra não encontrada');
    }

    const { relatorio_viabilidade, ...workData } = work;

    const maoDeObra = services.reduce(
      (acc, service) => {
        const planejado =
          (service.viabilizado + service.qtdeAdicional) * service.valorUnit;
        const executado = service.qtdeRealizada * service.valorUnit;

        acc.planejado += planejado;
        acc.executado += executado;
        acc.pendente += planejado - executado;

        return acc;
      },
      {
        planejado: 0,
        executado: 0,
        pendente: 0,
      },
    );

    const response = {
      ...workData,
      data_envio: relatorio_viabilidade?.data_envio ?? null,
      prazo_viabilidade:
        relatorio_viabilidade?.prazo_viabilidade ?? 'FALTA VIABILIDADE',
      viabilidade_aprovada: relatorio_viabilidade?.aprovada ?? false,
      circuitos: work.circuitos.circuito,
      conjunto: work.circuitos.conjuntos.conjunto,
      empreendimento: work.empreendimento.empreendimento,
      municipios: work.municipios.municipio,
      tipos: work.tipos.tipo_obra,
      grupo: work.tipos.id_grupo,
      idRegional: work.municipios.regionais.id,
      totalProgramado: work.programacoes.reduce((acc, item) => {
        const valor =
          item.exec !== null && item.exec !== 0 ? item.exec : item.prog;

        return acc + valor;
      }, 0),
      moPlanejadaPontoAPonto: maoDeObra.planejado,
      moExecutadoPontoAPonto: maoDeObra.executado,
      moPendentePontoAPonto: maoDeObra.pendente,
      servicos: services,
      programacoes: work.programacoes.map((programacao) => {
        const teams = TeamCounterService.calculate(programacao);
        return {
          id: programacao.id,
          criado_em: programacao.criado_em,
          data_prog: programacao.data_prog,
          hora_ini: programacao.hora_ini,
          hora_ter: programacao.hora_ter,
          tipo_servico: programacao.tipo_servico,
          prog: programacao.prog,
          exec: programacao.exec,
          observacao_programacao: programacao.observacao_programacao,
          equip_desligado: programacao.equip_desligado,
          chi: programacao.chi,
          num_dp: programacao.num_dp,
          chave_provisoria: programacao.chave_provisoria,
          equipe_linha_morta: teams.equipe_linha_morta,
          equipe_linha_viva: teams.equipe_linha_viva,
          equipe_regularizacao: teams.equipe_regularizacao,
          tecnico: programacao.tecnicos?.tecnico,
          restricao: programacao.programacoes_restricao_execucao?.restricao,
          id_restricao_execucao: programacao.id_restricao_execucao,
          nome_responsavel_execucao: programacao.nome_responsavel_execucao,
          status_programacao: programacao.status_programacao.status_programacao,
          validada: programacao.validada,
          confirmada: programacao.confirmada,
          reprovada: programacao.reprovada,
          observacao_restricao: programacao.observacao_restricao,
          observacao_execucao: programacao.observacao_execucao,
          id_restricao_prog1: programacao.id_restricao_prog1,
          responsabilidade1: programacao.responsabilidade1,
          nome_responsavel: programacao.nome_responsavel,
          area_responsavel1: programacao.area_responsavel1,
          status_restricao1: programacao.status_restricao1,
          data_resolucao1: programacao.data_resolucao1,
          id_restricao_prog2: programacao.id_restricao_prog2,
          responsabilidade2: programacao.responsabilidade2,
          nome_responsavel2: programacao.nome_responsavel2,
          area_responsavel2: programacao.area_responsavel2,
          status_restricao2: programacao.status_restricao2,
          data_resolucao2: programacao.data_resolucao2,
          criado_por: programacao.usuario?.nome,
          editado_por: programacao.usuario_ultima_atualizacao?.nome,
        };
      }),
    };

    return response;
  }
}
