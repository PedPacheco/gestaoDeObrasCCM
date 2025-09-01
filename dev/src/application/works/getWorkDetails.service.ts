import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  GET_WORKS_DETAILS_REPOSITORY,
  IGetWorksDetailsRepository,
} from 'src/domain/repositories/works/IGetWorksDetailsRepository';

@Injectable()
export class GetWorkDetailsService {
  constructor(
    @Inject(GET_WORKS_DETAILS_REPOSITORY)
    private readonly getWorksDetailsRepository: IGetWorksDetailsRepository,
  ) {}

  async get(id: number) {
    const work = await this.getWorksDetailsRepository.get(id);

    if (!work) {
      throw new NotFoundException('Obra não encontrada');
    }

    const response = {
      ...work,
      circuitos: work.circuitos.circuito,
      conjunto: work.circuitos.conjuntos.conjunto,
      empreendimento: work.empreendimento.empreendimento,
      municipios: work.municipios.municipio,
      tipos: work.tipos.tipo_obra,
      grupo: work.tipos.id_grupo,
      programacoes: work.programacoes.map((programacao) => ({
        id: programacao.id,
        data_prog: programacao.data_prog,
        hora_ini: programacao.hora_ini,
        hora_ter: programacao.hora_ter,
        tipo_servico: programacao.tipo_servico,
        prog: programacao.prog,
        exec: programacao.exec,
        observ_programacao: programacao.observ_programacao,
        chi: programacao.chi,
        num_dp: programacao.num_dp,
        chave_provisoria: programacao.chave_provisoria,
        equipe_linha_morta: programacao.equipe_linha_morta,
        equipe_linha_viva: programacao.equipe_linha_viva,
        equipe_regularizacao: programacao.equipe_regularizacao,
        tecnico: programacao.tecnicos?.tecnico,
        restricao: programacao.programacoes_restricao_execucao?.restricao,
        nome_responsavel_execucao: programacao.nome_responsavel_execucao,
        status_programacao: programacao.status_programacao.status_programacao,
        validada: programacao.validada,
        confirmada: programacao.confirmada,
      })),
    };

    return response;
  }
}
