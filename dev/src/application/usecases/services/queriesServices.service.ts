import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { GetSelectedServicesParamsInterface } from 'src/interface/types/servicesInterface';
import { GetWorkDetailsService } from '../works/getWorkDetails.service';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { ExportServicesOutput } from '../export/exportServices.service';

@Injectable()
export class QueriesServicesService {
  constructor(
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    private readonly getWorkDetailsService: GetWorkDetailsService,
  ) {}

  async getAllItems(id: number) {
    const services =
      await this.workServicesQueryRepository.getAllServicesOfWork(id);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    const response = services.map((service) => {
      const preco =
        service.servicos_contratos?.preco ??
        service.materiais?.preco.toNumber();

      const qtdeTotal = service.qtde_plan + service.qtde_adicional;

      return {
        id: service.id,
        idObra: service.id_obra,
        operacao: service.operacao,
        ponto: service.ponto,
        numeroOperacao: service.numero_operacao,
        descricaoOperacao: service.descricao_operacao,
        material:
          service.servicos_contratos?.material ?? service.materiais?.codigo,
        textoBreve:
          service.servicos_contratos?.texto_breve ??
          service.materiais?.descricao,
        dataProgramada: service.programacoes?.data_prog,
        qtdePlanejada: service.qtde_plan,
        qtdeAdicional: service.qtde_adicional,
        viabilizado: service.viabilizado,
        qtdeProgramada: service.qtde_prog,
        qtdeRealizada: service.qtde_real,
        tipo: service.materiais?.codigo ? 'M' : 'S',
        valorUnit: preco,
        valorTotal: preco * qtdeTotal,
        valorReal: preco * service.qtde_real,
      };
    });

    return response;
  }

  async getNotScheduledServices(id: number) {
    const services =
      await this.workServicesQueryRepository.getNotScheduledServices(id);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    const response = services.map((service) => {
      const precoServico = service.servicos_contratos?.preco;
      const precoMaterial = service.materiais?.preco;

      const preco = Number(precoServico ?? precoMaterial);

      const viabilizado = service.viabilizado;
      const qtdeAdicional = service.qtde_adicional ?? 0;
      const qtdeRealizada = service.qtde_real ?? 0;

      const qtdeTotal = viabilizado + qtdeAdicional - qtdeRealizada;

      return {
        id: service.id,
        idObra: service.id_obra,
        operacao: service.operacao,
        ponto: service.ponto,
        numeroOperacao: service.numero_operacao,
        descricaoOperacao: service.descricao_operacao,
        material:
          service.servicos_contratos?.material ?? service.materiais?.codigo,
        textoBreve:
          service.servicos_contratos?.texto_breve ??
          service.materiais?.descricao,
        dataProgramada: service.programacoes?.data_prog,
        qtdePlanejada: service.qtde_plan,
        qtdeAdicional: service.qtde_adicional,
        viabilizado: service.viabilizado,
        qtdeRealizada: service.qtde_real,
        tipo: service.materiais?.codigo ? 'M' : 'S',
        valorUnit: preco,
        valorTotal: preco * qtdeTotal,
        valorReal: preco * service.qtde_real,
      };
    });

    return response;
  }

  async getSelectedServices(params: GetSelectedServicesParamsInterface) {
    const services =
      await this.workServicesQueryRepository.getSelectedServices(params);

    if (!services) {
      throw new NotFoundException('Obra não encontrada');
    }

    return services.map((service) => {
      const preco =
        service.servicos_contratos?.preco ??
        service.materiais?.preco.toNumber();

      return {
        id: service.id,
        idObra: service.id_obra,
        operacao: service.operacao,
        ponto: service.ponto,
        numeroOperacao: service.numero_operacao,
        descricaoOperacao: service.descricao_operacao,
        material:
          service.servicos_contratos?.material ?? service.materiais?.codigo,
        textoBreve:
          service.servicos_contratos?.texto_breve ??
          service.materiais?.descricao,
        dataProgramada: service.programacoes.data_prog,
        qtdePlanejada: service.qtde_plan,
        qtdeProgramada: service.qtde_prog,
        qtdeRealizada: service.qtde_real,
        qtdeAdicional: service.qtde_adicional,
        viabilizado: service.viabilizado,
        tipo: service.materiais?.codigo ? 'M' : 'S',
        valorUnit: preco,
        valorProg: preco * service.qtde_prog,
        valorReal: preco * service.qtde_real,
        equipe: service.equipes.equipe,
        encarregado: service.equipes.encarregado,
        perfil: service.equipes.perfil,
      };
    });
  }

  async getServiceScheduleHistory(id: number) {
    const services =
      await this.workServicesQueryRepository.getServiceScheduleHistory(id);

    return services.map((item) => {
      const descricao =
        item.servicos?.servicos_contratos?.texto_breve ??
        item.servicos?.materiais?.descricao;

      const codigo =
        item.servicos?.servicos_contratos?.material ??
        item.servicos?.materiais?.codigo;

      return {
        id: item.id,
        idProg: item.id_programacao,
        idServico: item.id_servico,
        operacao: item.servicos.operacao,
        numeroOperacao: item.servicos.numero_operacao,
        descricaoOperacao: item.servicos.descricao_operacao,
        ponto: item.servicos.ponto,
        codigo,
        textoBreve: descricao,
        tipo: item.servicos?.materiais?.codigo ? 'M' : 'S',
        dataProgramada: item.programacoes?.data_prog,
        qtdeProgramada: item.prog,
        qtdePlanejada: item.servicos.qtde_plan,
        qtdeViabilizado: item.servicos.viabilizado,
        qtdeAdicional: item.adicional,
        qtdeRealizada: item.real,
        equipe: item.equipes.equipe,
        perfil: item.equipes.perfil,
      };
    });
  }

  async getServiceContracts(idWork: number) {
    const work = await this.getWorkDetailsService.get(idWork);

    const idParceira = work?.id_turma;

    const data =
      await this.workServicesQueryRepository.getServicesContracts(idParceira);

    return data;
  }

  async getServicesToExportation(params: {
    dataFinal: string;
    dataInicial: string;
    idParceira: number;
    idEquipe?: number[];
  }): Promise<ExportServicesOutput[]> {
    const response =
      await this.workServicesQueryRepository.getServicesToExportation({
        ...params,
        idEquipe: params.idEquipe ?? [],
      });

    const documentsMap = new Map<string, any>();

    for (const obra of response) {
      const programacoesMap = new Map(
        obra.programacoes.map((programacao) => [programacao.id, programacao]),
      );

      for (const servico of obra.servicos) {
        if (!servico.id_programacao || !servico.id_equipe) {
          continue;
        }

        const programacao = programacoesMap.get(servico.id_programacao);

        if (!programacao) {
          continue;
        }

        const key = `${obra.ovnota}-${programacao.id}-${servico.id_equipe}`;

        let document = documentsMap.get(key);

        if (!document) {
          document = {
            ovnota: obra.ovnota,
            ordemDiagrama:
              obra.diagrama ??
              obra.ordem_dci ??
              obra.ordem_dca ??
              obra.ordem_dcd ??
              obra.ordem_dcim,
            referencia: obra.referencia,
            tipo_obra: obra.tipos.tipo_obra,
            municipio: obra.municipios.municipio,
            circuito: obra.circuitos.circuito,
            conjunto: obra.circuitos.conjuntos.conjunto,
            parceira: obra.turmas.turma,
            empreendimento: obra.empreendimento.empreendimento,

            programacao: {
              data_prog: programacao.data_prog,
              prog: programacao.prog,
              exec: programacao.exec,
              hora_ini: programacao.hora_ini,
              hora_ter: programacao.hora_ter,
              tipo_servico: programacao.tipo_servico,
              observacao_programacao: programacao.observacao_programacao,
              equip_desligado: programacao.equip_desligado,
              chi: programacao.chi,
              num_dp: programacao.num_dp,
              chave_provisoria: programacao.chave_provisoria,
              equipe_linha_morta: programacao.equipe_linha_morta,
              equipe_linha_viva: programacao.equipe_linha_viva,
              equipe_regularizacao: programacao.equipe_regularizacao,
            },

            servicos: [],
          };

          documentsMap.set(key, document);
        }

        const codigo =
          servico.servicos_contratos?.material ??
          servico.materiais?.codigo ??
          '-';

        const descricao =
          servico.servicos_contratos?.texto_breve ??
          servico.materiais?.descricao ??
          '-';

        document.servicos.push({
          equipe: servico.equipes?.equipe ?? null,
          operacao: servico.operacao,
          ponto: servico.ponto,
          prog: (servico.qtde_adicional ?? 0) + (servico.viabilizado ?? 0),
          real: null,
          codigo,
          descricao,
        });
      }
    }

    return Array.from(documentsMap.values());
  }

  async getMaterials() {
    return await this.workServicesQueryRepository.getMaterialsContract();
  }

  async getTeamsServices(idWork: number) {
    const work = await this.getWorkDetailsService.get(idWork);

    const idParceira = work?.id_turma;

    const data =
      await this.workServicesQueryRepository.getTeamsServices(idParceira);

    return data;
  }

  async getServiceOptions(id: number) {
    return await this.workServicesQueryRepository.getServiceOptions(id);
  }
}
